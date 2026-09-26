/**
 * PURPOSE: Writes a symlink target to disk exactly as given, including a relative target — a
 * caller relying on that target re-resolving relative to the link's own location needs the
 * string preserved, never normalized. EEXIST throws raw when path already exists.
 *
 * USAGE:
 * symlinkSync({ target: '../../packages/orchestrator', path: '/worktree/node_modules/@dungeonmaster/orchestrator' });
 * // Creates path as a symlink pointing at target
 */
import { symlinkSync as nodeSymlinkSync } from 'fs';

export const symlinkSync = ({
  target,
  path,
  type,
}: {
  target: string;
  path: string;
  type?: 'dir' | 'file' | 'junction';
}): void => {
  nodeSymlinkSync(target, path, type);
};
