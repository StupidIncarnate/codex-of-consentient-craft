/**
 * PURPOSE: Read directory contents from filesystem using fs/promises
 *
 * USAGE:
 * const entries = await fsReaddirAdapter({ filepath: FilePathStub({ value: '/path/to/dir' }) });
 * // Returns: FolderName[] of directory entry names
 *
 * CONTRACTS: Input: FilePath (branded string)
 * CONTRACTS: Output: FolderName[]
 */

import { readdir } from 'fs/promises';
import { folderNameContract } from '../../../contracts/folder-name/folder-name-contract';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsReaddirAdapter = async ({
  filepath,
}: {
  filepath: FilePath;
}): Promise<FolderName[]> => {
  const entries = await readdir(filepath);
  return entries.map((entry) => folderNameContract.parse(entry));
};
