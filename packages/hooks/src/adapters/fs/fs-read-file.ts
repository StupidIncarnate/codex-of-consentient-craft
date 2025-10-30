/**
 * PURPOSE: Adapter for fs.readFile with validation to read file contents
 *
 * USAGE:
 * const contents = await fsReadFile({ filePath: '/path/to/file.ts' });
 * // Returns validated FileContents string
 */
import { readFile } from 'fs/promises';
import { fileContentsContract } from '../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

export const fsReadFile = async ({ filePath }: { filePath: FilePath }): Promise<FileContents> => {
  const content = await readFile(filePath, 'utf8');
  return fileContentsContract.parse(content);
};
