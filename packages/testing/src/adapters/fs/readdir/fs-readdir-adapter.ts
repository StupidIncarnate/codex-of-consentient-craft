/**
 * PURPOSE: Reads the contents of a directory
 *
 * USAGE:
 * const files = fsReaddirAdapter({dirPath: '/tmp/test-dir'});
 * // Returns array of file names in the directory
 */

import { readdirSync } from 'fs';
import { fileNameContract } from '../../../contracts/file-name/file-name-contract';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const fsReaddirAdapter = ({ dirPath }: { dirPath: string }): FileName[] => {
  const files = readdirSync(dirPath);
  return files.map((file) => fileNameContract.parse(file));
};
