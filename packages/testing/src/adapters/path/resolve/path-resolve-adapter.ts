/**
 * PURPOSE: Resolves a sequence of paths to an absolute path
 *
 * USAGE:
 * const absolutePath = pathResolveAdapter({paths: ['src', 'test.ts']});
 * // Returns absolute path as FilePath
 */

import { resolve } from 'path';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathResolveAdapter = ({ paths }: { paths: string[] }): FilePath => {
  const resolved = resolve(...paths);
  return filePathContract.parse(resolved);
};
