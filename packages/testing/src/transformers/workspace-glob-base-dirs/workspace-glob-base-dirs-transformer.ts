/**
 * PURPOSE: Extracts the base directories a workspaces ROOT's own `workspaces` array declares for
 * one-level package scanning — `["packages/*", "packages/@gateway/*"]` yields `["packages",
 * "packages/@gateway"]` — so workspacePackageImportResolveMiddleware scans every declared group
 * folder (a `packages/*`-style entry) instead of a single hardcoded `packages` directory. Falls
 * back to `["packages"]` when `workspaces` is missing, is the Yarn-style `{packages: [...]}`
 * object shape (this repo's own root never uses it), or has no glob ending in `/*` — the exact
 * directory the resolver always scanned before this file existed.
 *
 * USAGE:
 * workspaceGlobBaseDirsTransformer({ workspaces: ['packages/*', 'packages/@gateway/*'] });
 * // Returns ['packages', 'packages/@gateway'] as branded RelativePath[]
 */

import type { WorkspacePackageJson } from '../../contracts/workspace-package-json/workspace-package-json-contract';

const SINGLE_LEVEL_GLOB_SUFFIX = '/*';
const DEFAULT_PACKAGES_BASE_DIR = 'packages';

export const workspaceGlobBaseDirsTransformer = ({
  workspaces,
}: {
  workspaces: WorkspacePackageJson['workspaces'];
}): string[] => {
  if (!Array.isArray(workspaces)) {
    return [DEFAULT_PACKAGES_BASE_DIR];
  }

  const baseDirs = workspaces
    .filter((glob) => glob.endsWith(SINGLE_LEVEL_GLOB_SUFFIX))
    .map((glob) => glob.slice(0, -SINGLE_LEVEL_GLOB_SUFFIX.length));

  return baseDirs.length > 0 ? baseDirs : [DEFAULT_PACKAGES_BASE_DIR];
};
