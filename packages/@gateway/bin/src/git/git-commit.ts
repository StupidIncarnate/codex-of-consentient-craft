/**
 * PURPOSE: `git commit -m <message>`, optionally `--allow-empty` for a pass that changed nothing but
 * still needs a commit for the next step to stand on.
 *
 * USAGE:
 * await commit({ cwd: '/repo', message: 'work items: 3' });
 * await commit({ cwd: '/repo', message: 'ward/commit: repair', allowEmpty: true });
 */

import { gitRun } from './git-run';

export const commit = async ({
  cwd,
  message,
  allowEmpty,
}: {
  cwd: string;
  message: string;
  allowEmpty?: boolean;
}): Promise<{ exitCode: number; output: string }> => {
  const args = ['commit', '-m', message, ...(allowEmpty === true ? ['--allow-empty'] : [])];
  const { exitCode, output } = await gitRun({ args, cwd });
  return { exitCode, output };
};
