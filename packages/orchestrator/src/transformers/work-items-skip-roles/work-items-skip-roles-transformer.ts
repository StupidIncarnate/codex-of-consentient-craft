/**
 * PURPOSE: Drops work items whose role is in skipRoles and rewires downstream dependsOn to point at the skipped items' predecessors
 *
 * USAGE:
 * workItemsSkipRolesTransformer({ workItems, skipRoles: ['ward'] });
 * // Returns: WorkItem[] with every ward item removed and downstream dependsOn arrays expanded through the removed items to their predecessors (transitive).
 *
 * WHEN-TO-USE: When a caller needs to produce a smaller orchestration graph than stepsToWorkItemsTransformer would emit (e.g. smoketests bypassing ward).
 * WHEN-NOT-TO-USE: For runtime skipping of already-running items — skipRoles here operates pre-dispatch on the static graph, not on live work tracker state.
 */

import type { QuestWorkItemId, WorkItem, WorkItemRole } from '@dungeonmaster/shared/contracts';

export const workItemsSkipRolesTransformer = ({
  workItems,
  skipRoles,
}: {
  workItems: WorkItem[];
  skipRoles: WorkItemRole[];
}): WorkItem[] => {
  if (skipRoles.length === 0) {
    return workItems;
  }

  const skipRoleSet = new Set<WorkItemRole>(skipRoles);
  const skipIds = new Set<QuestWorkItemId>();
  const skippedItemDeps = new Map<QuestWorkItemId, readonly QuestWorkItemId[]>();

  for (const item of workItems) {
    if (skipRoleSet.has(item.role)) {
      skipIds.add(item.id);
      skippedItemDeps.set(item.id, item.dependsOn);
    }
  }

  return workItems
    .filter((item) => !skipRoleSet.has(item.role))
    .map((item) => {
      const visited = new Set<QuestWorkItemId>();
      const resolved = new Set<QuestWorkItemId>();
      const queue: QuestWorkItemId[] = [...item.dependsOn];

      while (queue.length > 0) {
        const depId = queue.shift();
        if (depId === undefined) {
          break;
        }
        if (visited.has(depId)) {
          continue;
        }
        visited.add(depId);
        if (skipIds.has(depId)) {
          for (const predId of skippedItemDeps.get(depId) ?? []) {
            queue.push(predId);
          }
        } else {
          resolved.add(depId);
        }
      }

      return {
        ...item,
        dependsOn: [...resolved],
      };
    });
};
