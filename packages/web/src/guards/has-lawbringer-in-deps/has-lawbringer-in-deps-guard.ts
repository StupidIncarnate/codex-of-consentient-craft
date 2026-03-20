/**
 * PURPOSE: Checks if a work item has any lawbringer role in its transitive dependency chain
 *
 * USAGE:
 * hasLawbringerInDepsGuard({startItem, allItemMap});
 * // Returns true if lawbringer found in transitive deps
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

export const hasLawbringerInDepsGuard = ({
  startItem,
  allItemMap,
}: {
  startItem?: WorkItem;
  allItemMap?: Map<WorkItem['id'], WorkItem>;
}): boolean => {
  if (!startItem || !allItemMap) return false;

  const visited = new Set<WorkItem['id']>();
  const queue = [...startItem.dependsOn];

  while (queue.length > 0) {
    const depId = queue.shift();
    if (!depId) continue;
    if (visited.has(depId)) continue;
    visited.add(depId);

    const dep = allItemMap.get(depId);
    if (!dep) continue;
    if (dep.role === 'lawbringer') return true;

    for (const nextDepId of dep.dependsOn) {
      if (!visited.has(nextDepId)) {
        queue.push(nextDepId);
      }
    }
  }

  return false;
};
