/**
 * PURPOSE: Rename a file on the filesystem using fs/promises (POSIX-atomic on same filesystem)
 *
 * USAGE:
 * await fsRenameAdapter({ from: FilePathStub({value: '/path/to/file.tmp'}), to: FilePathStub({value: '/path/to/file.json'}) });
 * // Atomically renames file from source to destination
 */

import { rename } from 'fs/promises';
import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapter = async ({
  from,
  to,
}: {
  from: FilePath;
  to: FilePath;
}): Promise<AdapterResult> => {
  await rename(from, to);

  return { success: true as const };
};
