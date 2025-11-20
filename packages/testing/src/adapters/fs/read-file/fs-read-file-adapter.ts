/**
 * PURPOSE: Reads content from a file at the specified path
 *
 * USAGE:
 * const content = fsReadFileAdapter({filePath: '/tmp/test.txt'});
 * // Returns the file content as FileContent branded type
 */

import { readFileSync } from 'fs';
import { fileContentContract } from '../../../contracts/file-content/file-content-contract';
import type { FileContent } from '../../../contracts/file-content/file-content-contract';

export const fsReadFileAdapter = ({ filePath }: { filePath: string }): FileContent => {
  const content = readFileSync(filePath, 'utf-8');
  return fileContentContract.parse(content);
};
