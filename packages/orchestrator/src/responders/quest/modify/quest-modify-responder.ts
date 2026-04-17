/**
 * PURPOSE: Modifies a quest via questModifyBroker and auto-resumes the orchestration loop for gate approval transitions
 *
 * USAGE:
 * const result = await QuestModifyResponder({ questId: 'add-auth', input: {...} });
 * // Returns ModifyQuestResult with success status
 */

import {
  chatEntryContract,
  filePathContract,
  processIdContract,
} from '@dungeonmaster/shared/contracts';
import type { ChatEntry, QuestId } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestResult } from '@dungeonmaster/shared/contracts';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { autoResumableQuestStatusesStatics } from '../../../statics/auto-resumable-quest-statuses/auto-resumable-quest-statuses-statics';
import { streamJsonToChatEntryTransformer } from '../../../transformers/stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';

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
              onAgentEntry: ({ slotIndex, entry, sessionId }) => {
                const rawLine: unknown = Reflect.get(entry, 'raw');
                if (typeof rawLine !== 'string') return;
                const parsed = claudeLineNormalizeBroker({ rawLine });
                let entries: ChatEntry[];
                if (parsed === null) {
                  // Plain-text line (e.g. ward build/test output) — emit as assistant text entry
                  if (rawLine.length === 0) return;
                  entries = [
                    chatEntryContract.parse({
                      role: 'assistant',
                      type: 'text',
                      content: rawLine,
                    }),
                  ];
                } else {
                  entries = streamJsonToChatEntryTransformer({ parsed }).entries;
                }
                if (entries.length === 0) return;
                orchestrationEventsState.emit({
                  type: 'chat-output',
                  processId,
                  payload: {
                    processId,
                    slotIndex,
                    entries,
                    ...(sessionId === undefined ? {} : { sessionId }),
                  },
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
