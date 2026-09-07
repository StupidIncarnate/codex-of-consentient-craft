/**
 * PURPOSE: `dungeonmaster create-package` needs the npm scope this monorepo's own workspace packages
 * already use, so a scaffolded package matches its siblings instead of carrying a scope hardcoded for
 * one repo. Reads it back off the root package.json's own `dependencies`, the one place a workspace's
 * scope is already committed, rather than a config value someone has to keep in sync. Picks the FIRST
 * scoped entry in key order, not the most common one — deterministic, and a repo mixing two scopes
 * among its workspace packages is a question this transformer has no business guessing at.
 *
 * USAGE:
 * workspaceScopeDetectTransformer({ rootPackageJson });
 * // Returns '@dungeonmaster' for this repo's own root package.json, or an empty PathSegment when no
 * // workspace-scoped dependency is present
 */

import { pathSegmentContract, type PathSegment } from '@dungeonmaster/shared/contracts';
import { dependencyMapContract } from '../../contracts/dependency-map/dependency-map-contract';
import { packageScaffoldConfigStatics } from '../../statics/package-scaffold-config/package-scaffold-config-statics';
import type { PackageJsonRaw } from '../../contracts/package-json-raw/package-json-raw-contract';

export const workspaceScopeDetectTransformer = ({
  rootPackageJson,
}: {
  rootPackageJson: PackageJsonRaw;
}): PathSegment => {
  const dependenciesEntry = Object.entries(rootPackageJson).find(([key]) => key === 'dependencies');
  const parsedDependencies = dependencyMapContract.safeParse(dependenciesEntry?.[1]);

  if (!parsedDependencies.success) {
    return pathSegmentContract.parse('');
  }

  const workspaceEntry = Object.entries(parsedDependencies.data).find(
    ([name, version]) =>
      version === packageScaffoldConfigStatics.workspaceDependencyVersion &&
      name.startsWith('@') &&
      name.includes('/'),
  );

  if (workspaceEntry === undefined) {
    return pathSegmentContract.parse('');
  }

  const [scopedName] = workspaceEntry;

  return pathSegmentContract.parse(scopedName.slice(0, scopedName.indexOf('/')));
};
