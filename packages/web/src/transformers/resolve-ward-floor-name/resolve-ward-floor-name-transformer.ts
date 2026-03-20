/**
 * PURPOSE: Resolves the floor name for a ward work item by tracing its insertedBy chain to find the root ward
 *
 * USAGE:
 * resolveWardFloorNameTransformer({workItem, allWorkItems});
 * // Returns: 'MINI BOSS' or 'FLOOR BOSS' as FloorName
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { FloorName } from '../../contracts/floor-name/floor-name-contract';
import { floorNameContract } from '../../contracts/floor-name/floor-name-contract';
import { hasLawbringerInDepsGuard } from '../../guards/has-lawbringer-in-deps/has-lawbringer-in-deps-guard';

export const resolveWardFloorNameTransformer = ({
  workItem,
  allWorkItems,
}: {
  workItem: WorkItem;
  allWorkItems: WorkItem[];
}): FloorName => {
  const allItemMap = new Map<WorkItem['id'], WorkItem>();
  for (const wi of allWorkItems) {
    allItemMap.set(wi.id, wi);
  }

  let rootWard = workItem;
  const visited = new Set<WorkItem['id']>();
  visited.add(rootWard.id);

  while (rootWard.insertedBy) {
    const parent = allItemMap.get(rootWard.insertedBy);
    if (!parent || parent.role !== 'ward' || visited.has(parent.id)) break;
    visited.add(parent.id);
    rootWard = parent;
  }

  const hasLawbringer = hasLawbringerInDepsGuard({
    startItem: rootWard,
    allItemMap,
  });

  return floorNameContract.parse(hasLawbringer ? 'FLOOR BOSS' : 'MINI BOSS');
};
