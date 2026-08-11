/**
 * PURPOSE: Reach for this over deleting the worktree directory by hand — `git worktree remove
 * --force` also clears the internal `.git/worktrees/<name>` administrative entry that a raw
 * directory delete leaves behind, which would otherwise block re-adding a worktree at the same
 * path and leave `git worktree list` reporting a stale entry.
 *
 * USAGE:
 * const { exitCode, output } = await gitWorktreeRemoveAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
 * });
 * // Runs `git worktree remove --force <worktreePath>`
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const gitWorktreeRemoveAdapter = async ({
  cwd,
  worktreePath,
}: {
  cwd: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['worktree', 'remove', '--force', worktreePath],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
