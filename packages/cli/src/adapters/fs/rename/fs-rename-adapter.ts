/**
 * PURPOSE: Atomically renames a file using fs/promises (POSIX-atomic on same filesystem)
 *
 * USAGE:
 * await fsRenameAdapter({ from: FilePathStub({value: '/x.tmp'}), to: FilePathStub({value: '/x.json'}) });
 * // Atomically replaces destination with source
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
