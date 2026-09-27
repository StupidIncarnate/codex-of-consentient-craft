/**
 * PURPOSE: Reach for this — never assemble a `git worktree add` invocation elsewhere — because the
 * invariant that a created worktree starts from the base branch's committed tip (never `HEAD`, never
 * a path) lives entirely in this argument order. `create-branch` mints the branch (`-b`) at
 * `baseBranch`'s tip — the first carve. `attach-existing` checks an existing branch out as it
 * stands, which is what makes a re-carve possible after the directory is deleted out from under a
 * quest whose branch already holds its commits.
 *
 * USAGE:
 * await worktreeAdd({
 *   cwd: '/repo',
 *   worktreePath: '/repo/worktrees/foo',
 *   branchName: 'quest/foo',
 *   baseBranch: 'main',
 *   mode: 'create-branch',
 * });
 * // Runs `git worktree add /repo/worktrees/foo -b quest/foo main`
 */

import { gitRun } from '../git-run/git-run';

export const worktreeAdd = async ({
  cwd,
  worktreePath,
  branchName,
  baseBranch,
  mode,
}: {
  cwd: string;
  worktreePath: string;
  branchName: string;
  baseBranch: string;
  mode: 'create-branch' | 'attach-existing';
}): Promise<{ exitCode: number; output: string }> => {
  const args =
    mode === 'create-branch'
      ? ['worktree', 'add', worktreePath, '-b', branchName, baseBranch]
      : ['worktree', 'add', worktreePath, branchName];

  const { exitCode, output } = await gitRun({ args, cwd });
  return { exitCode, output };
};
