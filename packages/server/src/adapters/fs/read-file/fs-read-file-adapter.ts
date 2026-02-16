/**
 * PURPOSE: Read file contents from filesystem using fs/promises
 *
 * USAGE:
 * const contents = await fsReadFileAdapter({ filepath: FilePathStub({ value: '/path/to/file.ts' }) });
 * // Returns: FileContents('export const foo = ...')
 *
 * CONTRACTS: Input: FilePath (branded string)
 * CONTRACTS: Output: FileContents (branded string)
 */

import { readFile } from 'fs/promises';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsReadFileAdapter = async ({
  filepath,
}: {
  filepath: FilePath;
}): Promise<FileContents> => {
  const buffer = await readFile(filepath, 'utf8');

  return fileContentsContract.parse(buffer);
};
