/**
 * PURPOSE: Recursively DFS the residual subgraph from a node, returning the closed cycle path when one is found
 *
 * USAGE:
 * const cycle = dependencyGraphFindCyclePathTransformer({
 *   adjacency, residual, node: start, path: [], pathIndex: new Map(), visited: new Set(),
 * });
 * // Returns [a, b, a] for a -> b -> a, or null if no cycle reachable from `node` within `residual`
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const dependencyGraphFindCyclePathTransformer = ({
  adjacency,
  residual,
  node,
  path,
  pathIndex,
  visited,
}: {
  adjacency: Map<PackageJsonName, PackageJsonName[]>;
  residual: Set<PackageJsonName>;
  node: PackageJsonName;
  path: PackageJsonName[];
  pathIndex: Map<PackageJsonName, number>;
  visited: Set<PackageJsonName>;
}): PackageJsonName[] | null => {
  const existingIndex = pathIndex.get(node);
  if (existingIndex !== undefined) {
    return [...path.slice(existingIndex), node];
  }
  if (visited.has(node)) {
    return null;
  }
  visited.add(node);
  pathIndex.set(node, path.length);
  path.push(node);
  for (const dep of adjacency.get(node) ?? []) {
    if (!residual.has(dep)) {
      continue;
    }
    const found = dependencyGraphFindCyclePathTransformer({
      adjacency,
      residual,
      node: dep,
      path,
      pathIndex,
      visited,
    });
    if (found !== null) {
      return found;
    }
  }
  path.pop();
  pathIndex.delete(node);
  return null;
};
