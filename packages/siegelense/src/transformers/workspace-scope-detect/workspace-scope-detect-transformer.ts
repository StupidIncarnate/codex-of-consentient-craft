/**
 * PURPOSE: `InstallRecipesScaffoldResponder` needs the npm scope this consumer repo's OWN workspace
 * packages already use, so a scaffolded `hydration-recipes` package.json's `name` matches its
 * siblings instead of carrying dungeonmaster's own scope. Reads it back off the root package.json's
 * `dependencies` — the one place a workspace's scope is already committed — picking the FIRST scoped
 * entry pinned to `*` in key order. Duplicates `@dungeonmaster/cli`'s own
 * `workspaceScopeDetectTransformer` (same convention, `dungeonmaster create-package` uses it too)
 * rather than importing across packages, so the two scaffolders stay independently owned
 * (`siegelense-consumer-lanes.md`, section 3.6).
 *
 * USAGE:
 * workspaceScopeDetectTransformer({ rootPackageJson });
 * // Returns '@dungeonmaster' for this repo's own root package.json, or an empty PathSegment when no
 * // workspace-scoped dependency is present
 */

import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment, PackageJson } from '@dungeonmaster/shared/contracts';

const WORKSPACE_DEPENDENCY_VERSION = '*';

export const workspaceScopeDetectTransformer = ({
  rootPackageJson,
}: {
  rootPackageJson: PackageJson;
}): PathSegment => {
  const dependencies = rootPackageJson.dependencies ?? {};

  const workspaceEntry = Object.entries(dependencies).find(
    ([name, version]) =>
      version === WORKSPACE_DEPENDENCY_VERSION && name.startsWith('@') && name.includes('/'),
  );

  if (workspaceEntry === undefined) {
    return pathSegmentContract.parse('');
  }

  const [scopedName] = workspaceEntry;

  return pathSegmentContract.parse(scopedName.slice(0, scopedName.indexOf('/')));
};
