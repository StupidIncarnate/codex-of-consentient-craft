/**
 * PURPOSE: Joins path segments into a single path using Node.js path runtime
 *
 * USAGE:
 * import {pathJoinAdapter} from './path-join-adapter';
 * const fullPath = pathJoinAdapter({paths: ['/path', 'to', 'file.txt']});
 * // Returns FilePath branded type: '/path/to/file.txt'
 */

import { join } from 'path';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapter = ({ paths }: { paths: string[] }): FilePath =>
  filePathContract.parse(join(...paths));
