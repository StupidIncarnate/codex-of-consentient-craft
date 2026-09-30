/**
 * PURPOSE: Walks up from a directory to the nearest ancestor whose package.json declares
 * `workspaces` — the npm-workspaces root. Returns null instead of throwing when no ancestor
 * qualifies (unlike findRepoRootLayerBroker, a broker unreachable from middleware/'s own layer
 * rules), since workspacePackageImportResolveMiddleware treats "no workspace root" as just another
 * reason a cross-package import cannot resolve.
 *
 * USAGE:
 * const root = workspaceRootFindMiddleware({ dirPath: '/repo/packages/bin/src' });
 * // Returns FilePath ('/repo') or null
 */

import { dirname, join } from '#gateway/node/path';
import { workspacePackageJsonReadMiddleware } from '../workspace-package-json-read/workspace-package-json-read-middleware';

export const workspaceRootFindMiddleware = ({ dirPath }: { dirPath: string }): string | null => {
  const packageJsonPath = join(dirPath, 'package.json');
  const packageJson = workspacePackageJsonReadMiddleware({ packageJsonPath });
  if (packageJson?.workspaces) {
    return dirPath;
  }

  const parentPath = dirname(dirPath);
  if (parentPath === dirPath) {
    return null;
  }

  return workspaceRootFindMiddleware({ dirPath: parentPath });
};
