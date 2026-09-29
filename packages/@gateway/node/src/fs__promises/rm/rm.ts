/**
 * PURPOSE: Removes a file or directory. `force: true` makes a missing target resolve instead of
 * rejecting ENOENT — the one place this wrapper's "missing" rule bends, because Node's own `rm`
 * defines force that way and a caller relying on it (a teardown, a cleanup pass) needs the same
 * behaviour from us. `maxRetries`/`retryDelay` pass through to Node, for a tree another process may
 * still be writing into while it is removed (Node retries ENOTEMPTY, EBUSY and EPERM).
 *
 * USAGE:
 * await rm('/repo/tmp/scratch', { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
 * // Removes the directory tree; does nothing if it was already gone
 */

import { rm as fsRm } from 'fs/promises';

export const rm = async (
  path: string,
  options?: { recursive?: boolean; force?: boolean; maxRetries?: number; retryDelay?: number },
): Promise<void> => fsRm(path, options);
