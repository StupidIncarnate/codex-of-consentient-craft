/**
 * PURPOSE: Creates a directory recursively using fs/promises mkdir (no-op if it already exists)
 *
 * USAGE:
 * await fsMkdirAdapter({ filePath: FilePathStub({value: '/home/x/.dungeonmaster'}) });
 * // Ensures the directory exists (recursive: true)
 */

import { mkdir } from 'fs/promises';
import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapter = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<AdapterResult> => {
  await mkdir(filePath, { recursive: true });

  return { success: true as const };
};
