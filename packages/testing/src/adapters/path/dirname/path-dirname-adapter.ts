/**
 * PURPOSE: Returns the directory name of a path
 *
 * USAGE:
 * const dir = pathDirnameAdapter({filePath: '/tmp/test/file.txt'});
 * // Returns '/tmp/test' as FilePath
 */

import { dirname } from 'path';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathDirnameAdapter = ({ filePath }: { filePath: string }): FilePath => {
  const dir = dirname(filePath);
  return filePathContract.parse(dir);
};
