/**
 * PURPOSE: Clears git's administrative record of worktrees whose directory no longer exists. Reach
 * for this before re-attaching a worktree to a branch a previous attempt already carved: git keeps
 * the registration in `.git/worktrees/` after someone deletes the directory, and both `git worktree
 * add` and the branch itself stay refused ("already registered", "already checked out at …") until
 * that stale entry is dropped. Reach for `gitWorktreeRemoveAdapter` instead when the directory is
 * still there and the intent is to tear it down.
 *
 * USAGE:
 * const { exitCode, output } = await gitWorktreePruneAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project' }),
 * });
 * // Runs `git worktree prune`
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const gitWorktreePruneAdapter = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['worktree', 'prune'],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
