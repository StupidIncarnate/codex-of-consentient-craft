/**
 * PURPOSE: Writes a symlink target to disk exactly as given, including a relative target such as
 * '../../packages/orchestrator' — a caller relying on that target re-resolving relative to the
 * link's own location (worktree node_modules population) needs the string preserved, never
 * normalized. EEXIST rejects raw when path already exists.
 *
 * USAGE:
 * await symlink({
 *   target: '../../packages/orchestrator',
 *   path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
 * });
 * // Creates path as a symlink pointing at target
 */

import { symlink as fsSymlink } from 'fs/promises';

export const symlink = async ({
  target,
  path,
  type,
}: {
  target: string;
  path: string;
  type?: 'dir' | 'file' | 'junction';
}): Promise<void> => fsSymlink(target, path, type);
