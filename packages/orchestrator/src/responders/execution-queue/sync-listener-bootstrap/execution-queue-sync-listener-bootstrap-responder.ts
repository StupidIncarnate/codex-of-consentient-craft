/**
 * PURPOSE: Wires the queue-sync listener to real state + the quest-outbox watcher on orchestrator startup. Idempotent — subsequent calls are no-ops.
 *
 * USAGE:
 * ExecutionQueueSyncListenerBootstrapResponder();
 * // The listener is now subscribed to the quest-outbox file (which questPersistBroker writes
 * // to on every quest mutation). When a quest transitions to a terminal status — or every
 * // workItem drains to a terminal state — its queue entry is automatically cleaned up so the
 * // runner can advance.
 *
 * WHEN-TO-USE: Called once from StartOrchestrator module load (via ExecutionQueueFlow.bootstrapSyncListener).
 * WHEN-NOT-TO-USE: Not for request-scoped invocation.
 *
 * WHY the outbox watcher (not orchestrationEventsState): `quest-modified` events flow through
 * the file outbox (cross-process), not the in-memory event bus. The sync listener MUST tail
 * the outbox to see natural terminal transitions the orchestration loop persists in-process.
 */

import type {
  AdapterResult,
  Quest,
  QuestId,
  QuestStatus,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract, getQuestInputContract } from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questOutboxWatchBroker } from '../../../brokers/quest/outbox-watch/quest-outbox-watch-broker';
import { questQueueSyncListenerBroker } from '../../../brokers/quest/queue-sync-listener/quest-queue-sync-listener-broker';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

const state: { installed: { stop: () => void } | null; installing: boolean } = {
  installed: null,
  installing: false,
};

export const ExecutionQueueSyncListenerBootstrapResponder = (): AdapterResult => {
  const ok = adapterResultContract.parse({ success: true });
  if (state.installed !== null || state.installing) {
    return ok;
  }
  state.installing = true;
  questQueueSyncListenerBroker({
    install: async (
      onQuestChanged: (args: { questId: QuestId }) => void,
    ): Promise<{ stop: () => void }> =>
      questOutboxWatchBroker({
        onQuestChanged,
        onError: ({ error }: { error: unknown }): void => {
          process.stderr.write(
            `[ExecutionQueueSyncListenerBootstrapResponder] outbox watch error: ${String(error)}\n`,
          );
        },
      }),
    loadQuest: async ({ questId }: { questId: QuestId }): Promise<Quest | undefined> => {
      const result = await questGetBroker({
        input: getQuestInputContract.parse({ questId }),
      });
      if (!result.success || result.quest === undefined) {
        return undefined;
      }
      return result.quest;
    },
    removeByQuestId: ({ questId }: { questId: QuestId }): void => {
      questExecutionQueueState.removeByQuestId({ questId });
    },
    updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }): void => {
      questExecutionQueueState.updateEntryStatus({ questId, status });
    },
    updateEntryActiveSession: ({
      questId,
      activeSessionId,
    }: {
      questId: QuestId;
      activeSessionId: SessionId | undefined;
    }): void => {
      questExecutionQueueState.updateEntryActiveSession({ questId, activeSessionId });
    },
  })
    .then((handle: { stop: () => void }): void => {
      state.installed = handle;
      state.installing = false;
    })
    .catch((error: unknown): void => {
      state.installing = false;
      process.stderr.write(
        `[ExecutionQueueSyncListenerBootstrapResponder] install failed: ${String(error)}\n`,
      );
    });
  return ok;
};
