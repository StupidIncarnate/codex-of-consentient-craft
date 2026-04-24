/**
 * PURPOSE: Creates the `quest-modified` event handler used by questQueueSyncListenerBroker
 *
 * USAGE:
 * const handler = createSyncHandlerLayerBroker({ loadQuestStatus, removeByQuestId, updateEntryStatus });
 * // Returns a handler that on every matching event delegates to processSyncEventLayerBroker.
 */

import type { ProcessId, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

import { processSyncEventLayerBroker } from './process-sync-event-layer-broker';

export const createSyncHandlerLayerBroker =
  ({
    loadQuestStatus,
    removeByQuestId,
    updateEntryStatus,
  }: {
    loadQuestStatus: ({ questId }: { questId: QuestId }) => Promise<QuestStatus | undefined>;
    removeByQuestId: ({ questId }: { questId: QuestId }) => void;
    updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }) => void;
  }): ((event: { processId: ProcessId; payload: { questId?: unknown } }) => void) =>
  (event): void => {
    const rawQuestId: unknown = event.payload.questId;
    if (typeof rawQuestId !== 'string') return;
    const questId = rawQuestId as QuestId;

    processSyncEventLayerBroker({
      questId,
      loadQuestStatus,
      removeByQuestId,
      updateEntryStatus,
    }).catch((error: unknown) => {
      process.stderr.write(
        `[questQueueSyncListenerBroker] handler failed for quest ${questId}: ${String(error)}\n`,
      );
    });
  };
