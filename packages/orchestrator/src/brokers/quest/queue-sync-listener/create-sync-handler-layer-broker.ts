/**
 * PURPOSE: Creates the quest-changed handler used by questQueueSyncListenerBroker
 *
 * USAGE:
 * const handler = createSyncHandlerLayerBroker({ loadQuest, removeByQuestId, updateEntryStatus, updateEntryActiveSession });
 * handler({ questId });
 * // On every invocation delegates to processSyncEventLayerBroker with the injected callbacks.
 */

import type { Quest, QuestId, QuestStatus, SessionId } from '@dungeonmaster/shared/contracts';

import { processSyncEventLayerBroker } from './process-sync-event-layer-broker';

export const createSyncHandlerLayerBroker =
  ({
    loadQuest,
    removeByQuestId,
    updateEntryStatus,
    updateEntryActiveSession,
  }: {
    loadQuest: ({ questId }: { questId: QuestId }) => Promise<Quest | undefined>;
    removeByQuestId: ({ questId }: { questId: QuestId }) => void;
    updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }) => void;
    updateEntryActiveSession: ({
      questId,
      activeSessionId,
    }: {
      questId: QuestId;
      activeSessionId: SessionId | undefined;
    }) => void;
  }): (({ questId }: { questId: QuestId }) => void) =>
  ({ questId }): void => {
    processSyncEventLayerBroker({
      questId,
      loadQuest,
      removeByQuestId,
      updateEntryStatus,
      updateEntryActiveSession,
    }).catch((error: unknown) => {
      process.stderr.write(
        `[questQueueSyncListenerBroker] handler failed for quest ${questId}: ${String(error)}\n`,
      );
    });
  };
