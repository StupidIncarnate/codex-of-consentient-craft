/**
 * PURPOSE: Recovers active quests for a single guild by launching orchestration loops
 *
 * USAGE:
 * const recoveredIds = await RecoverGuildLayerResponder({guildItem});
 * // Scans guild quests and launches loops for any in recoverable statuses without running processes
 */

import { filePathContract, processIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildListItem, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { buildOrchestrationLoopOnAgentEntryTransformer } from '../../../transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import {
  isActiveWorkItemStatusGuard,
  isRecoverableQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

export const RecoverGuildLayerResponder = async ({
  guildItem,
}: {
  guildItem: GuildListItem;
}): Promise<QuestId[]> => {
  if (!guildItem.valid) {
    return [];
  }

  const recoveredIds: QuestId[] = [];

  try {
    const quests = await questListBroker({ guildId: guildItem.id });
    const guild = await guildGetBroker({ guildId: guildItem.id });
    const startPath = filePathContract.parse(guild.path);

    const recoverableQuests = quests.filter((quest) => {
      if (!isRecoverableQuestStatusGuard({ status: quest.status })) {
        return false;
      }
      const existingProcess = orchestrationProcessesState.findByQuestId({ questId: quest.id });
      return !existingProcess;
    });

    // Reset orphaned active work items to pending across every recoverable quest, keeping
    // sessionId + the resume marker so Node dispatch resumes the interrupted session. A missing
    // next work item is NOT repaired here — the dispatch scan's operations-aware advance
    // self-heal creates it from the ledger.
    const orphanResets = recoverableQuests
      .filter((quest) =>
        quest.workItems.some((wi) => isActiveWorkItemStatusGuard({ status: wi.status })),
      )
      .map(async (quest) => {
        const orphanedItems = quest.workItems
          .filter((wi) => isActiveWorkItemStatusGuard({ status: wi.status }))
          .map((wi) => ({
            id: wi.id,
            status: 'pending' as const,
            ...(wi.sessionId === undefined ? {} : { resume: true }),
          }));

        const resetInput = modifyQuestInputContract.parse({
          questId: quest.id,
          workItems: orphanedItems,
        });
        return questModifyBroker({ input: resetInput });
      });

    await Promise.all(orphanResets);

    for (const quest of recoverableQuests) {
      const processId = processIdContract.parse(`proc-recovery-${crypto.randomUUID()}`);
      const abortController = new AbortController();

      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId,
          questId: quest.id,
          kill: () => {
            abortController.abort();
          },
        },
      });

      // Per-slot sessionId memo — sessionId arrives on a later emission than the first entries, so memo the latest per slot.
      const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

      questOrchestrationLoopBroker({
        processId,
        questId: quest.id,
        startPath,
        guildId: guildItem.id,
        onAgentEntry: ({ slotIndex, entries, questWorkItemId, sessionId }) => {
          const payload = buildOrchestrationLoopOnAgentEntryTransformer({
            processId,
            slotIndexToSessionId,
            slotIndex,
            entries,
            questId: quest.id,
            workItemId: questWorkItemId,
            ...(sessionId === undefined ? {} : { sessionId }),
          });
          orchestrationEventsState.emit({ type: 'chat-output', processId, payload });
        },
        abortSignal: abortController.signal,
      })
        .then(() => {
          orchestrationProcessesState.remove({ processId });
        })
        .catch(() => {
          orchestrationProcessesState.remove({ processId });
        });

      recoveredIds.push(quest.id);
    }
  } catch (error: unknown) {
    const isFileNotFound =
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT';
    if (!isFileNotFound) {
      throw error;
    }
  }

  return recoveredIds;
};
