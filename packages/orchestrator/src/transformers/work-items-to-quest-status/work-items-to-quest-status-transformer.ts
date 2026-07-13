/**
 * PURPOSE: Derive quest execution status from work item states and the operations ledger
 *
 * USAGE:
 * workItemsToQuestStatusTransformer({ workItems, operations, currentStatus });
 * // Returns: QuestStatus
 */

import type { OperationItem, QuestStatus, WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isAbandonedQuestStatusGuard,
  isActiveWorkItemStatusGuard,
  isFailureWorkItemStatusGuard,
  isPendingWorkItemStatusGuard,
  isPreExecutionQuestStatusGuard,
  isQuestBlockedQuestStatusGuard,
  isTerminalWorkItemStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

export const workItemsToQuestStatusTransformer = ({
  workItems,
  operations,
  currentStatus,
}: {
  workItems: WorkItem[];
  operations: OperationItem[];
  currentStatus: QuestStatus;
}): QuestStatus => {
  // Statuses owned by something other than work-item state are never derived over: the
  // pre-execution spec lifecycle, an explicit user pause, a deliberate abandon, and a block
  // (blocked is set explicitly by questBlockOnFailureBroker and left explicitly by the user's
  // resume transition — no write-side effect re-opens it). (`complete` is deliberately NOT
  // here — appending live work must be able to re-open it.)
  if (
    isPreExecutionQuestStatusGuard({ status: currentStatus }) ||
    isUserPausedQuestStatusGuard({ status: currentStatus }) ||
    isAbandonedQuestStatusGuard({ status: currentStatus }) ||
    isQuestBlockedQuestStatusGuard({ status: currentStatus })
  ) {
    return currentStatus;
  }

  // A failed item is resolved once a later retry was spliced for it — i.e. some work item carries
  // insertedBy === failedItem.id.
  const supersededIds = new Set(
    workItems.map((item) => item.insertedBy).filter((id) => id !== undefined),
  );
  // Sink work items are the ones nothing else depends on (their id never appears in another
  // item's dependsOn). Completion keys on the sink: a failed item whose dependents all
  // progressed past it (so it is NOT a sink) does not block. Only an unresolved failure that
  // IS a sink — nothing overtook it and no retry was spliced for it — blocks. A failed ward
  // work item whose operation item chain continued (spiritmender + fresh ward appended on the
  // ledger) is resolved by the pendingOperations check below keeping the quest in_progress.
  const dependedOnIds = new Set(workItems.flatMap((item) => item.dependsOn));
  const hasUnresolvedSinkFailure = workItems.some(
    (item) =>
      isFailureWorkItemStatusGuard({ status: item.status }) &&
      !supersededIds.has(item.id) &&
      !dependedOnIds.has(item.id),
  );

  // The operations ledger is the plan record: while ANY operation item is still pending or
  // in_progress the quest is NOT done, even when every work item is momentarily terminal —
  // that window is exactly "last session finished, advance has not created the next work item
  // yet" (advance runs after the signal handler's atomic persist, and ward completion happens
  // inside quest-run-ward-broker). Deriving `complete` there would terminalize the quest and
  // stop the scan before the relay advances.
  const hasPendingOperations = operations.some((operation) => operation.status !== 'complete');

  // Every item terminal => the quest is done ONLY when the ledger agrees: `blocked` when a sink
  // failure was never recovered, `complete` when the ledger is drained, `in_progress` while
  // operation items remain (advance creates the next work item).
  if (workItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }))) {
    if (hasUnresolvedSinkFailure && !hasPendingOperations) {
      return 'blocked';
    }
    return hasPendingOperations ? 'in_progress' : 'complete';
  }

  // Something is still running => in_progress.
  if (workItems.some((item) => isActiveWorkItemStatusGuard({ status: item.status }))) {
    return 'in_progress';
  }

  // Only pending items remain. They are `blocked` when every one is dead-ended on a failed dep
  // AND the ledger has nothing left to advance to; otherwise the quest is `in_progress` (a
  // dispatchable item exists, or advance will create one from the ledger).
  const failedIds = new Set(
    workItems
      .filter((item) => isFailureWorkItemStatusGuard({ status: item.status }))
      .map((item) => item.id),
  );
  const pendingItems = workItems.filter((item) =>
    isPendingWorkItemStatusGuard({ status: item.status }),
  );
  const allPendingDeadEnded =
    pendingItems.length > 0 &&
    pendingItems.every((item) => item.dependsOn.some((depId) => failedIds.has(depId)));

  return allPendingDeadEnded && !hasPendingOperations ? 'blocked' : 'in_progress';
};
