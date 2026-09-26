/**
 * PURPOSE: Removes a file or directory. `force: true` makes a missing target resolve instead of
 * rejecting ENOENT — the one place this wrapper's "missing" rule bends, because Node's own `rm`
 * defines force that way and a caller relying on it (a teardown, a cleanup pass) needs the same
 * behaviour from us.
 *
 * USAGE:
 * await rm('/repo/tmp/scratch', { recursive: true, force: true });
 * // Removes the directory tree; does nothing if it was already gone
 */

import { rm as fsRm } from 'fs/promises';

export const rm = async (
  path: string,
  options?: { recursive?: boolean; force?: boolean },
): Promise<void> => fsRm(path, options);
