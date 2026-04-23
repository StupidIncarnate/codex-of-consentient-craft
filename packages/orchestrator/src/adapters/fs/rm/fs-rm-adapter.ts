/**
 * PURPOSE: Remove a file or directory on the filesystem using fs/promises rm
 *
 * USAGE:
 * await fsRmAdapter({ filePath: FilePathStub({value: '/path/to/dir'}), recursive: true, force: true });
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
