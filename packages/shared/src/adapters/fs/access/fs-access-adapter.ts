/**
 * PURPOSE: Checks if a file is accessible with specified permissions using fs.access
 *
 * USAGE:
 * await fsAccessAdapter({filePath: FilePathStub({value: '/config.json'}), mode: 4});
 * // Returns AdapterResult if accessible, throws if not
 */

import { access } from 'fs/promises';
import type { AdapterResult } from '../../../contracts/adapter-result/adapter-result-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsAccessAdapter = async ({
  filePath,
  mode,
}: {
  filePath: FilePath;
  mode: number;
}): Promise<AdapterResult> => {
  await access(filePath, mode);

  return { success: true as const };
};
