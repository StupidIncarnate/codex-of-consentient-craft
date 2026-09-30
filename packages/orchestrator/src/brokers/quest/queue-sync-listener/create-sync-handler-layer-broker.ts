/**
 * PURPOSE: Creates the quest-changed handler used by questQueueSyncListenerBroker
 *
 * USAGE:
 * const handler = createSyncHandlerLayerBroker({ loadQuest, removeByQuestId, updateEntryStatus, updateEntryActiveSession });
 * handler({ questId });
 * // On every invocation delegates to processSyncEventLayerBroker with the injected callbacks.
 */

import { stderr } from '#gateway/node/process';
import type { Quest, QuestStatus, SessionId } from '@dungeonmaster/shared/contracts';

import { processSyncEventLayerBroker } from './process-sync-event-layer-broker';

export const createSyncHandlerLayerBroker =
  ({
    loadQuest,
    removeByQuestId,
    updateEntryStatus,
    updateEntryActiveSession,
  }: {
    loadQuest: ({ questId }: { questId: Quest['id'] }) => Promise<Quest | undefined>;
    removeByQuestId: ({ questId }: { questId: Quest['id'] }) => void;
    updateEntryStatus: ({ questId, status }: { questId: Quest['id']; status: QuestStatus }) => void;
    updateEntryActiveSession: ({
      questId,
      activeSessionId,
    }: {
      questId: Quest['id'];
      activeSessionId: SessionId | undefined;
    }) => void;
  }): (({ questId }: { questId: Quest['id'] }) => void) =>
  ({ questId }): void => {
    processSyncEventLayerBroker({
      questId,
      loadQuest,
      removeByQuestId,
      updateEntryStatus,
      updateEntryActiveSession,
    }).catch((error: unknown) => {
      stderr.write(
        `[questQueueSyncListenerBroker] handler failed for quest ${questId}: ${String(error)}\n`,
      );
    });
  };
