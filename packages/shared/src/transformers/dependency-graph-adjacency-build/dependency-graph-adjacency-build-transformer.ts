/**
 * PURPOSE: Builds a package dependency adjacency map from a flat package list, restricting edges to targets also present in that list
 *
 * USAGE:
 * dependencyGraphAdjacencyBuildTransformer({
 *   packages: [{ name: pkgA, dependencyNames: [pkgB] }, { name: pkgB, dependencyNames: [] }],
 * });
 * // Returns: Map(pkgA -> [pkgB], pkgB -> [])
 *
 * WHEN-TO-USE: For a package DEPENDENCY TREE, where every package in `packages` belongs in the
 * graph regardless of any tsconfig/build eligibility. `projectReferencesDeriveTransformer` filters
 * its workspaces to `isCompositeEligible` BEFORE calling this — that filter is a tsconfig concern
 * and does not belong inside this transformer, or a non-composite-eligible package would silently
 * vanish from a graph that has nothing to do with tsconfig project references.
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const dependencyGraphAdjacencyBuildTransformer = ({
  packages,
}: {
  packages: readonly { name: PackageJsonName; dependencyNames: readonly PackageJsonName[] }[];
}): Map<PackageJsonName, PackageJsonName[]> => {
  const knownNames = new Set<PackageJsonName>(packages.map(({ name }) => name));

  const adjacency = new Map<PackageJsonName, PackageJsonName[]>();
  for (const { name, dependencyNames } of packages) {
    const deps: PackageJsonName[] = [];
    for (const depName of dependencyNames) {
      if (knownNames.has(depName) && depName !== name) {
        deps.push(depName);
      }
    }
    adjacency.set(name, deps);
  }

  return adjacency;
};
