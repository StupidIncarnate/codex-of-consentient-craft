/**
 * PURPOSE: Undoes a write a caller already made once a later step in the same request fails.
 * Reach for this over fsMkdirAdapter's sibling folder when the job is removal rather than
 * creation — e.g. a create route that persisted files under a pre-minted id before the step that
 * would have made that id durable rejected.
 *
 * USAGE:
 * await fsRmAdapter({ filePath: '/path/to/dir', recursive: true, force: true });
 * // Removes the file or directory at the specified path
 */

import { rm } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsRmAdapter = async ({
  filePath,
  recursive,
  force,
}: {
  filePath: AbsoluteFilePath;
  recursive?: boolean;
  force?: boolean;
}): Promise<AdapterResult> => {
  await rm(filePath, { recursive, force });

  return { success: true as const };
};
