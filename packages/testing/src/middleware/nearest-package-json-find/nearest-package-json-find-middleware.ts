/**
 * PURPOSE: Walks up from a directory to the nearest ancestor whose package.json exists and parses
 * — the importing file's OWN package, not necessarily the workspaces root — so
 * packageImportsSpecifierResolveMiddleware can read that package's own `imports` map. Distinct from
 * workspaceRootFindMiddleware, which keeps climbing PAST a plain package.json all the way to the
 * ancestor whose package.json declares `workspaces`: a `#`-specifier is declared in the calling
 * package's OWN manifest (`packages/mcp/package.json`), not the monorepo root's, so this stops at
 * the first one found instead.
 *
 * USAGE:
 * const packageJson = nearestPackageJsonFindMiddleware({
 *   dirPath: filePathContract.parse('/repo/packages/mcp/src/brokers/file/scanner'),
 * });
 * // Returns WorkspacePackageJson (packages/mcp/package.json's parsed content) or null
 */

import { dirname, join } from '#gateway/node/path';
import { workspacePackageJsonReadMiddleware } from '../workspace-package-json-read/workspace-package-json-read-middleware';
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { WorkspacePackageJson } from '../../contracts/workspace-package-json/workspace-package-json-contract';

export const nearestPackageJsonFindMiddleware = ({
  dirPath,
}: {
  dirPath: FilePath;
}): WorkspacePackageJson | null => {
  const packageJsonPath = filePathContract.parse(join(dirPath, 'package.json'));
  const packageJson = workspacePackageJsonReadMiddleware({ packageJsonPath });
  if (packageJson) {
    return packageJson;
  }

  const parentPath = filePathContract.parse(dirname(dirPath));
  if (parentPath === dirPath) {
    return null;
  }

  return nearestPackageJsonFindMiddleware({ dirPath: parentPath });
};
