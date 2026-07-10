/**
 * PURPOSE: Computes topological depth for each work item based on its dependency chain
 *
 * USAGE:
 * computeWorkItemDepthsTransformer({items, itemMap});
 * // Returns: Map<WorkItemId, TopologicalDepth> with depth per item
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { TopologicalDepth } from '../../contracts/topological-depth/topological-depth-contract';
import { topologicalDepthContract } from '../../contracts/topological-depth/topological-depth-contract';

export const computeWorkItemDepthsTransformer = ({
  items,
  itemMap,
}: {
  items: WorkItem[];
  itemMap: Map<WorkItem['id'], WorkItem>;
}): Map<WorkItem['id'], TopologicalDepth> => {
  const itemIds = new Set(items.map((i) => i.id));
  const depths = new Map<WorkItem['id'], TopologicalDepth>();
  // Ids currently on the DFS stack — a dep that points back into this set is a back-edge (cycle).
  const visiting = new Set<WorkItem['id']>();

  // Iterative cycle-breaking longest-path DFS. depth = 1 + max(depth of in-set, non-back-edge deps);
  // back-edges and out-of-set deps are skipped, so a dependency cycle resolves to a finite depth.
  // A plain Kahn topo-sort would never dequeue cycle members and would collapse the cycle plus
  // everything transitively downstream of it to depth 0 — inverting the floor order (e.g.
  // flowrider/siegemaster/lawbringer/blightwarden rendering above codeweaver).
  for (const item of items) {
    if (depths.has(item.id)) continue;

    const stack: WorkItem['id'][] = [item.id];
    while (stack.length > 0) {
      const id = stack[stack.length - 1];
      if (id === undefined || depths.has(id)) {
        stack.pop();
        continue;
      }

      visiting.add(id);
      const dependsOn = itemMap.get(id)?.dependsOn ?? [];

      // Descend into the first in-set, non-back-edge dep that has not been resolved yet.
      const unresolvedDepId = dependsOn.find(
        (depId) =>
          itemIds.has(depId) && itemMap.has(depId) && !visiting.has(depId) && !depths.has(depId),
      );
      if (unresolvedDepId !== undefined) {
        stack.push(unresolvedDepId);
        continue;
      }

      // All resolvable deps are settled — this node is the longest resolved dep path plus one.
      let depth = 0;
      for (const depId of dependsOn) {
        if (!itemIds.has(depId) || !itemMap.has(depId) || visiting.has(depId)) continue;
        const candidate = (depths.get(depId) ?? 0) + 1;
        if (candidate > depth) depth = candidate;
      }

      depths.set(id, topologicalDepthContract.parse(depth));
      visiting.delete(id);
      stack.pop();
    }
  }

  return depths;
};
