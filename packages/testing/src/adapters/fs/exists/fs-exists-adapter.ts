/**
 * PURPOSE: Checks if a file or directory exists at the specified path
 *
 * USAGE:
 * const exists = fsExistsAdapter({filePath: '/tmp/test.txt'});
 * // Returns true if file exists, false otherwise
 */

import { existsSync } from 'fs';

export const fsExistsAdapter = ({ filePath }: { filePath: string }): boolean =>
  existsSync(filePath);
