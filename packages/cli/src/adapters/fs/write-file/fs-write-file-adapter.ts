/**
 * PURPOSE: Write file contents to filesystem using fs/promises
 *
 * USAGE:
 * await fsWriteFileAdapter({ filePath: FilePathStub({value: '/path/to/file.json'}), contents: fileContentsContract.parse('{"data": "value"}') });
 * // Writes file to filesystem
 */

import { writeFile } from 'fs/promises';
import type { AdapterResult, FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  filePath,
  contents,
}: {
  filePath: FilePath;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await writeFile(filePath, contents, 'utf8');

  return { success: true as const };
};
