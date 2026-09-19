/**
 * PURPOSE: Removes a file or directory on disk using `fs/promises`. Reach for this over a
 * caller's own `fs` import wherever a `remove` route deletes a session's JSONL file or a quest
 * folder — every remove route in this package that touches the filesystem directly (session,
 * subagent) goes through here.
 *
 * USAGE:
 * await fsRmAdapter({ filePath, recursive: true, force: true });
 * // Removes the file or directory at filePath
 */
import { rm } from 'fs/promises';

import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';

export const fsRmAdapter = async ({
  filePath,
  recursive,
  force,
}: {
  filePath: FilePath;
  recursive?: boolean;
  force?: boolean;
}): Promise<AdapterResult> => {
  await rm(filePath, { recursive: recursive ?? false, force: force ?? false });

  return { success: true as const };
};
