/**
 * PURPOSE: Reads the contents of a directory
 *
 * USAGE:
 * const files = await fsReadDirAdapter({dirPath: FilePathStub({ value: '/quests' })});
 * // Returns array of file names in the directory
 */

import { readdir } from 'fs/promises';
import { fileNameContract } from '../../../contracts/file-name/file-name-contract';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadDirAdapter = async ({ dirPath }: { dirPath: FilePath }): Promise<FileName[]> => {
  const files = await readdir(dirPath);
  return files.map((file) => fileNameContract.parse(file));
};
