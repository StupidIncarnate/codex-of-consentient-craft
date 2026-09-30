/**
 * PURPOSE: Validates project requirements before installing dungeonmaster packages
 *
 * USAGE:
 * const result = installCheckBroker({ projectRoot: '/home/user/project' as FilePath });
 * if (!result.valid) { console.error(result.error); }
 * // Returns validation result with optional error message
 */

import { existsSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

/**
 * Validates that a project has required files/directories for install
 * Checks for package.json and .claude/ directory
 */
export const installCheckBroker = ({
  projectRoot,
}: {
  projectRoot: string;
}): { valid: boolean; error?: string } => {
  const packageJsonPath = join(projectRoot, 'package.json');
  const claudeDirPath = join(projectRoot, locationsStatics.repoRoot.claude.dir);

  if (!existsSync(packageJsonPath)) {
    return { valid: false, error: 'No package.json found.' as string };
  }

  if (!existsSync(claudeDirPath)) {
    return { valid: false, error: 'No .claude directory found.' as string };
  }

  return { valid: true };
};
