/**
 * PURPOSE: Reach for this over a ref-specific existence check — Start's worktree lifecycle asks
 * the exact same question ("does this ref exist locally?") for two unrelated things, a base
 * branch candidate (main/master) and the quest's own branch name being free, and one boundary
 * call keeps both call sites from drifting into different existence semantics (e.g. one of them
 * silently checking a remote).
 *
 * USAGE:
 * const exists = await gitVerifyRefAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project' }),
 *   ref: 'main',
 * });
 * // exists is true when `git rev-parse --verify main` succeeds locally
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const gitVerifyRefAdapter = async ({
  cwd,
  ref,
}: {
  cwd: AbsoluteFilePath;
  ref: string;
}): Promise<boolean> => {
  const { exitCode } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', '--verify', ref],
    cwd,
  });

  return exitCode === 0;
};
