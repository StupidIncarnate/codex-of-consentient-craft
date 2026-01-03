/**
 * PURPOSE: Validates project requirements before installing dungeonmaster packages
 *
 * USAGE:
 * const result = installCheckBroker({ projectRoot: '/home/user/project' as FilePath });
 * if (!result.valid) { console.error(result.error); }
 * // Returns validation result with optional error message
 */

import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { ErrorMessage } from '../../../contracts/error-message/error-message-contract';

/**
 * Validates that a project has required files/directories for install
 * Checks for package.json and .claude/ directory
 */
export const installCheckBroker = ({
  projectRoot,
}: {
  projectRoot: FilePath;
}): { valid: boolean; error?: ErrorMessage } => {
  const packageJsonPath = pathJoinAdapter({ paths: [projectRoot, 'package.json'] });
  const claudeDirPath = pathJoinAdapter({ paths: [projectRoot, '.claude'] });

  if (!fsExistsSyncAdapter({ filePath: packageJsonPath })) {
    return { valid: false, error: 'No package.json found.' as ErrorMessage };
  }

  if (!fsExistsSyncAdapter({ filePath: claudeDirPath })) {
    return { valid: false, error: 'No .claude directory found.' as ErrorMessage };
  }

  return { valid: true };
};
