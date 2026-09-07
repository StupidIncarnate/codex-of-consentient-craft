/**
 * PURPOSE: Answers which packages a set of roots actually depends on, transitively. Reach for this
 * over `dependencyGraphAdjacencyBuildTransformer` alone, which only ever reports a package's DIRECT
 * edges — a cache key built from those misses a change two hops down and serves a stale artifact.
 *
 * The edge set is entirely the caller's: hand it an adjacency built from `dependencies` and the
 * closure is the runtime one, hand it one built from every dependency field and it is the whole
 * toolchain. For a bundle hash that distinction decides how often the bundle is rebuilt, so it is
 * deliberately not decided here.
 *
 * USAGE:
 * dependencyGraphClosureWalkTransformer({
 *   adjacency: new Map([[pkgA, [pkgB]], [pkgB, [pkgC]], [pkgC, []]]),
 *   roots: [pkgA],
 * });
 * // Returns [pkgA, pkgB, pkgC], sorted
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const dependencyGraphClosureWalkTransformer = ({
  adjacency,
  roots,
}: {
  adjacency: Map<PackageJsonName, PackageJsonName[]>;
  roots: readonly PackageJsonName[];
}): PackageJsonName[] => {
  const reached = new Set<PackageJsonName>();

  // The frontier is also the visited list. `for...of` over an array sees elements pushed during
  // the iteration, and nothing is pushed twice, so the walk terminates at the node count without
  // needing a `while` or a shift().
  const frontier: PackageJsonName[] = [];
  for (const root of roots) {
    if (!reached.has(root)) {
      reached.add(root);
      frontier.push(root);
    }
  }

  for (const node of frontier) {
    for (const dependency of adjacency.get(node) ?? []) {
      if (!reached.has(dependency)) {
        reached.add(dependency);
        frontier.push(dependency);
      }
    }
  }

  // Sorted, because a hash built over this list must not change with the order the caller happened
  // to read package.json files in.
  return [...reached].sort();
};
