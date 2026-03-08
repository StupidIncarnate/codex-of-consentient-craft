/**
 * PURPOSE: Writes string content to a file on the filesystem using fs/promises
 *
 * USAGE:
 * await fsWriteFileAdapter({ filePath: '/path/to/file.txt', content: 'hello' });
 * // Writes content string to filePath
 */

import { writeFile } from 'fs/promises';
import type { AbsoluteFilePath, FileContents } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  filePath,
  content,
}: {
  filePath: AbsoluteFilePath;
  content: FileContents;
}): Promise<void> => {
  await writeFile(filePath, content, 'utf8');
};
