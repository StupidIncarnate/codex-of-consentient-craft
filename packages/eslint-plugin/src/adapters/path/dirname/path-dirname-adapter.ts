/**
 * PURPOSE: Returns the parent directory of a path using Node.js path runtime
 *
 * USAGE:
 * import {pathDirnameAdapter} from './path-dirname-adapter';
 * const parent = pathDirnameAdapter({ filePath: filePathContract.parse('/path/to/file.txt') });
 * // Returns FilePath branded type: '/path/to'
 */

import { dirname } from 'path';
import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';

export const pathDirnameAdapter = ({ filePath }: { filePath: FilePath }): FilePath =>
  filePathContract.parse(dirname(filePath));
