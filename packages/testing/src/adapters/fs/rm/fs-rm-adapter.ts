/**
 * PURPOSE: Removes a file or directory at the specified path
 *
 * USAGE:
 * fsRmAdapter({filePath: '/tmp/test-dir', recursive: true, force: true});
 * // Removes the directory and all its contents
 */

import { rmSync } from 'fs';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsRmAdapter = ({
  filePath,
  recursive,
  force,
}: {
  filePath: string;
  recursive?: boolean;
  force?: boolean;
}): AdapterResult => {
  rmSync(filePath, { recursive, force });

  return { success: true as const };
};
