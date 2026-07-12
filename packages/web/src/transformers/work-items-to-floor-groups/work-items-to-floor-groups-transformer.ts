/**
 * PURPOSE: Transforms a flat list of work items into topologically-ordered floor groups for dungeon
 *   raid display, grouped by replan generation so a failure → replan PathSeeker re-entry renders as a
 *   fresh dungeon: the replan wave sorts as its own contiguous block, its first group carries a
 *   `startsNewGeneration` divider flag, and floor numbering restarts at FLOOR 1 within it.
 *
 * USAGE:
 * workItemsToFloorGroupsTransformer({workItems, allWorkItems});
 * // Returns: FloorGroup[] ordered by replan generation, then dependency depth, role config order, createdAt
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

import type { FloorGeneration } from '../../contracts/floor-generation/floor-generation-contract';
import { floorGenerationContract } from '../../contracts/floor-generation/floor-generation-contract';
import type { FloorGroup } from '../../contracts/floor-group/floor-group-contract';
import { floorGroupContract } from '../../contracts/floor-group/floor-group-contract';
import type { FloorGroupKey } from '../../contracts/floor-group-key/floor-group-key-contract';
import { floorGroupKeyContract } from '../../contracts/floor-group-key/floor-group-key-contract';
import { floorNumberContract } from '../../contracts/floor-number/floor-number-contract';
import { workItemReplanGenerationsTransformer } from '../work-item-replan-generations/work-item-replan-generations-transformer';

const ZERO_GENERATION = floorGenerationContract.parse(0);

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

  // Same intra-wave ordering the orchestrator dispatches by. DISPLAY-ONLY replan-generation grouping
  // is layered on top below — it never reorders within a wave, and never feeds dispatch.
  const sorted = workItemsInDispatchOrderTransformer({
    workItems: filtered,
    allWorkItems: unfilteredItems,
  });

  // A replan PathSeeker (dependsOn: []) has depth 0 and would interleave with the original wave.
  // Compute a generation per item over the FULL set and STABLE-sort by generation only: the gen-0
  // block first, then gen-1, ... Within a generation the dispatch order above is preserved (stable
  // sort), so the replan pathseeker leads its own block and its regenerated chain follows.
  const generations = workItemReplanGenerationsTransformer({ workItems: unfilteredItems });
  const genSorted = [...sorted].sort(
    (a, b) =>
      (generations.get(a.id) ?? ZERO_GENERATION) - (generations.get(b.id) ?? ZERO_GENERATION),
  );

  const entranceFloorNames = new Set(
    executionFloorConfigStatics.floors.filter((f) => f.type === 'entrance').map((f) => f.name),
  );

  const groupKeys: FloorGroupKey[] = [];
  const groupMap = new Map<
    FloorGroupKey,
    { floorName: FloorName; generation: FloorGeneration; items: WorkItem[] }
  >();

  for (const item of genSorted) {
    const depth = depths.get(item.id) ?? 0;
    const generation = generations.get(item.id) ?? ZERO_GENERATION;
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
    // gen-0 keeps the historic `depth:floorName` key; gen>0 gets a `g<N>:` prefix so waves with
    // coincidentally equal depth+floorName never collide. The generation guard on the entrance-merge
    // keeps a replan HOMEBASE from merging into the original HOMEBASE.
    const genPrefix = generation > 0 ? `g${String(generation)}:` : '';
    const key =
      isEntrance &&
      lastKey !== undefined &&
      lastGroup?.floorName === floorName &&
      lastGroup.generation === generation
        ? lastKey
        : floorGroupKeyContract.parse(`${genPrefix}${String(depth)}:${floorName}`);

    const existing = groupMap.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groupKeys.push(key);
      groupMap.set(key, { floorName, generation, items: [item] });
    }
  }

  let floorCounter = 0;
  const groups: FloorGroup[] = [];

  for (let index = 0; index < groupKeys.length; index += 1) {
    const key = groupKeys[index];
    if (key === undefined) continue;
    const group = groupMap.get(key);
    if (!group) continue;
    const isEntrance = entranceFloorNames.has(
      group.floorName as (typeof executionFloorConfigStatics.floors)[0]['name'],
    );

    // Each replan generation restarts the FLOOR counter and marks its first group for a divider. The
    // very first group ever (no previous group) never gets a divider.
    const prevKey = index > 0 ? groupKeys[index - 1] : undefined;
    const prevGroup = prevKey === undefined ? undefined : groupMap.get(prevKey);
    const startsNewGeneration =
      prevGroup !== undefined && group.generation !== prevGroup.generation;
    if (startsNewGeneration) floorCounter = 0;

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
        startsNewGeneration,
      }),
    );
  }

  return groups;
};
