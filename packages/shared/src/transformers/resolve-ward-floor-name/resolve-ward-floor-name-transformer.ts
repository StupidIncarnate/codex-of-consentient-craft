/**
 * PURPOSE: Resolves the floor name for a ward work item, keying on its wardMode ('changed' => MINI BOSS,
 *   'full' => FLOOR BOSS). Falls back to tracing the insertedBy chain to the root ward and checking for a
 *   lawbringer in its transitive deps when wardMode is absent (work items written before wardMode existed).
 *
 * USAGE:
 * resolveWardFloorNameTransformer({workItem, allItemMap});
 * // Returns: 'MINI BOSS' or 'FLOOR BOSS' as FloorName
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { FloorName } from '../../contracts/floor-name/floor-name-contract';
import { floorNameContract } from '../../contracts/floor-name/floor-name-contract';
import { hasLawbringerInDepsGuard } from '../../guards/has-lawbringer-in-deps/has-lawbringer-in-deps-guard';

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

  if (rootWard.wardMode === 'full') {
    return floorNameContract.parse('FLOOR BOSS');
  }
  if (rootWard.wardMode === 'changed') {
    return floorNameContract.parse('MINI BOSS');
  }

  const hasLawbringer = hasLawbringerInDepsGuard({
    startItem: rootWard,
    allItemMap,
  });

  return floorNameContract.parse(hasLawbringer ? 'FLOOR BOSS' : 'MINI BOSS');
};
