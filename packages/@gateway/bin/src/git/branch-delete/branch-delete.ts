/**
 * PURPOSE: Reach for this over `git branch -d` (lowercase) — a quest branch being torn down may hold
 * commits never merged back to the base branch, and `-D` removes it unconditionally instead of git
 * refusing on an unmerged-changes safety check.
 *
 * USAGE:
 * await branchDelete({ cwd: '/repo', branchName: 'quest/foo' });
 * // Runs `git branch -D quest/foo`
 */

import { gitRun } from '../git-run/git-run';

export const branchDelete = async ({
  cwd,
  branchName,
}: {
  cwd: string;
  branchName: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await gitRun({ args: ['branch', '-D', branchName], cwd });
  return { exitCode, output };
};
