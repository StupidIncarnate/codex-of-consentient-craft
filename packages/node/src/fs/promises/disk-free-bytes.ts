/**
 * PURPOSE: Reports free disk space under a path, in bytes, read via `fs.statfs` rather than a
 * shelled-out `df` so no child process sits on this path. Answers `null` only when this Node
 * runtime has no `statfs` at all; a real statfs failure (a bad path, a filesystem that refuses it)
 * still rejects — "disk unreadable" and "disk full" are different problems for a caller.
 *
 * USAGE:
 * await diskFreeBytes('/home/user/.dungeonmaster');
 * // Returns free space in bytes, or null if fs.statfs is unavailable on this runtime
 */

import { statfs } from 'fs/promises';

export const diskFreeBytes = async (path: string): Promise<number | null> => {
  // Checked through `unknown` rather than directly on `statfs` — its imported type is always a
  // function, so TypeScript would otherwise see this branch as unreachable even though the proxy
  // genuinely replaces the runtime value to prove it.
  const statfsFn: unknown = statfs;
  if (typeof statfsFn !== 'function') {
    return null;
  }

  const stats = await statfs(path);
  return stats.bavail * stats.bsize;
};
