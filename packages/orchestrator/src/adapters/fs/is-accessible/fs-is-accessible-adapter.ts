/**
 * PURPOSE: Checks if a filesystem path is readable, returning boolean instead of throwing
 *
 * USAGE:
 * await fsIsAccessibleAdapter({filePath: FilePathStub({value: '/home/user/config.json'})});
 * // Returns true if accessible, false otherwise (never throws)
 */

import { access } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';

const R_OK = 4;

export const fsIsAccessibleAdapter = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<boolean> => {
  try {
    await access(filePath, R_OK);
    return true;
  } catch {
    return false;
  }
};
