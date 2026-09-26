/**
 * PURPOSE: Reads and validates one package.json off disk, or null when it does not exist or does
 * not parse as a workspace package.json. The one place workspaceRootFindMiddleware and
 * workspacePackageImportResolveMiddleware both go through, so they read every package.json the
 * same way.
 *
 * USAGE:
 * const packageJson = workspacePackageJsonReadMiddleware({
 *   packageJsonPath: filePathContract.parse('/repo/packages/bin/package.json'),
 * });
 * // Returns WorkspacePackageJson or null
 */

import { fsExistsAdapter } from '../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../adapters/fs/read-file/fs-read-file-adapter';
import { workspacePackageJsonContract } from '../../contracts/workspace-package-json/workspace-package-json-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { WorkspacePackageJson } from '../../contracts/workspace-package-json/workspace-package-json-contract';

export const workspacePackageJsonReadMiddleware = ({
  packageJsonPath,
}: {
  packageJsonPath: FilePath;
}): WorkspacePackageJson | null => {
  // fsExistsAdapter (not the -sync variant): its proxy defaults every unstaged path to false,
  // which is what lets workspaceRootFindMiddleware's upward walk run past every ancestor a test
  // never explicitly describes, the same way findRepoRootLayerBroker's own walk does.
  if (!fsExistsAdapter({ filePath: packageJsonPath })) {
    return null;
  }

  const raw = fsReadFileAdapter({ filePath: packageJsonPath });
  const parsed = workspacePackageJsonContract.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
};
