/**
 * PURPOSE: Produces a topological ordering of a dependency graph using Kahn's algorithm, or detects a cycle
 *
 * USAGE:
 * const adjacency = new Map([['@pkg/a', ['@pkg/b']], ['@pkg/b', []]]);
 * dependencyGraphTopologicalOrderTransformer({ adjacency });
 * // Returns: { order: ['@pkg/b', '@pkg/a'], cycle: null } (leaves/dependencies first)
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';
import { dependencyGraphFindCyclePathTransformer } from '../dependency-graph-find-cycle-path/dependency-graph-find-cycle-path-transformer';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const dependencyGraphTopologicalOrderTransformer = ({
  adjacency,
}: {
  adjacency: Map<PackageJsonName, PackageJsonName[]>;
}): { order: PackageJsonName[] | null; cycle: PackageJsonName[] | null } => {
  // in-degree = number of dependencies each package has (how many packages it depends on)
  // packages with zero dependencies (leaves) go first in the output order
  const inDegree = new Map<PackageJsonName, ReturnType<typeof Number>>();

  for (const [node, deps] of adjacency.entries()) {
    inDegree.set(node, deps.length);
    for (const dep of deps) {
      if (!inDegree.has(dep)) {
        inDegree.set(dep, 0);
      }
    }
  }

  // reverse adjacency: dep -> [nodes that depend on dep]
  const reverseAdj = new Map<PackageJsonName, PackageJsonName[]>();
  for (const node of inDegree.keys()) {
    reverseAdj.set(node, []);
  }
  for (const [node, deps] of adjacency.entries()) {
    for (const dep of deps) {
      reverseAdj.get(dep)?.push(node);
    }
  }

  // Use the order array as both the processing queue and the result.
  // for...of over a JavaScript array sees elements pushed during the iteration,
  // so this safely processes the BFS frontier without needing shift() or index access.
  const order: PackageJsonName[] = [];
  for (const [node, degree] of inDegree.entries()) {
    if (degree === 0) {
      order.push(node);
    }
  }

  for (const node of order) {
    for (const dependent of reverseAdj.get(node) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        order.push(dependent);
      }
    }
  }

  if (order.length === inDegree.size) {
    return { order, cycle: null };
  }

  const residual = new Set(
    [...inDegree.entries()].filter(([, degree]) => degree > 0).map(([node]) => node),
  );

  const visited = new Set<PackageJsonName>();
  for (const start of residual) {
    const found = dependencyGraphFindCyclePathTransformer({
      adjacency,
      residual,
      node: start,
      path: [],
      pathIndex: new Map(),
      visited,
    });
    if (found !== null) {
      return { order: null, cycle: found };
    }
  }

  return { order: null, cycle: [...residual] };
};
