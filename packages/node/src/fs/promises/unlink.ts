/**
 * PURPOSE: Removes a single file. Rejects raw on ENOENT — reach for unlinkIfExists when a missing
 * file is an ordinary answer rather than a fault.
 *
 * USAGE:
 * await unlink('/repo/tmp/stale.lock');
 * // Removes the file; rejects with the raw NodeJS.ErrnoException on ENOENT/EACCES/EISDIR
 */

import { unlink as fsUnlink } from 'fs/promises';

export const unlink = async (path: string): Promise<void> => fsUnlink(path);
