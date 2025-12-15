/**
 * PURPOSE: Checks if a file is accessible with specified permissions using fs.access
 *
 * USAGE:
 * await fsAccessAdapter({filePath: FilePathStub({value: '/config.json'}), mode: 4});
 * // Returns void if accessible, throws if not
 */

import { access } from 'fs/promises';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsAccessAdapter = async ({
  filePath,
  mode,
}: {
  filePath: FilePath;
  mode: number;
}): Promise<void> => {
  await access(filePath, mode);
};
