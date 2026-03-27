/**
 * PURPOSE: Recovers active quests for a single guild by launching orchestration loops
 *
 * USAGE:
 * const recoveredIds = await RecoverGuildLayerResponder({guildItem});
 * // Scans guild quests and launches loops for any in recoverable statuses without running processes
 */

import {
  filePathContract,
  processIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { GuildListItem, QuestId } from '@dungeonmaster/shared/contracts';

import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { recoverableQuestStatusesStatics } from '../../../statics/recoverable-quest-statuses/recoverable-quest-statuses-statics';

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
      const isRecoverable = recoverableQuestStatusesStatics.some((s) => s === quest.status);
      if (!isRecoverable) {
        return false;
      }
      const existingProcess = orchestrationProcessesState.findByQuestId({ questId: quest.id });
      return !existingProcess;
    });

    // Reset orphaned in_progress work items to pending (their processes died on restart)
    const orphanResets = recoverableQuests
      .filter((quest) => quest.workItems.some((wi) => wi.status === 'in_progress'))
      .map(async (quest) => {
        const orphanedItems = quest.workItems
          .filter((wi) => wi.status === 'in_progress')
          .map((wi) => ({ id: wi.id, status: 'pending' as const }));

        const resetInput = modifyQuestInputContract.parse({
          questId: quest.id,
          workItems: orphanedItems,
        });
        return questModifyBroker({ input: resetInput });
      });

    await Promise.all(orphanResets);

    // Insert pathseeker work items for in_progress quests that are missing them
    const pathseekerInsertions = recoverableQuests
      .filter(
        (quest) =>
          quest.status === 'in_progress' && !quest.workItems.some((wi) => wi.role === 'pathseeker'),
      )
      .map(async (quest) => {
        const chatItemIds = quest.workItems
          .filter(
            (wi) =>
              (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') &&
              wi.status === 'complete',
          )
          .map((wi) => wi.id);

        const pathseekerItem = workItemContract.parse({
          id: crypto.randomUUID(),
          role: 'pathseeker',
          status: 'pending',
          spawnerType: 'agent',
          dependsOn: chatItemIds,
          maxAttempts: 3,
          createdAt: new Date().toISOString(),
        });

        const insertInput = modifyQuestInputContract.parse({
          questId: quest.id,
          workItems: [pathseekerItem],
        });
        return questModifyBroker({ input: insertInput });
      });

    await Promise.all(pathseekerInsertions);

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

      questOrchestrationLoopBroker({
        processId,
        questId: quest.id,
        startPath,
        onAgentEntry: ({ slotIndex, entry, sessionId }) => {
          orchestrationEventsState.emit({
            type: 'chat-output',
            processId,
            payload: {
              processId,
              slotIndex,
              entry,
              ...(sessionId === undefined ? {} : { sessionId }),
            },
          });
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
