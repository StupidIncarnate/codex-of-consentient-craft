/**
 * PURPOSE: Installs a global quest-modified handler that keeps the execution queue in sync with quest file changes — auto-removes entries on abandon/complete/delete so the queue runner can advance
 *
 * USAGE:
 * const handle = questQueueSyncListenerBroker({
 *   subscribe: (handler) => orchestrationEventsState.on({ type: 'quest-modified', handler }),
 *   unsubscribe: (handler) => orchestrationEventsState.off({ type: 'quest-modified', handler }),
 *   loadQuestStatus: async ({ questId }) => { ... },
 *   removeByQuestId: ({ questId }) => { questExecutionQueueState.removeByQuestId({ questId }); },
 *   updateEntryStatus: ({ questId, status }) => { questExecutionQueueState.updateEntryStatus({ questId, status }); },
 * });
 * handle.stop();
 *
 * WHEN-TO-USE: Wired once from the execution-queue flow at module load.
 * WHEN-NOT-TO-USE: Not per-request — this is a process-lifetime subscription.
 *
 * WHY subscribe/unsubscribe/loadQuestStatus/removeByQuestId/updateEntryStatus are injected:
 * brokers/ cannot import state/. The caller (a bootstrap responder) wires the real event bus
 * and state-backed callbacks.
 */

import type { ProcessId, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

import { createSyncHandlerLayerBroker } from './create-sync-handler-layer-broker';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

export const questQueueSyncListenerBroker = ({
  subscribe,
  unsubscribe,
  loadQuestStatus,
  removeByQuestId,
  updateEntryStatus,
}: {
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  loadQuestStatus: ({ questId }: { questId: QuestId }) => Promise<QuestStatus | undefined>;
  removeByQuestId: ({ questId }: { questId: QuestId }) => void;
  updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }) => void;
}): { stop: () => void } => {
  const handler = createSyncHandlerLayerBroker({
    loadQuestStatus,
    removeByQuestId,
    updateEntryStatus,
  });

  subscribe(handler);

  return {
    stop: (): void => {
      unsubscribe(handler);
    },
  };
};
