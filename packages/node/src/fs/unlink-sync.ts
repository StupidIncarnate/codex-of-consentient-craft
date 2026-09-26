/**
 * PURPOSE: Removes a single file, synchronously. Throws raw on ENOENT — a caller for whom a
 * missing file is an ordinary answer should check first with `existsSync`.
 *
 * USAGE:
 * unlinkSync('/repo/tmp/stale.lock');
 * // Removes the file; throws the raw NodeJS.ErrnoException on ENOENT/EACCES/EISDIR
 */
import { unlinkSync as nodeUnlinkSync } from 'fs';

export const unlinkSync = (path: string): void => {
  nodeUnlinkSync(path);
};
