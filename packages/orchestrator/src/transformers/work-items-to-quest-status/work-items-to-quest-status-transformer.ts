/**
 * PURPOSE: Derive quest execution status from work item states, the operations ledger, and the
 * position the family graph has reached. Reach for this over reading `quest.status`: this is what
 * decides whether a quest is running, finished, merged or halted on every ledger and work-item
 * write, and it is the only place that decision is made.
 *
 * USAGE:
 * workItemsToQuestStatusTransformer({ workItems, operations, currentStatus, questType });
 * // Returns: QuestStatus
 *
 * `complete` means THE FAMILY GRAPH REACHED `@complete`, never that the ledger drained. A drained
 * ledger is an ordinary mid-run state under a graph that can cycle — `work ⇄ review` is legitimately
 * empty between two passes — so `familyGraphCompleteDetectTransformer` owns that question and the
 * ledger's remaining job here is the two FAILURE roll-ups.
 */

import type {
  OperationItem,
  Quest,
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
import { questFlowStatics, workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { familyGraphCompleteDetectTransformer } from '../family-graph-complete-detect/family-graph-complete-detect-transformer';

// Roles whose work items this transformer ignores when deriving quest status — see the filter
// below for why each excluded role qualifies.
const DERIVATION_EXCLUDED_ROLES: ReadonlySet<WorkItemRole> = new Set(
  workItemRoleStatics.excludedFromStatusDerivation,
);

export const workItemsToQuestStatusTransformer = ({
  workItems,
  operations,
  currentStatus,
  questType,
}: {
  workItems: WorkItem[];
  operations: OperationItem[];
  currentStatus: QuestStatus;
  questType: Quest['questType'];
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
  // `in_progress`; once its work items are terminal AND the graph has reached its terminal it
  // becomes `merged` rather than `complete`. The `warpgate` family routes `done` to `@complete`
  // exactly as `wardFull` does, so the graph question needs no branch of its own here.
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

  // A live operation item is what the two FAILURE roll-ups below weigh: a failure the relay has
  // already spliced a successor for (a spiritmender plus a fresh ward) is not a halt, because
  // advance still has something to dispatch. It says nothing about whether the quest FINISHED —
  // that is the graph's question, not the ledger's.
  const hasPendingOperations = operations.some((operation) => operation.status !== 'complete');

  // The completion claim, and the ONLY one: the run is done when a family routing to `@complete`
  // holds scopes and every one of them landed. A drained ledger proves nothing — `work ⇄ review`
  // is a cycle and is legitimately empty between two passes.
  const graphComplete = familyGraphCompleteDetectTransformer({
    operations,
    questType,
    questFlowStatics,
  });

  // Every item terminal => `blocked` when a sink failure was never recovered, `drainedStatus` when
  // the family graph reached its terminal, `runningStatus` otherwise (the relay has further families
  // to route to, and advance creates the next work item).
  if (derivationWorkItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }))) {
    if (hasUnresolvedSinkFailure && !hasPendingOperations) {
      return 'blocked';
    }
    return graphComplete ? drainedStatus : runningStatus;
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
