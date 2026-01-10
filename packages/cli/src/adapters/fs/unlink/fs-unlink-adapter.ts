/**
 * PURPOSE: Deletes a file from the filesystem using fs.unlink
 *
 * USAGE:
 * await fsUnlinkAdapter({ filePath: FilePathStub({value: '/quests/.cli-signal'}) });
 * // Deletes the file
 */

import { unlink } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsUnlinkAdapter = async ({ filePath }: { filePath: FilePath }): Promise<void> => {
  await unlink(filePath);
};
