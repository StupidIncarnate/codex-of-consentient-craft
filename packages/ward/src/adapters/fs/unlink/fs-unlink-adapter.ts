/**
 * PURPOSE: Removes a file from the filesystem
 *
 * USAGE:
 * await fsUnlinkAdapter({ filePath: FilePathStub({ value: '/path/to/file.ts' }) });
 * // Deletes the file at the specified path
 */

import { unlink } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsUnlinkAdapter = async ({ filePath }: { filePath: FilePath }): Promise<void> => {
  await unlink(filePath);
};
