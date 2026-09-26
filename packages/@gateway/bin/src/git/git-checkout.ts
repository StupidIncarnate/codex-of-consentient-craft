/**
 * PURPOSE: Reach for this over `git checkout -f`, `-B`, or a pathspec checkout — passing only
 * `[branchName]` is what keeps a dirty working tree intact instead of being force-overwritten or
 * partially reverted.
 *
 * USAGE:
 * await checkout({ cwd: '/repo/worktrees/foo', branchName: 'quest/foo' });
 * // Runs `git checkout quest/foo`
 */

import { gitRun } from './git-run';

export const checkout = async ({
  cwd,
  branchName,
}: {
  cwd: string;
  branchName: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await gitRun({ args: ['checkout', branchName], cwd });
  return { exitCode, output };
};
