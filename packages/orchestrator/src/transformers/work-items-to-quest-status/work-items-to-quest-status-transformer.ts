/**
 * PURPOSE: Derive quest execution status from work item states
 *
 * USAGE:
 * workItemsToQuestStatusTransformer({ workItems, currentStatus });
 * // Returns: QuestStatus
 */

import type { QuestStatus, WorkItem } from '@dungeonmaster/shared/contracts';
import {
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
  if (isPathseekerRunningQuestStatusGuard({ status: currentStatus })) {
    return currentStatus;
  }

  if (isPreExecutionQuestStatusGuard({ status: currentStatus })) {
    return currentStatus;
  }

  // Build the set of work-item ids that have been superseded by a later retry.
  // A failed item is superseded (resolved) when another item was spliced for it —
  // i.e. some work item has insertedBy === failedItem.id.
  const supersededIds = new Set(
    workItems.map((item) => item.insertedBy).filter((id) => id !== undefined),
  );

  if (
    workItems.every(
      (item) =>
        isTerminalWorkItemStatusGuard({ status: item.status }) &&
        (!isFailureWorkItemStatusGuard({ status: item.status }) || supersededIds.has(item.id)),
    )
  ) {
    return 'complete';
  }

  if (workItems.some((item) => isActiveWorkItemStatusGuard({ status: item.status }))) {
    return 'in_progress';
  }

  const pendingItems = workItems.filter((item) =>
    isPendingWorkItemStatusGuard({ status: item.status }),
  );
  const failedIds = new Set(
    workItems
      .filter((item) => isFailureWorkItemStatusGuard({ status: item.status }))
      .map((item) => item.id),
  );

  const blocked =
    pendingItems.length > 0 &&
    pendingItems.every((item) => item.dependsOn.some((depId) => failedIds.has(depId)));

  if (blocked) {
    return 'blocked';
  }

  // A user-paused quest is held by explicit user intent — never derive it back to running.
  if (isUserPausedQuestStatusGuard({ status: currentStatus })) {
    return currentStatus;
  }

  // Reaching here means the quest is neither all-terminal nor blocked, so it has live pending
  // work whose dependencies are satisfiable — the quest is in_progress. This recovers a quest
  // that momentarily derived `complete` (the last pathseeker finishing before the post-walk hook
  // appends the codeweaver chain) or `blocked` (recovery splice rewiring deps off a failed item):
  // appending live pending work re-opens it for dispatch rather than stranding it.
  return 'in_progress';
};
