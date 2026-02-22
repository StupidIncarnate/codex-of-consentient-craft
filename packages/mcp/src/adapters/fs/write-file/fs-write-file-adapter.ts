/**
 * PURPOSE: Write file contents to filesystem using fs/promises
 *
 * USAGE:
 * await fsWriteFileAdapter({ filepath: FilePathStub({ value: '/path/to/file.json' }), contents: FileContentsStub({ value: '{"data": "value"}' }) });
 * // Writes file to filesystem
 *
 * CONTRACTS: Input: FilePath (branded string), FileContents (branded string)
 * CONTRACTS: Output: void
 */

import { writeFile } from 'fs/promises';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsWriteFileAdapter = async ({
  filepath,
  contents,
}: {
  filepath: FilePath;
  contents: FileContents;
}): Promise<void> => {
  await writeFile(filepath, contents, 'utf8');
};
