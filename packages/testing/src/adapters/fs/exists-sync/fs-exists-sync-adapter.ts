/**
 * PURPOSE: Checks if a file exists synchronously using fs.existsSync
 *
 * USAGE:
 * const exists = fsExistsSyncAdapter({filePath: '/path/to/file.ts'});
 * // Returns true if file exists, false otherwise
 */

import { existsSync } from 'fs';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsExistsSyncAdapter = ({ filePath }: { filePath: FilePath }): boolean =>
  existsSync(filePath);
