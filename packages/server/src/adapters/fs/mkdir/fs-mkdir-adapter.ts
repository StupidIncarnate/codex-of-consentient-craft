/**
 * PURPOSE: Creates a quest's images directory ahead of a write. Reach for this over
 * fsWriteFileAdapter when the target is a directory rather than a file, and over
 * fsStatAdapter when the caller wants creation-if-missing rather than an existence check —
 * every send re-creates the same quest images directory, so this must tolerate the directory
 * already existing and leave whatever is already in it untouched.
 *
 * USAGE:
 * await fsMkdirAdapter({ dirPath: '/path/to/quest/images' });
 * // Creates dirPath (and any missing parents), no-ops if it already exists
 */

import { mkdir } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapter = async ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await mkdir(dirPath, { recursive: true });

  return { success: true as const };
};
