/**
 * PURPOSE: Joins path segments into a single path
 *
 * USAGE:
 * const fullPath = pathJoinAdapter({paths: ['/tmp', 'test', 'file.txt']});
 * // Returns '/tmp/test/file.txt' as FilePath
 */

import { join } from 'path';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapter = ({ paths }: { paths: string[] }): FilePath => {
  const joined = join(...paths);
  return filePathContract.parse(joined);
};
