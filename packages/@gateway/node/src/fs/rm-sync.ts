/**
 * PURPOSE: Removes a file or directory. `force: true` makes a missing target resolve instead of
 * throwing ENOENT — the one place this wrapper's "missing" rule bends, because Node's own `rmSync`
 * defines force that way and a caller relying on it (a teardown, a cleanup pass) needs the same
 * behaviour from us.
 *
 * USAGE:
 * rmSync('/repo/tmp/scratch', { recursive: true, force: true });
 * // Removes the directory tree; does nothing if it was already gone
 */
import { rmSync as nodeRmSync } from 'fs';

export const rmSync = (path: string, options?: { recursive?: boolean; force?: boolean }): void => {
  nodeRmSync(path, options);
};
