/**
 * PURPOSE: Gets the directory name from a file path using Node.js path module
 *
 * USAGE:
 * import {pathDirnameAdapter} from './path-dirname-adapter';
 * const dirPath = await pathDirnameAdapter({path: filePathContract.parse('/path/to/file.txt')});
 * // Returns FilePath branded type: '/path/to'
 */

import { dirname } from 'path';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';

export const pathDirnameAdapter = ({ path }: { path: FilePath }): FilePath =>
  filePathContract.parse(dirname(path));
