/**
 * PURPOSE: `git add -A`, staging every change in the worktree — tracked edits and untracked
 * additions alike — ahead of a `commit` call.
 *
 * USAGE:
 * const { exitCode, output } = await addAll({ cwd: '/repo' });
 */

import { gitRun } from './git-run';

export const addAll = async ({
  cwd,
}: {
  cwd: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await gitRun({ args: ['add', '-A'], cwd });
  return { exitCode, output };
};
