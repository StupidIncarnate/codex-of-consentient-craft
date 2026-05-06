/**
 * PURPOSE: Wraps fs.stat to retrieve file metadata, returning null when the file does not exist
 *
 * USAGE:
 * const stats = await fsStatAdapter({ filePath: FilePathStub({value: '/path/to/file.json'}) });
 * // Returns Stats object with mtimeMs, or null if file does not exist
 */

import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsStatAdapter = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<Stats | null> => {
  try {
    return await stat(filePath);
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: unknown }).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
};
