/**
 * PURPOSE: Reads subdirectory names from a directory path using withFileTypes to exclude files
 *
 * USAGE:
 * const dirs = await fsReaddirDirsAdapter({ dirPath: FilePathStub({ value: '/path/to/dir' }) });
 * // Returns FileName[] of subdirectory names only
 */

import { readdir } from 'fs/promises';
import { fileNameContract, type FileName, type FilePath } from '@dungeonmaster/shared/contracts';

export const fsReaddirDirsAdapter = async ({
  dirPath,
}: {
  dirPath: FilePath;
}): Promise<FileName[]> => {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries.filter((d) => d.isDirectory()).map((d) => fileNameContract.parse(d.name));
};
