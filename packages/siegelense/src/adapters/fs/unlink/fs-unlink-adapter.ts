/**
 * PURPOSE: Removes a file from disk. `bootLockReleaseBroker` reaches for this once it has confirmed
 * `boot.lock` is still held by the releasing instance — the file's disappearance IS the release,
 * since `bootLockAcquireBroker` treats a missing lock file the same way it treats one that was never
 * written. Reach for this over `fsRenameAdapter`/`fsWriteFileAdapter` whenever a caller needs a path
 * to stop existing rather than to hold different contents.
 *
 * USAGE:
 * await fsUnlinkAdapter({
 *   filePath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/boot.lock' }),
 * });
 * // Removes the file, then returns { success: true }
 */

import { unlink } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsUnlinkAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await unlink(filePath);

  return { success: true as const };
};
