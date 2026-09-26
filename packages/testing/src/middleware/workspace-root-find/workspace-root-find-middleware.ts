/**
 * PURPOSE: Walks up from a directory to the nearest ancestor whose package.json declares
 * `workspaces` — the npm-workspaces root. Returns null instead of throwing when no ancestor
 * qualifies (unlike findRepoRootLayerBroker, a broker unreachable from middleware/'s own layer
 * rules), since workspacePackageImportResolveMiddleware treats "no workspace root" as just another
 * reason a cross-package import cannot resolve.
 *
 * USAGE:
 * const root = workspaceRootFindMiddleware({ dirPath: filePathContract.parse('/repo/packages/bin/src') });
 * // Returns FilePath ('/repo') or null
 */

import { pathDirnameAdapter } from '../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../adapters/path/join/path-join-adapter';
import { workspacePackageJsonReadMiddleware } from '../workspace-package-json-read/workspace-package-json-read-middleware';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export const workspaceRootFindMiddleware = ({
  dirPath,
}: {
  dirPath: FilePath;
}): FilePath | null => {
  const packageJsonPath = pathJoinAdapter({ paths: [dirPath, 'package.json'] });
  const packageJson = workspacePackageJsonReadMiddleware({ packageJsonPath });
  if (packageJson?.workspaces) {
    return dirPath;
  }

  const parentPath = pathDirnameAdapter({ filePath: dirPath });
  if (parentPath === dirPath) {
    return null;
  }

  return workspaceRootFindMiddleware({ dirPath: parentPath });
};
