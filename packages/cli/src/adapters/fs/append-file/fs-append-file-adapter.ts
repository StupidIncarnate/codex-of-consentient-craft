/**
 * PURPOSE: Appends string content to a file using fs/promises
 *
 * USAGE:
 * await fsAppendFileAdapter({ filePath: FilePathStub({value: '/log.jsonl'}), contents: FileContentsStub({value: '{"a":1}\n'}) });
 * // Appends content to end of file (creates file if missing)
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
