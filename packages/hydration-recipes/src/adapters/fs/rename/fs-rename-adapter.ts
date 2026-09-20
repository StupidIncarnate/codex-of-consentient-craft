/**
 * PURPOSE: Renames a file on disk using `fs/promises` (POSIX-atomic on the same filesystem).
 * Reach for this over a plain overwrite wherever a write must not be observable half-finished —
 * the quest write route's temp-then-rename sequence is what `questPersistBroker` does in
 * production, and this package carries its own copy for the same reason `fs-write-file-adapter`
 * does: `@dungeonmaster/shared/adapters` exports no rename counterpart.
 *
 * USAGE:
 * await fsRenameAdapter({ from: tmpPath, to: questFilePath });
 * // Atomically replaces `to` with `from`'s contents
 */
import { rename } from 'fs/promises';

import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapter = async ({
  from,
  to,
}: {
  from: FilePath;
  to: FilePath;
}): Promise<AdapterResult> => {
  await rename(from, to);

  return { success: true as const };
};
