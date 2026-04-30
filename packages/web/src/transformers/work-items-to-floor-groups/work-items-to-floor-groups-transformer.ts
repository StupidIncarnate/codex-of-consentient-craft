/**
 * PURPOSE: Transforms a flat list of work items into topologically-ordered floor groups for dungeon raid display
 *
 * USAGE:
 * workItemsToFloorGroupsTransformer({workItems, allWorkItems});
 * // Returns: FloorGroup[] ordered by dependency depth, role config order, and createdAt
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';
import { isSkippedWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import type { FloorGroup } from '../../contracts/floor-group/floor-group-contract';
import { floorGroupContract } from '../../contracts/floor-group/floor-group-contract';
import type { FloorGroupKey } from '../../contracts/floor-group-key/floor-group-key-contract';
import { floorGroupKeyContract } from '../../contracts/floor-group-key/floor-group-key-contract';
import type { FloorName } from '../../contracts/floor-name/floor-name-contract';
import { floorNameContract } from '../../contracts/floor-name/floor-name-contract';
import { floorNumberContract } from '../../contracts/floor-number/floor-number-contract';
import { executionFloorConfigStatics } from '../../statics/execution-floor-config/execution-floor-config-statics';
import { computeWorkItemDepthsTransformer } from '../compute-work-item-depths/compute-work-item-depths-transformer';
import { resolveWardFloorNameTransformer } from '../resolve-ward-floor-name/resolve-ward-floor-name-transformer';
import { roleToConfigIndexTransformer } from '../role-to-config-index/role-to-config-index-transformer';

export const workItemsToFloorGroupsTransformer = ({
  workItems,
  allWorkItems,
}: {
  workItems: WorkItem[];
  allWorkItems?: WorkItem[];
}): FloorGroup[] => {
  const unfilteredItems = allWorkItems ?? workItems;
  const filtered = workItems.filter((wi) => !isSkippedWorkItemStatusGuard({ status: wi.status }));

  if (filtered.length === 0) return [];

  const itemMap = new Map<WorkItem['id'], WorkItem>();
  for (const item of filtered) {
    itemMap.set(item.id, item);
  }

  const depths = computeWorkItemDepthsTransformer({ items: filtered, itemMap });

  const sorted = [...filtered].sort((a, b) => {
    const depthA = depths.get(a.id) ?? 0;
    const depthB = depths.get(b.id) ?? 0;
    if (depthA !== depthB) return depthA - depthB;

    const configA = roleToConfigIndexTransformer({ role: a.role });
    const configB = roleToConfigIndexTransformer({ role: b.role });
    if (configA !== configB) return configA - configB;

    return a.createdAt.localeCompare(b.createdAt);
  });

  const groupKeys: FloorGroupKey[] = [];
  const groupMap = new Map<FloorGroupKey, { floorName: FloorName; items: WorkItem[] }>();

  for (const item of sorted) {
    const depth = depths.get(item.id) ?? 0;
    const floorName =
      item.role === 'ward'
        ? resolveWardFloorNameTransformer({ workItem: item, allWorkItems: unfilteredItems })
        : floorNameContract.parse(
            executionFloorConfigStatics.floors.find((f) => f.role === item.role)?.name ??
              item.role.toUpperCase(),
          );
    const key = floorGroupKeyContract.parse(`${String(depth)}:${floorName}`);

    const existing = groupMap.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groupKeys.push(key);
      groupMap.set(key, { floorName, items: [item] });
    }
  }

  const entranceFloorNames = new Set(
    executionFloorConfigStatics.floors.filter((f) => f.type === 'entrance').map((f) => f.name),
  );

  let floorCounter = 0;
  const groups: FloorGroup[] = [];

  for (const key of groupKeys) {
    const group = groupMap.get(key);
    if (!group) continue;
    const isEntrance = entranceFloorNames.has(
      group.floorName as (typeof executionFloorConfigStatics.floors)[0]['name'],
    );

    let floorNumber = null;
    if (!isEntrance) {
      floorCounter += 1;
      floorNumber = floorNumberContract.parse(floorCounter);
    }

    groups.push(
      floorGroupContract.parse({
        key,
        floorName: group.floorName,
        floorNumber,
        workItems: group.items,
      }),
    );
  }

  return groups;
};
