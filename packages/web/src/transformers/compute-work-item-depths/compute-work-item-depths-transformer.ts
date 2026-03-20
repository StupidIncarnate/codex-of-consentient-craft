/**
 * PURPOSE: Computes topological depth for each work item based on its dependency chain
 *
 * USAGE:
 * computeWorkItemDepthsTransformer({items, itemMap});
 * // Returns: Map<WorkItemId, TopologicalDepth> with depth per item
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { DependencyCount } from '../../contracts/dependency-count/dependency-count-contract';
import { dependencyCountContract } from '../../contracts/dependency-count/dependency-count-contract';
import type { TopologicalDepth } from '../../contracts/topological-depth/topological-depth-contract';
import { topologicalDepthContract } from '../../contracts/topological-depth/topological-depth-contract';

export const computeWorkItemDepthsTransformer = ({
  items,
  itemMap,
}: {
  items: WorkItem[];
  itemMap: Map<WorkItem['id'], WorkItem>;
}): Map<WorkItem['id'], TopologicalDepth> => {
  const depths = new Map<WorkItem['id'], TopologicalDepth>();
  const zero = topologicalDepthContract.parse(0);

  const itemIds = new Set(items.map((i) => i.id));
  const inDegree = new Map<WorkItem['id'], DependencyCount>();
  const dependents = new Map<WorkItem['id'], WorkItem['id'][]>();

  for (const item of items) {
    let count = dependencyCountContract.parse(0);
    for (const depId of item.dependsOn) {
      if (itemMap.has(depId) && itemIds.has(depId)) {
        count = dependencyCountContract.parse(count + 1);
        const existing = dependents.get(depId) ?? [];
        existing.push(item.id);
        dependents.set(depId, existing);
      }
    }
    inDegree.set(item.id, count);
    if (count === 0) {
      depths.set(item.id, zero);
    }
  }

  const queue: WorkItem['id'][] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;
    const currentDepth = depths.get(currentId) ?? zero;
    const children = dependents.get(currentId) ?? [];

    for (const childId of children) {
      const childItem = itemMap.get(childId);
      if (!childItem) continue;

      const existingDepth = depths.get(childId);
      const candidateDepth = topologicalDepthContract.parse(currentDepth + 1);

      if (existingDepth === undefined || candidateDepth > existingDepth) {
        depths.set(childId, candidateDepth);
      }

      const remaining = dependencyCountContract.parse((inDegree.get(childId) ?? 1) - 1);
      inDegree.set(childId, remaining);

      if (remaining === 0) {
        queue.push(childId);
      }
    }
  }

  for (const item of items) {
    if (!depths.has(item.id)) {
      depths.set(item.id, zero);
    }
  }

  return depths;
};
