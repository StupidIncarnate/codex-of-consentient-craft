/**
 * PURPOSE: Derive quest execution status from work item states
 *
 * USAGE:
 * workItemsToQuestStatusTransformer({ workItems, currentStatus });
 * // Returns: QuestStatus
 */

import type { QuestStatus, WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isAbandonedQuestStatusGuard,
  isActiveWorkItemStatusGuard,
  isFailureWorkItemStatusGuard,
  isPathseekerRunningQuestStatusGuard,
  isPendingWorkItemStatusGuard,
  isPreExecutionQuestStatusGuard,
  isTerminalWorkItemStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

export const workItemsToQuestStatusTransformer = ({
  workItems,
  currentStatus,
}: {
  workItems: WorkItem[];
  currentStatus: QuestStatus;
}): QuestStatus => {
  // Statuses owned by something other than work-item state are never derived over: the pathseeker
  // phase, the pre-execution spec lifecycle, an explicit user pause, and a deliberate abandon.
  // (`complete` is deliberately NOT here — appending live work must be able to re-open it.)
  if (
    isPathseekerRunningQuestStatusGuard({ status: currentStatus }) ||
    isPreExecutionQuestStatusGuard({ status: currentStatus }) ||
    isUserPausedQuestStatusGuard({ status: currentStatus }) ||
    isAbandonedQuestStatusGuard({ status: currentStatus })
  ) {
    return currentStatus;
  }

  // A failed item is resolved once a later retry was spliced for it — i.e. some work item carries
  // insertedBy === failedItem.id.
  const supersededIds = new Set(
    workItems.map((item) => item.insertedBy).filter((id) => id !== undefined),
  );
  const hasUnresolvedFailure = workItems.some(
    (item) => isFailureWorkItemStatusGuard({ status: item.status }) && !supersededIds.has(item.id),
  );

  // Every item terminal => the quest is done: `blocked` when a failure was never recovered,
  // `complete` otherwise. (This is the sole place the "all terminal with a dead failure" case
  // becomes `blocked`; callers no longer force it.)
  if (workItems.every((item) => isTerminalWorkItemStatusGuard({ status: item.status }))) {
    return hasUnresolvedFailure ? 'blocked' : 'complete';
  }

  // Something is still running => in_progress.
  if (workItems.some((item) => isActiveWorkItemStatusGuard({ status: item.status }))) {
    return 'in_progress';
  }

  // Only pending items remain. They are `blocked` when every one is dead-ended on a failed dep;
  // otherwise at least one is dispatchable, so the quest is `in_progress`. This re-opens a quest
  // that briefly derived `complete` (the last pathseeker finishing before the post-walk hook
  // appends the codeweaver chain) or `blocked` (a recovery splice rewiring deps off the failed
  // item) — appending live pending work makes it dispatchable again.
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

  return allPendingDeadEnded ? 'blocked' : 'in_progress';
};
