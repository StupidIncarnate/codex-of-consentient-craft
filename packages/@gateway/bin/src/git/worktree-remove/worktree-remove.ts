/**
 * PURPOSE: Reach for this over deleting the worktree directory by hand — `git worktree remove
 * --force` also clears the internal `.git/worktrees/<name>` administrative entry a raw directory
 * delete leaves behind, which would otherwise block re-adding a worktree at the same path.
 *
 * USAGE:
 * await worktreeRemove({ cwd: '/repo', worktreePath: '/repo/worktrees/foo' });
 * // Runs `git worktree remove --force /repo/worktrees/foo`
 */

import { gitRun } from '../git-run/git-run';

export const worktreeRemove = async ({
  cwd,
  worktreePath,
}: {
  cwd: string;
  worktreePath: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await gitRun({
    args: ['worktree', 'remove', '--force', worktreePath],
    cwd,
  });
  return { exitCode, output };
};
