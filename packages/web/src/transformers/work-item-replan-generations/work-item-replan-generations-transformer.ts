/**
 * PURPOSE: Assigns each work item a "replan generation" — 0 for the original wave, 1.. for each
 *   successive replan re-entry. A replan boundary is a bare `pathseeker` work item whose
 *   `insertedBy` chain traces to a `failed` item (a PathSeeker spliced by the signal-back handler on
 *   a blightwarden `failed-replan`); boundaries are ranked by `createdAt` (Nth replan → generation
 *   N). Every item inherits the deepest generation reachable through its `dependsOn` closure, so a
 *   replan pathseeker and its whole regenerated chain form one contiguous generation block. Uses an
 *   iterative, cycle-safe longest-path DFS (mirrors computeWorkItemDepthsTransformer) because a
 *   replan pathseeker has `dependsOn: []` (depth 0) and would otherwise interleave with generation 0.
 *
 * USAGE:
 * workItemReplanGenerationsTransformer({ workItems });
 * // Returns: Map<WorkItemId, FloorGeneration> — generation 0 for the original wave, 1.. per replan
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { FloorGeneration } from '../../contracts/floor-generation/floor-generation-contract';
import { floorGenerationContract } from '../../contracts/floor-generation/floor-generation-contract';
import { hasFailedInsertedByAncestorGuard } from '../../guards/has-failed-inserted-by-ancestor/has-failed-inserted-by-ancestor-guard';

export const workItemReplanGenerationsTransformer = ({
  workItems,
}: {
  workItems: WorkItem[];
}): Map<WorkItem['id'], FloorGeneration> => {
  const itemMap = new Map<WorkItem['id'], WorkItem>(workItems.map((item) => [item.id, item]));

  // Replan boundaries: bare `pathseeker` items spliced (transitively) by a `failed` item. Ranked by
  // createdAt (ISO timestamps sort chronologically), so the Nth replan is generation N.
  const boundaries = workItems
    .filter(
      (item) =>
        item.role === 'pathseeker' &&
        item.insertedBy !== undefined &&
        hasFailedInsertedByAncestorGuard({ workItem: item, itemMap }),
    )
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  const boundaryRank = new Map<WorkItem['id'], FloorGeneration>();
  boundaries.forEach((boundary, index) => {
    boundaryRank.set(boundary.id, floorGenerationContract.parse(index + 1));
  });

  const gens = new Map<WorkItem['id'], FloorGeneration>();
  const visiting = new Set<WorkItem['id']>();

  for (const start of workItems) {
    if (gens.has(start.id)) continue;

    const stack: WorkItem['id'][] = [start.id];
    while (stack.length > 0) {
      const id = stack[stack.length - 1];
      if (id === undefined || gens.has(id)) {
        stack.pop();
        continue;
      }

      visiting.add(id);
      const dependsOn = itemMap.get(id)?.dependsOn ?? [];

      // Descend into the first resolvable, non-back-edge dep not yet settled.
      const unresolvedDepId = dependsOn.find(
        (depId) => itemMap.has(depId) && !visiting.has(depId) && !gens.has(depId),
      );
      if (unresolvedDepId !== undefined) {
        stack.push(unresolvedDepId);
        continue;
      }

      // Own generation is the max of its own boundary rank and every resolvable dep's generation.
      let generation = boundaryRank.get(id) ?? 0;
      for (const depId of dependsOn) {
        if (!itemMap.has(depId) || visiting.has(depId)) continue;
        const depGen = gens.get(depId) ?? 0;
        if (depGen > generation) generation = depGen;
      }

      gens.set(id, floorGenerationContract.parse(generation));
      visiting.delete(id);
      stack.pop();
    }
  }

  return gens;
};
