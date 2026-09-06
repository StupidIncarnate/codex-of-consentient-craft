/**
 * PURPOSE: Removes a file or a whole directory tree. Reach for this over fsUnlinkAdapter whenever
 * the target may be a directory — unlink refuses one — and pass `force` wherever a concurrent run
 * may have removed the same path first, since ward's e2e cleanup races itself by design.
 *
 * USAGE:
 * await fsRmAdapter({ filePath: FilePathStub({ value: '/path/to/dir' }), recursive: true, force: true });
 * // Removes the file or directory at the specified path
 */

import { rm } from 'fs/promises';
import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';

export const fsRmAdapter = async ({
  filePath,
  recursive,
  force,
}: {
  filePath: FilePath;
  recursive?: boolean;
  force?: boolean;
}): Promise<AdapterResult> => {
  await rm(filePath, { recursive, force });

  return { success: true as const };
};
