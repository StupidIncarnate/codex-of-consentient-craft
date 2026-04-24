/**
 * PURPOSE: Installs a global quest-changed handler that keeps the execution queue in sync with quest file changes — auto-removes entries on abandon/complete/blocked/delete so the queue runner can advance
 *
 * USAGE:
 * const handle = await questQueueSyncListenerBroker({
 *   install: async (onQuestChanged) =>
 *     questOutboxWatchBroker({ onQuestChanged, onError: (...) => ... }),
 *   loadQuest: async ({ questId }) => { ... },
 *   removeByQuestId: ({ questId }) => { questExecutionQueueState.removeByQuestId({ questId }); },
 *   updateEntryStatus: ({ questId, status }) => { questExecutionQueueState.updateEntryStatus({ questId, status }); },
 * });
 * handle.stop();
 *
 * WHEN-TO-USE: Wired once from the execution-queue flow at module load.
 * WHEN-NOT-TO-USE: Not per-request — this is a process-lifetime subscription.
 *
 * WHY install/loadQuest/removeByQuestId/updateEntryStatus are injected:
 * brokers/ cannot import state/. The caller (a bootstrap responder) wires the real event
 * source (outbox watcher) and state-backed callbacks.
 *
 * WHY the outbox watcher is the event source: `quest-modified` is emitted through the
 * file outbox (via questPersistBroker), not on the in-memory `orchestrationEventsState`
 * bus — subscribing to the in-memory bus would never see the terminal-status writes the
 * orchestration loop persists. The outbox watcher fires `onQuestChanged({questId})` on
 * every quest-persist line, which is what this listener needs.
 */

import type { Quest, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

import { createSyncHandlerLayerBroker } from './create-sync-handler-layer-broker';

type QuestChangedHandler = (args: { questId: QuestId }) => void;

export const questQueueSyncListenerBroker = async ({
  install,
  loadQuest,
  removeByQuestId,
  updateEntryStatus,
}: {
  install: (onQuestChanged: QuestChangedHandler) => Promise<{ stop: () => void }>;
  loadQuest: ({ questId }: { questId: QuestId }) => Promise<Quest | undefined>;
  removeByQuestId: ({ questId }: { questId: QuestId }) => void;
  updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }) => void;
}): Promise<{ stop: () => void }> => {
  const handler = createSyncHandlerLayerBroker({
    loadQuest,
    removeByQuestId,
    updateEntryStatus,
  });

  const { stop } = await install(handler);

  return {
    stop: (): void => {
      stop();
    },
  };
};
