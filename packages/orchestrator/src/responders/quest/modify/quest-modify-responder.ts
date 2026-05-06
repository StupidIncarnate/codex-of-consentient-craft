/**
 * PURPOSE: Modifies a quest via questModifyBroker and auto-resumes the orchestration loop for gate approval transitions
 *
 * USAGE:
 * const result = await QuestModifyResponder({ questId: 'add-auth', input: {...} });
 * // Returns ModifyQuestResult with success status
 */

import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestWorkItemId, SessionId } from '@dungeonmaster/shared/contracts';

import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { buildOrchestrationLoopOnAgentEntryTransformer } from '../../../transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer';
import { chatStreamProcessHandleBroker } from '../../../brokers/chat/stream-process-handle/chat-stream-process-handle-broker';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestResult } from '@dungeonmaster/shared/contracts';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { isAutoResumableQuestStatusGuard } from '@dungeonmaster/shared/guards';

export const QuestModifyResponder = async ({
  questId,
  input,
}: {
  questId: string;
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  const result = await questModifyBroker({ input: { ...input, questId } as ModifyQuestInput });

  if (result.success && input.status) {
    if (isAutoResumableQuestStatusGuard({ status: input.status })) {
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

        // Per-slot sessionId memo — see RunOrchestrationLoopLayerResponder for rationale.
        const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

        // Per-work-item handles — same scoping rule as RunOrchestrationLoopLayerResponder.
        const handlesByWorkItem = new Map<
          QuestWorkItemId,
          ReturnType<typeof chatStreamProcessHandleBroker>
        >();

        questFindQuestPathBroker({ questId: typedQuestId })
          .then(async ({ guildId }) => {
            const guild = await guildGetBroker({ guildId });
            const startPath = filePathContract.parse(guild.path);

            return questOrchestrationLoopBroker({
              processId,
              questId: typedQuestId,
              startPath,
              onAgentEntry: ({ slotIndex, entry, questWorkItemId, sessionId }) => {
                const rawLine: unknown = entry.raw;
                if (typeof rawLine !== 'string') return;

                let handle = handlesByWorkItem.get(questWorkItemId);
                if (handle === undefined) {
                  handle = chatStreamProcessHandleBroker({
                    chatProcessId: processId,
                    guildId,
                    ...(sessionId === undefined ? {} : { sessionId }),
                    onEntries: ({ entries, sessionId: handlerSessionId }) => {
                      const payload = buildOrchestrationLoopOnAgentEntryTransformer({
                        processId,
                        slotIndexToSessionId,
                        slotIndex,
                        entries,
                        questId: typedQuestId,
                        workItemId: questWorkItemId,
                        ...(handlerSessionId === undefined ? {} : { sessionId: handlerSessionId }),
                      });
                      orchestrationEventsState.emit({
                        type: 'chat-output',
                        processId,
                        payload,
                      });
                    },
                  });
                  handlesByWorkItem.set(questWorkItemId, handle);
                }

                handle.onLine({ rawLine });
              },
              abortSignal: abortController.signal,
            });
          })
          .then(() => {
            for (const handle of handlesByWorkItem.values()) {
              handle.stop();
            }
            handlesByWorkItem.clear();
            orchestrationProcessesState.remove({ processId });
          })
          .catch((error: unknown) => {
            process.stderr.write(
              `Orchestration loop failed for quest ${typedQuestId}: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
            );
            for (const handle of handlesByWorkItem.values()) {
              handle.stop();
            }
            handlesByWorkItem.clear();
            orchestrationProcessesState.remove({ processId });
          });
      }
    }
  }

  return result;
};
