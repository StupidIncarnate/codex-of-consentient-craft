/**
 * PURPOSE: Reads directory entries as filenames using fs.promises.readdir
 *
 * USAGE:
 * const entries = await fsReaddirAdapter({ dirPath: FilePathStub({ value: '/path/to/dir' }) });
 * // Returns FileName[] of filenames in the directory
 */

import { readdir } from 'fs/promises';
import { fileNameContract, type FileName, type FilePath } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapter = async ({ dirPath }: { dirPath: FilePath }): Promise<FileName[]> => {
  const entries = await readdir(dirPath);
  return entries.map((entry) => fileNameContract.parse(entry));
};
