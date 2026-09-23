/**
 * PURPOSE: Answers whether a parsed package.json's `dependencies` map already carries a given
 * name. Reach for this over indexing `packageJson.dependencies` directly — the shared PackageJson
 * contract brands each dependency name and version, so a plain string can't index that record
 * without this guard doing the lookup on its behalf.
 *
 * USAGE:
 * hasPackageJsonDependencyGuard({ packageJson, dependencyName: '@dungeonmaster/hydration-recipes' });
 * // Returns true when packageJson.dependencies has that key
 */

import type { PackageJson } from '@dungeonmaster/shared/contracts';

export const hasPackageJsonDependencyGuard = ({
  packageJson,
  dependencyName,
}: {
  packageJson?: PackageJson;
  dependencyName?: string;
}): boolean => {
  if (!packageJson || !dependencyName) {
    return false;
  }

  return Object.hasOwn(packageJson.dependencies ?? {}, dependencyName);
};
