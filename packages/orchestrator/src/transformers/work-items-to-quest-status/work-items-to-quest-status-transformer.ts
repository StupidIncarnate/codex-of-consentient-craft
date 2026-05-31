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

  return currentStatus;
};
