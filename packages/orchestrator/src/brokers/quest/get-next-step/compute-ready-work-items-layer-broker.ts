/**
 * PURPOSE: Layer helper for questGetNextStepBroker — given the quest's workItems[], returns the subset that is `pending` and whose `dependsOn` ids are all in a status that satisfies dependencies (complete/failed). These are the items the orchestrator may dispatch right now, returned in the SAME floor order the web execution view renders (`workItemsInDispatchOrderTransformer`): topological depth, then role/floor position, then createdAt. Because the ready set is depth-ordered, `selectBatchLayerBroker` grabbing the first item always dispatches the shallowest-floor ready item — a deeper-floor item never runs while a shallower-floor item is still pending.
 *
 * USAGE:
 * const ready = computeReadyWorkItemsLayerBroker({ workItems });
 * // Returns: WorkItem[] — items eligible for dispatch on this scan, in floor order
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isPendingWorkItemStatusGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';
import { workItemsInDispatchOrderTransformer } from '@dungeonmaster/shared/transformers';

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
  return workItemsInDispatchOrderTransformer({ workItems }).filter(
    (item) =>
      isPendingWorkItemStatusGuard({ status: item.status }) &&
      item.dependsOn.every((depId) => completedIds.has(depId)),
  );
};
