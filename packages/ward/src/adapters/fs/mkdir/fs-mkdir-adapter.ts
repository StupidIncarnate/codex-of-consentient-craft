/**
 * PURPOSE: Creates a directory on the filesystem with recursive option
 *
 * USAGE:
 * await fsMkdirAdapter({ dirPath: FilePathStub({ value: '/path/to/dir' }) });
 * // Creates directory and all parent directories as needed
 */

import { mkdir } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapter = async ({ dirPath }: { dirPath: FilePath }): Promise<void> => {
  await mkdir(dirPath, { recursive: true });
};
