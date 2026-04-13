/**
 * PURPOSE: Write file contents to filesystem using fs/promises
 *
 * USAGE:
 * await fsWriteFileAdapter({ filepath: FilePathStub({ value: '/path/to/file.json' }), contents: FileContentsStub({ value: '{"data": "value"}' }) });
 * // Writes file to filesystem
 *
 * CONTRACTS: Input: FilePath (branded string), FileContents (branded string)
 * CONTRACTS: Output: AdapterResult
 */

import { writeFile } from 'fs/promises';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsWriteFileAdapter = async ({
  filepath,
  contents,
}: {
  filepath: FilePath;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await writeFile(filepath, contents, 'utf8');

  return { success: true as const };
};
