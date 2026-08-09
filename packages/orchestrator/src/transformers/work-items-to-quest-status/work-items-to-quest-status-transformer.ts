/**
 * PURPOSE: Derive quest execution status from work item states and the operations ledger
 *
 * USAGE:
 * workItemsToQuestStatusTransformer({ workItems, operations, currentStatus });
 * // Returns: QuestStatus
 */

import type {
  OperationItem,
  QuestStatus,
  WorkItem,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';
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
import { workItemRoleStatics } from '@dungeonmaster/shared/statics';

// Roles whose work items this transformer ignores when deriving quest status — see the filter
// below for why each excluded role qualifies.
const DERIVATION_EXCLUDED_ROLES: ReadonlySet<WorkItemRole> = new Set(
  workItemRoleStatics.excludedFromStatusDerivation,
);

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
  // pre-execution spec lifecycle, an explicit user pause, a deliberate abandon, a block
  // (blocked is set explicitly by questBlockOnFailureBroker and left explicitly by the user's
  // resume transition — no write-side effect re-opens it), and a completed merge. (`complete`
  // is deliberately NOT here — appending live work must be able to re-open it. `merged` differs:
  // its work is already on the base branch, so there is nothing left to re-open it for, and
  // deriving over it would flip it back to `complete`, erase the distinction the status exists
  // to draw, and re-offer a merge that has already happened. There is no metadata flag that
  // separates `merged` from `complete` — both are terminal AND completedSuccessfully — so this
  // is a plain literal comparison rather than a guard.)
  if (
    isPreExecutionQuestStatusGuard({ status: currentStatus }) ||
    isUserPausedQuestStatusGuard({ status: currentStatus }) ||
    isAbandonedQuestStatusGuard({ status: currentStatus }) ||
    isQuestBlockedQuestStatusGuard({ status: currentStatus }) ||
    currentStatus === 'merged'
  ) {
    return currentStatus;
  }

  // While the merge is still running the quest stays `merging` rather than falling through to
  // `in_progress`; once its work items are terminal AND the ledger is drained it becomes
  // `merged` rather than `complete`.
  const runningStatus: QuestStatus = currentStatus === 'merging' ? 'merging' : 'in_progress';
  const drainedStatus: QuestStatus = currentStatus === 'merging' ? 'merged' : 'complete';

  // A follow-up chat item is created AFTER the quest terminated and is spawned directly by its
  // own route rather than by the dispatcher, so counting it would make a finished quest read as
  // running again. Scoped to that one role — a `warpgate` item SHOULD re-open the quest, because
  // a merge is real dispatched work.
  const derivationWorkItems = workItems.filter((item) => !DERIVATION_EXCLUDED_ROLES.has(item.role));

  // A failed item is resolved once a later retry was spliced for it — i.e. some work item carries
  // insertedBy === failedItem.id.
  const supersededIds = new Set(
    derivationWorkItems.map((item) => item.insertedBy).filter((id) => id !== undefined),
  );
  // Sink work items are the ones nothing else depends on (their id never appears in another
  // item's dependsOn). Completion keys on the sink: a failed item whose dependents all
  // progressed past it (so it is NOT a sink) does not block. Only an unresolved failure that
  // IS a sink — nothing overtook it and no retry was spliced for it — blocks. A failed ward
  // work item whose operation item chain continued (spiritmender + fresh ward appended on the
  // ledger) is resolved by the pendingOperations check below keeping the quest in_progress.
  const dependedOnIds = new Set(derivationWorkItems.flatMap((item) => item.dependsOn));
  // At `merging` the ONLY failure that can halt the quest is the merge's own. A quest that was
  // `blocked` when Merge was pressed still carries the failed work item that halted it, and
  // pressing Merge is a deliberate choice to send the work home despite that blocker — scanning it
  // again would pin the quest short of `merged` forever. Narrowing the scan rather than skipping it
  // is what keeps a FAILED merge honest: a `warpgate` item left failed still derives `blocked`, so
  // a merge that could not land never reads as merged. Sink-ness itself is a property of the whole
  // graph, so `supersededIds` and `dependedOnIds` are still computed over every item.
  const failureCarryingItems =
    currentStatus === 'merging'
      ? derivationWorkItems.filter((item) => item.role === 'warpgate')
      : derivationWorkItems;
  const hasUnresolvedSinkFailure = failureCarryingItems.some(
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
  // failure was never recovered, `drainedStatus` when the ledger is drained, `runningStatus`
  // while operation items remain (advance creates the next work item).
  if (derivationWorkItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }))) {
    if (hasUnresolvedSinkFailure && !hasPendingOperations) {
      return 'blocked';
    }
    return hasPendingOperations ? runningStatus : drainedStatus;
  }

  // Something is still running => runningStatus.
  if (derivationWorkItems.some((item) => isActiveWorkItemStatusGuard({ status: item.status }))) {
    return runningStatus;
  }

  // Only pending items remain. They are `blocked` when every one is dead-ended on a failed dep
  // AND the ledger has nothing left to advance to; otherwise the quest is `runningStatus` (a
  // dispatchable item exists, or advance will create one from the ledger).
  const failedIds = new Set(
    derivationWorkItems
      .filter((item) => isFailureWorkItemStatusGuard({ status: item.status }))
      .map((item) => item.id),
  );
  const pendingItems = derivationWorkItems.filter((item) =>
    isPendingWorkItemStatusGuard({ status: item.status }),
  );
  const allPendingDeadEnded =
    pendingItems.length > 0 &&
    pendingItems.every((item) => item.dependsOn.some((depId) => failedIds.has(depId)));

  return allPendingDeadEnded && !hasPendingOperations ? 'blocked' : runningStatus;
};
