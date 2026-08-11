/**
 * PURPOSE: Writes a symlink target to disk exactly as given — including a relative form like
 * '../../packages/orchestrator' — because worktree node_modules population depends on that
 * relative target re-resolving inside the worktree instead of back at the main checkout's packages.
 *
 * USAGE:
 * await fsSymlinkAdapter({
 *   target: FilePathStub({ value: '../../packages/orchestrator' }),
 *   linkPath: FilePathStub({ value: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator' }),
 * });
 * // Creates linkPath as a symlink pointing at target
 */

import { symlink } from 'fs/promises';
import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';

export const fsSymlinkAdapter = async ({
  target,
  linkPath,
}: {
  target: FilePath;
  linkPath: FilePath;
}): Promise<AdapterResult> => {
  await symlink(target, linkPath);

  return { success: true as const };
};
