/**
 * PURPOSE: Writes string content to a file on the filesystem using fs/promises
 *
 * USAGE:
 * await fsWriteFileAdapter({ filePath: '/path/to/file.txt', content: 'hello' });
 * // Writes content string to filePath
 */

import { writeFile } from 'fs/promises';
import type {
  AbsoluteFilePath,
  AdapterResult,
  FileContents,
} from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  filePath,
  content,
}: {
  filePath: AbsoluteFilePath;
  content: FileContents;
}): Promise<AdapterResult> => {
  await writeFile(filePath, content, 'utf8');

  return { success: true as const };
};
