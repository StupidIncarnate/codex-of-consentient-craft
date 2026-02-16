/**
 * PURPOSE: Writes string content to a file on the filesystem
 *
 * USAGE:
 * await fsWriteFileAdapter({ filePath: FilePathStub({ value: '/path/to/file.ts' }), contents: FileContentsStub({ value: 'content' }) });
 * // Writes content to the specified file path
 */

import { writeFile } from 'fs/promises';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  filePath,
  contents,
}: {
  filePath: FilePath;
  contents: FileContents;
}): Promise<void> => {
  await writeFile(filePath, contents, 'utf-8');
};
