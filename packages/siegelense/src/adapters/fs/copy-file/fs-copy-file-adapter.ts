/**
 * PURPOSE: Copies a single file on disk from sourcePath to destinationPath using Node fs/promises copyFile.
 * Used by hold step to copy the final captured frame to shotPath.
 *
 * USAGE:
 * await fsCopyFileAdapter({
 *   sourcePath: AbsoluteFilePathStub({ value: '/tmp/frame4.png' }),
 *   destinationPath: AbsoluteFilePathStub({ value: '/tmp/shot.png' }),
 * });
 * // Copies the file, then returns { success: true }
 */

import { copyFile } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsCopyFileAdapter = async ({
  sourcePath,
  destinationPath,
}: {
  sourcePath: AbsoluteFilePath;
  destinationPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await copyFile(sourcePath, destinationPath);

  return { success: true as const };
};
