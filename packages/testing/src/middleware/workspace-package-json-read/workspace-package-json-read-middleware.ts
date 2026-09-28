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

import { existsSync, readFileSync } from '#gateway/node/fs';
import { workspacePackageJsonContract } from '../../contracts/workspace-package-json/workspace-package-json-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { WorkspacePackageJson } from '../../contracts/workspace-package-json/workspace-package-json-contract';

export const workspacePackageJsonReadMiddleware = ({
  packageJsonPath,
}: {
  packageJsonPath: FilePath;
}): WorkspacePackageJson | null => {
  // The proxy answers every unstaged path "does not exist", which is what lets
  // workspaceRootFindMiddleware's upward walk run past every ancestor a test never describes.
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const raw = readFileSync(packageJsonPath);
  const parsed = workspacePackageJsonContract.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
};
