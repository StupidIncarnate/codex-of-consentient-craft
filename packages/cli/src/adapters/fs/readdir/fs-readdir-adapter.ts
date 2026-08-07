/**
 * PURPOSE: Reads the contents of a directory
 *
 * USAGE:
 * const files = fsReaddirAdapter({dirPath: '/path/to/quests'});
 * // Returns array of file names in the directory
 */

import { readdirSync } from 'fs';
import { fileNameContract } from '@dungeonmaster/shared/contracts';
import type { FileName } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapter = ({ dirPath }: { dirPath: string }): FileName[] => {
  const files = readdirSync(dirPath);
  return files.map((file) => fileNameContract.parse(file));
};
