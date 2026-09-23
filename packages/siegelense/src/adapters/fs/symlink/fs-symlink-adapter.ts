/**
 * PURPOSE: Creates a symlink on disk, typed `'dir'` so platforms that distinguish file and
 * directory links resolve it correctly. `installLinkCreateResponder` is the sole caller — it
 * materializes `<repoRoot>/.dungeonmaster-assets/siegelense-assets` onto the siegelense root. Reach for this over
 * fsReadlinkAdapter whenever a caller needs to CREATE the link rather than read where one
 * already points.
 *
 * USAGE:
 * await fsSymlinkAdapter({
 *   targetPath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
 *   linkPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }),
 * });
 * // Creates the symlink, then returns { success: true }
 */

import { symlink } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsSymlinkAdapter = async ({
  targetPath,
  linkPath,
}: {
  targetPath: AbsoluteFilePath;
  linkPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await symlink(targetPath, linkPath, 'dir');

  return { success: true as const };
};
