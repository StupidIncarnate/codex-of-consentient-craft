/**
 * PURPOSE: Reads directory contents and returns file names
 *
 * USAGE:
 * const files = await fsReaddirAdapter({ dirPath: FilePathStub({ value: '/path/to/dir' }) });
 * // Returns FileName[] of entries in the directory
 */

import { readdir } from 'fs/promises';
import { fileNameContract, type FileName } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsReaddirAdapter = async ({ dirPath }: { dirPath: FilePath }): Promise<FileName[]> => {
  const entries = await readdir(dirPath);
  return entries.map((entry) => fileNameContract.parse(entry));
};
