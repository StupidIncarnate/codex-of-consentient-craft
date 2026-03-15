/**
 * PURPOSE: Modifies a quest via questModifyBroker and auto-resumes the orchestration loop for gate approval transitions
 *
 * USAGE:
 * const result = await QuestModifyResponder({ questId: 'add-auth', input: {...} });
 * // Returns ModifyQuestResult with success status
 */

import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestResult } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { autoResumableQuestStatusesStatics } from '../../../statics/auto-resumable-quest-statuses/auto-resumable-quest-statuses-statics';

export const QuestModifyResponder = async ({
  questId,
  input,
}: {
  questId: string;
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  const result = await questModifyBroker({ input: { ...input, questId } as ModifyQuestInput });

  if (result.success && input.status) {
    const shouldAutoResume = autoResumableQuestStatusesStatics.some((s) => s === input.status);

    if (shouldAutoResume) {
      const typedQuestId = questId as QuestId;

      const existingProcess = orchestrationProcessesState.findByQuestId({
        questId: typedQuestId,
      });

      if (!existingProcess) {
        const processId = processIdContract.parse(`proc-${crypto.randomUUID()}`);
        const abortController = new AbortController();

        orchestrationProcessesState.register({
          orchestrationProcess: {
            processId,
            questId: typedQuestId,
            kill: () => {
              abortController.abort();
            },
          },
        });

        questFindQuestPathBroker({ questId: typedQuestId })
          .then(async ({ guildId }) => {
            const guild = await guildGetBroker({ guildId });
            const startPath = filePathContract.parse(guild.path);

            return questOrchestrationLoopBroker({
              processId,
              questId: typedQuestId,
              startPath,
              onAgentEntry: ({ slotIndex, entry }) => {
                orchestrationEventsState.emit({
                  type: 'chat-output',
                  processId,
                  payload: { processId, slotIndex, entry },
                });
              },
              abortSignal: abortController.signal,
            });
          })
          .then(() => {
            orchestrationProcessesState.remove({ processId });
          })
          .catch((error: unknown) => {
            process.stderr.write(
              `Orchestration loop failed for quest ${typedQuestId}: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
            );
            orchestrationProcessesState.remove({ processId });
          });
      }
    }
  }

  return result;
};
