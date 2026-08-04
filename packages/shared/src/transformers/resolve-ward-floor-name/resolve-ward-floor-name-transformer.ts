/**
 * PURPOSE: Resolves the floor name for a ward work item, keying on its wardMode ('full' => FLOOR
 *   BOSS, anything else — including absent — => MINI BOSS) after tracing the insertedBy chain to
 *   the root ward, so a retried ward inherits the mode of the ward it replaced.
 *
 * USAGE:
 * resolveWardFloorNameTransformer({workItem, allItemMap});
 * // Returns: 'MINI BOSS' or 'FLOOR BOSS' as FloorName
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { FloorName } from '../../contracts/floor-name/floor-name-contract';
import { floorNameContract } from '../../contracts/floor-name/floor-name-contract';

export const resolveWardFloorNameTransformer = ({
  workItem,
  allItemMap,
}: {
  workItem: WorkItem;
  allItemMap: Map<WorkItem['id'], WorkItem>;
}): FloorName => {
  let rootWard = workItem;
  const visited = new Set<WorkItem['id']>();
  visited.add(rootWard.id);

  while (rootWard.insertedBy) {
    const parent = allItemMap.get(rootWard.insertedBy);
    if (!parent || parent.role !== 'ward' || visited.has(parent.id)) break;
    visited.add(parent.id);
    rootWard = parent;
  }

  return floorNameContract.parse(rootWard.wardMode === 'full' ? 'FLOOR BOSS' : 'MINI BOSS');
};
