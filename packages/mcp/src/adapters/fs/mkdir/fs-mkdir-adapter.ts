/**
 * PURPOSE: Create directory on filesystem using fs/promises
 *
 * USAGE:
 * await fsMkdirAdapter({ filepath: FilePathStub({ value: '/path/to/dir' }) });
 * // Creates directory on filesystem with recursive option
 *
 * CONTRACTS: Input: FilePath (branded string)
 * CONTRACTS: Output: void
 */

import { mkdir } from 'fs/promises';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsMkdirAdapter = async ({ filepath }: { filepath: FilePath }): Promise<void> => {
  await mkdir(filepath, { recursive: true });
};
