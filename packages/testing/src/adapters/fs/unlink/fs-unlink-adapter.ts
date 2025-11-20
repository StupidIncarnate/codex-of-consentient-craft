/**
 * PURPOSE: Removes a file at the specified path
 *
 * USAGE:
 * fsUnlinkAdapter({filePath: '/tmp/test.txt'});
 * // Removes the file
 */

import { unlinkSync } from 'fs';

export const fsUnlinkAdapter = ({ filePath }: { filePath: string }): void => {
  unlinkSync(filePath);
};
