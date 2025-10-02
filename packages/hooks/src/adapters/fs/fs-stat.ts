import { stat } from 'fs/promises';
import type { Stats } from 'node:fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export type { Stats };

export const fsStat = async ({ filePath }: { filePath: FilePath }): Promise<Stats> => {
  try {
    return await stat(filePath);
  } catch (error) {
    throw new Error(`Failed to stat file at ${filePath}`, { cause: error });
  }
};
