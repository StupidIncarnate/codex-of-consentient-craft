/**
 * PURPOSE: Orders work items the way the execution dungeon is read — topological depth first (floor
 *   order), then role position within a floor, then createdAt. This is the single ordering both the
 *   web floor view and the orchestrator dispatcher consume, so "the next item in the list" means the
 *   same thing in both: the scheduler grabs the first ready item in this order, which is always the
 *   shallowest-floor ready item (no floor N+1 item runs while a floor N item is still pending).
 *
 * USAGE:
 * workItemsInDispatchOrderTransformer({ workItems });
 * // Returns: WorkItem[] ordered by (topologicalDepth, wardAwareConfigIndex, createdAt)
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import { computeWorkItemDepthsTransformer } from '../compute-work-item-depths/compute-work-item-depths-transformer';
import { wardAwareConfigIndexTransformer } from '../ward-aware-config-index/ward-aware-config-index-transformer';

export const workItemsInDispatchOrderTransformer = ({
  workItems,
  allWorkItems,
}: {
  workItems: WorkItem[];
  allWorkItems?: WorkItem[];
}): WorkItem[] => {
  const unfilteredItems = allWorkItems ?? workItems;
  const itemMap = new Map<WorkItem['id'], WorkItem>(workItems.map((item) => [item.id, item]));
  const allItemMap = new Map<WorkItem['id'], WorkItem>(
    unfilteredItems.map((item) => [item.id, item]),
  );

  const depths = computeWorkItemDepthsTransformer({ items: workItems, itemMap });

  return [...workItems].sort((a, b) => {
    const depthA = depths.get(a.id) ?? 0;
    const depthB = depths.get(b.id) ?? 0;
    if (depthA !== depthB) return depthA - depthB;

    const configA = wardAwareConfigIndexTransformer({ workItem: a, allItemMap });
    const configB = wardAwareConfigIndexTransformer({ workItem: b, allItemMap });
    if (configA !== configB) return configA - configB;

    return a.createdAt.localeCompare(b.createdAt);
  });
};
