/**
 * PURPOSE: Adapter for fs.stat with error handling to get file statistics
 *
 * USAGE:
 * const stats = await fsStatAdapter({ filePath: '/path/to/file.ts' });
 * // Returns Stats object with file information
 */
import { stat } from 'fs/promises';
import type { Stats } from 'node:fs';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsStatAdapter = async ({ filePath }: { filePath: FilePath }): Promise<Stats> => {
  try {
    return await stat(filePath);
  } catch (error) {
    throw new Error(`Failed to stat file at ${filePath}`, { cause: error });
  }
};
