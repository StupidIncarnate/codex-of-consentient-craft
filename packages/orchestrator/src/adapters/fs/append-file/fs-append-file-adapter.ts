/**
 * PURPOSE: Append string content to a file on the filesystem using fs/promises
 *
 * USAGE:
 * await fsAppendFileAdapter({ filePath: FilePathStub({value: '/path/to/file.jsonl'}), contents: FileContentsStub({value: '{"line": "data"}\n'}) });
 * // Appends content to the specified file path
 */

import { appendFile } from 'fs/promises';
import type { AdapterResult, FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const fsAppendFileAdapter = async ({
  filePath,
  contents,
}: {
  filePath: FilePath;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await appendFile(filePath, contents, 'utf8');

  return { success: true as const };
};
