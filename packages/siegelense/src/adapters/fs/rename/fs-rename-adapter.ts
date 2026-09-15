/**
 * PURPOSE: Renames a file on disk (POSIX-atomic on the same filesystem). This is the second half
 * of the registry's write-to-tmp-then-rename pair: fsWriteFileAdapter lands the new contents at
 * `registry.json.tmp`, and this call swaps it over the live `registry.json` in one atomic step,
 * so a concurrent read of the live file never observes a half-written registry even with three
 * sessions sharing one machine. Reach for this over fsWriteFileAdapter once the tmp path already
 * holds the full contents and only the atomic swap remains.
 *
 * USAGE:
 * await fsRenameAdapter({
 *   fromPath: AbsoluteFilePathStub({
 *     value: '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
 *   }),
 *   toPath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/registry.json' }),
 * });
 * // Atomically renames fromPath onto toPath, then returns { success: true }
 */

import { rename } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapter = async ({
  fromPath,
  toPath,
}: {
  fromPath: AbsoluteFilePath;
  toPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await rename(fromPath, toPath);

  return { success: true as const };
};
