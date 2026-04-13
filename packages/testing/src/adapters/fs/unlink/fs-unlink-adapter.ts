/**
 * PURPOSE: Removes a file at the specified path
 *
 * USAGE:
 * fsUnlinkAdapter({filePath: '/tmp/test.txt'});
 * // Removes the file
 */

import { unlinkSync } from 'fs';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsUnlinkAdapter = ({ filePath }: { filePath: string }): AdapterResult => {
  unlinkSync(filePath);

  return { success: true as const };
};
