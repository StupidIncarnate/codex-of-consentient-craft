/**
 * PURPOSE: Creates a symbolic link at linkPath pointing to target
 *
 * USAGE:
 * await fsSymlinkAdapter({ target, linkPath });
 * // Creates linkPath pointing to target
 */

import { symlink } from 'fs/promises';
import type { AdapterResult, PathSegment } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsSymlinkAdapter = async ({
  target,
  linkPath,
}: {
  target: PathSegment | FilePath;
  linkPath: FilePath;
}): Promise<AdapterResult> => {
  await symlink(target, linkPath);

  return { success: true as const };
};
