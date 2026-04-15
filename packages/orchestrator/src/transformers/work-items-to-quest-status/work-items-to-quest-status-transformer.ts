/**
 * PURPOSE: Derive quest execution status from work item states
 *
 * USAGE:
 * workItemsToQuestStatusTransformer({ workItems, currentStatus });
 * // Returns: QuestStatus
 */

import type { QuestStatus, WorkItem } from '@dungeonmaster/shared/contracts';

const PRE_EXECUTION_STATUSES = new Set<QuestStatus>([
  'created',
  'explore_flows',
  'review_flows',
  'flows_approved',
  'explore_observables',
  'review_observables',
  'approved',
  'explore_design',
  'review_design',
  'design_approved',
]);

export const workItemsToQuestStatusTransformer = ({
  workItems,
  currentStatus,
}: {
  workItems: WorkItem[];
  currentStatus: QuestStatus;
}): QuestStatus => {
  if (currentStatus.startsWith('seek_')) {
    return currentStatus;
  }

  if (PRE_EXECUTION_STATUSES.has(currentStatus)) {
    return currentStatus;
  }

  if (workItems.every((item) => item.status === 'complete' || item.status === 'skipped')) {
    return 'complete';
  }

  if (workItems.some((item) => item.status === 'in_progress')) {
    return 'in_progress';
  }

  const pendingItems = workItems.filter((item) => item.status === 'pending');
  const failedIds = new Set(
    workItems.filter((item) => item.status === 'failed').map((item) => item.id),
  );

  const blocked =
    pendingItems.length > 0 &&
    pendingItems.every((item) => item.dependsOn.some((depId) => failedIds.has(depId)));

  if (blocked) {
    return 'blocked';
  }

  return currentStatus;
};
