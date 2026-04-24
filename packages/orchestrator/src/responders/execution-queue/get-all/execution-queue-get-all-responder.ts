/**
 * PURPOSE: Returns an immutable snapshot of the current cross-guild quest execution queue
 *
 * USAGE:
 * const entries = ExecutionQueueGetAllResponder();
 * // Returns readonly QuestQueueEntry[] — head at index 0, empty when idle.
 */

import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

export const ExecutionQueueGetAllResponder = (): readonly QuestQueueEntry[] =>
  questExecutionQueueState.getAll();
