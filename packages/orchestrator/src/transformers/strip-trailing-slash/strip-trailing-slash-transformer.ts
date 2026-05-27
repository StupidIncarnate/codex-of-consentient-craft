/**
 * PURPOSE: Removes any trailing forward-slash run from a filesystem path string, used to canonicalize paths before equality comparison so '/repo' and '/repo/' compare equal.
 *
 * USAGE:
 * const canonical = stripTrailingSlashTransformer({ path: '/home/user/repo/' });
 * // Returns: branded FilePath '/home/user/repo'
 *
 * const alreadyClean = stripTrailingSlashTransformer({ path: '/home/user/repo' });
 * // Returns: branded FilePath '/home/user/repo'
 */

import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

export const stripTrailingSlashTransformer = ({ path }: { path: string }): FilePath =>
  filePathContract.parse(path.replace(/\/+$/u, ''));
