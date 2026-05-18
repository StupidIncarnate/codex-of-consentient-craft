/**
 * PURPOSE: Layer helper for questGetNextStepBroker — given the quest's workItems[], returns the subset that is `pending` and whose `dependsOn` ids are all in a status that satisfies dependencies (complete/failed). These are the items the orchestrator may dispatch right now.
 *
 * USAGE:
 * const ready = computeReadyWorkItemsLayerBroker({ workItems });
 * // Returns: WorkItem[] — items eligible for dispatch on this scan
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isPendingWorkItemStatusGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

export const computeReadyWorkItemsLayerBroker = ({
  workItems,
}: {
  workItems: WorkItem[];
}): WorkItem[] => {
  const completedIds = new Set(
    workItems
      .filter((item) => satisfiesDependencyWorkItemStatusGuard({ status: item.status }))
      .map((item) => item.id),
  );
  return workItems.filter(
    (item) =>
      isPendingWorkItemStatusGuard({ status: item.status }) &&
      item.dependsOn.every((depId) => completedIds.has(depId)),
  );
};
