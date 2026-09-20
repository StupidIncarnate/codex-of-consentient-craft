/**
 * PURPOSE: Appends string content to a file on disk using `fs/promises`. Reach for this over
 * `dmJsonlAppendAdapter` wherever the parent directory is already known to exist and the line
 * being appended is not a Claude stream-json line — the quest write route's outbox append is the
 * case: the quest folder's parent (`target.home`) already exists by the time a quest is written.
 *
 * USAGE:
 * await fsAppendFileAdapter({ filePath, contents });
 * // Appends contents to filePath, utf8-encoded
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
