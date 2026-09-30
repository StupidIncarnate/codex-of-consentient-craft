/**
 * PURPOSE: Walks up from a starting directory to the nearest ancestor whose `package.json`
 * declares a `workspaces` field. installTestbedCreateBroker calls this instead of a fixed
 * `__dirname` hop count, which is only correct while this package resolves to its compiled
 * `dist/src/...` location — resolving to `src/...` directly (ts-jest, `--conditions=source`)
 * removes one directory level and the fixed count overshoots the repo root.
 *
 * USAGE:
 * const repoRoot = findRepoRootLayerBroker({ startPath: __dirname });
 * // Returns FilePath to the nearest ancestor holding a package.json with a workspaces field
 */

import { existsSync, readFileSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { workspacePackageJsonContract } from '../../../contracts/workspace-package-json/workspace-package-json-contract';

export const findRepoRootLayerBroker = ({
  startPath,
  currentPath,
}: {
  startPath: string;
  currentPath?: string;
}): string => {
  const searchPath = currentPath ?? startPath;
  const packageJsonPath = join(searchPath, 'package.json');

  if (existsSync(packageJsonPath)) {
    const raw = readFileSync(packageJsonPath);
    const packageJson = workspacePackageJsonContract.safeParse(JSON.parse(raw));
    if (packageJson.success && packageJson.data.workspaces !== undefined) {
      return searchPath;
    }
  }

  const parentPath = dirname(searchPath);

  if (parentPath === searchPath) {
    throw new Error(
      `findRepoRootLayerBroker: reached the filesystem root without finding a package.json with a workspaces field, starting from ${startPath}`,
    );
  }

  return findRepoRootLayerBroker({ startPath, currentPath: parentPath });
};
