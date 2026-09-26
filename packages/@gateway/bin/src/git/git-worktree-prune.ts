/**
 * PURPOSE: Clears git's administrative record of worktrees whose directory no longer exists. Reach
 * for this before re-attaching a worktree to a branch a previous attempt already carved.
 *
 * USAGE:
 * await worktreePrune({ cwd: '/repo' });
 * // Runs `git worktree prune`
 */

import { gitRun } from './git-run';

export const worktreePrune = async ({
  cwd,
}: {
  cwd: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await gitRun({ args: ['worktree', 'prune'], cwd });
  return { exitCode, output };
};
