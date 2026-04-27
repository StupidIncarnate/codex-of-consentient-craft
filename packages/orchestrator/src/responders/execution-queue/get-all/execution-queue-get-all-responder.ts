/**
 * PURPOSE: Returns the current cross-guild quest execution queue snapshot with each entry's `activeSessionId` re-derived at read time from the quest's persisted workItems
 *
 * USAGE:
 * const entries = await ExecutionQueueGetAllResponder();
 * // Returns readonly QuestQueueEntry[] — head at index 0, empty when idle.
 *
 * WHY re-derive: the in-memory queue's `activeSessionId` is updated by a sync
 * listener that fires on quest-modified outbox events. If the listener missed an
 * event (race during startup, watcher restart, etc.) the cached value can lag
 * behind the persisted quest. The web's queue bar uses this field to navigate to
 * the live execution view, so a stale/missing value sends the user to a blank
 * chat. Re-deriving from the freshly loaded quest workItems on every read makes
 * the API self-healing — the listener is now an optimization, not a correctness
 * dependency. Falls back to the cached entry value if the quest load fails.
 */

import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';
import { getQuestInputContract, questQueueEntryContract } from '@dungeonmaster/shared/contracts';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { questActiveSessionTransformer } from '../../../transformers/quest-active-session/quest-active-session-transformer';

export const ExecutionQueueGetAllResponder = async (): Promise<readonly QuestQueueEntry[]> => {
  const entries = questExecutionQueueState.getAll();

  const refreshed = await Promise.all(
    entries.map(async (entry): Promise<QuestQueueEntry> => {
      try {
        const result = await questGetBroker({
          input: getQuestInputContract.parse({ questId: entry.questId }),
        });

        if (!result.success || result.quest === undefined) {
          return entry;
        }

        const { sessionId } = questActiveSessionTransformer({
          workItems: result.quest.workItems,
        });

        const next: QuestQueueEntry = { ...entry };
        if (sessionId === undefined) {
          Reflect.deleteProperty(next, 'activeSessionId');
        } else {
          next.activeSessionId = sessionId;
        }
        return questQueueEntryContract.parse(next);
      } catch {
        return entry;
      }
    }),
  );

  return refreshed;
};
