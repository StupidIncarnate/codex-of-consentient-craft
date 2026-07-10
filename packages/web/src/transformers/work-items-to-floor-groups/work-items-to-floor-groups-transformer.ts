/**
 * PURPOSE: Transforms a flat list of work items into topologically-ordered floor groups for dungeon raid display
 *
 * USAGE:
 * workItemsToFloorGroupsTransformer({workItems, allWorkItems});
 * // Returns: FloorGroup[] ordered by dependency depth, role config order, and createdAt
 */

import type { FloorName, WorkItem } from '@dungeonmaster/shared/contracts';
import { floorNameContract } from '@dungeonmaster/shared/contracts';
import { isSkippedWorkItemStatusGuard } from '@dungeonmaster/shared/guards';
import { executionFloorConfigStatics } from '@dungeonmaster/shared/statics';
import {
  computeWorkItemDepthsTransformer,
  resolveWardFloorNameTransformer,
  workItemsInDispatchOrderTransformer,
} from '@dungeonmaster/shared/transformers';

import type { FloorGroup } from '../../contracts/floor-group/floor-group-contract';
import { floorGroupContract } from '../../contracts/floor-group/floor-group-contract';
import type { FloorGroupKey } from '../../contracts/floor-group-key/floor-group-key-contract';
import { floorGroupKeyContract } from '../../contracts/floor-group-key/floor-group-key-contract';
import { floorNumberContract } from '../../contracts/floor-number/floor-number-contract';

export const workItemsToFloorGroupsTransformer = ({
  workItems,
  allWorkItems,
  includeSkipped,
}: {
  workItems: WorkItem[];
  allWorkItems?: WorkItem[];
  includeSkipped?: boolean;
}): FloorGroup[] => {
  const unfilteredItems = allWorkItems ?? workItems;
  const filtered = includeSkipped
    ? [...workItems]
    : workItems.filter((wi) => !isSkippedWorkItemStatusGuard({ status: wi.status }));

  if (filtered.length === 0) return [];

  const itemMap = new Map<WorkItem['id'], WorkItem>();
  for (const item of filtered) {
    itemMap.set(item.id, item);
  }

  const allItemMap = new Map<WorkItem['id'], WorkItem>(
    unfilteredItems.map((item) => [item.id, item]),
  );

  const depths = computeWorkItemDepthsTransformer({ items: filtered, itemMap });

  // Same ordering the orchestrator dispatches by — the scheduler grabs the next ready item from
  // this exact list, so the displayed floor order and the execution order can never drift.
  const sorted = workItemsInDispatchOrderTransformer({
    workItems: filtered,
    allWorkItems: unfilteredItems,
  });

  const entranceFloorNames = new Set(
    executionFloorConfigStatics.floors.filter((f) => f.type === 'entrance').map((f) => f.name),
  );

  const groupKeys: FloorGroupKey[] = [];
  const groupMap = new Map<FloorGroupKey, { floorName: FloorName; items: WorkItem[] }>();

  for (const item of sorted) {
    const depth = depths.get(item.id) ?? 0;
    const floorName =
      item.role === 'ward'
        ? resolveWardFloorNameTransformer({ workItem: item, allItemMap })
        : floorNameContract.parse(
            executionFloorConfigStatics.floors.find((f) => f.role === item.role)?.name ??
              item.role.toUpperCase(),
          );
    const isEntrance = entranceFloorNames.has(
      floorName as (typeof executionFloorConfigStatics.floors)[0]['name'],
    );

    const lastKey = groupKeys.length > 0 ? groupKeys[groupKeys.length - 1] : undefined;
    const lastGroup = lastKey === undefined ? undefined : groupMap.get(lastKey);
    const key =
      isEntrance && lastKey !== undefined && lastGroup?.floorName === floorName
        ? lastKey
        : floorGroupKeyContract.parse(`${String(depth)}:${floorName}`);

    const existing = groupMap.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groupKeys.push(key);
      groupMap.set(key, { floorName, items: [item] });
    }
  }

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
