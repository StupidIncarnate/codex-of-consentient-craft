/**
 * PURPOSE: Wires the queue-sync listener to real state + event-bus callbacks on orchestrator startup. Idempotent — subsequent calls are no-ops.
 *
 * USAGE:
 * ExecutionQueueSyncListenerBootstrapResponder();
 * // The listener is now subscribed to quest-modified; when a quest transitions to a
 * // terminal status or is deleted, its queue entry is automatically cleaned up so the
 * // runner can advance.
 *
 * WHEN-TO-USE: Called once from StartOrchestrator module load (via ExecutionQueueFlow.bootstrapSyncListener).
 * WHEN-NOT-TO-USE: Not for request-scoped invocation.
 */

import type { AdapterResult, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, getQuestInputContract } from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questQueueSyncListenerBroker } from '../../../brokers/quest/queue-sync-listener/quest-queue-sync-listener-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

type QuestModifiedHandler = Parameters<
  Parameters<typeof questQueueSyncListenerBroker>[0]['subscribe']
>[0];

const state: { installed: { stop: () => void } | null } = {
  installed: null,
};

export const ExecutionQueueSyncListenerBootstrapResponder = (): AdapterResult => {
  const ok = adapterResultContract.parse({ success: true });
  if (state.installed !== null) {
    return ok;
  }
  state.installed = questQueueSyncListenerBroker({
    subscribe: (handler: QuestModifiedHandler): void => {
      orchestrationEventsState.on({ type: 'quest-modified', handler });
    },
    unsubscribe: (handler: QuestModifiedHandler): void => {
      orchestrationEventsState.off({ type: 'quest-modified', handler });
    },
    loadQuestStatus: async ({
      questId,
    }: {
      questId: QuestId;
    }): Promise<QuestStatus | undefined> => {
      const result = await questGetBroker({
        input: getQuestInputContract.parse({ questId }),
      });
      if (!result.success || result.quest === undefined) {
        return undefined;
      }
      return result.quest.status;
    },
    removeByQuestId: ({ questId }: { questId: QuestId }): void => {
      questExecutionQueueState.removeByQuestId({ questId });
    },
    updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }): void => {
      questExecutionQueueState.updateEntryStatus({ questId, status });
    },
  });
  return ok;
};
