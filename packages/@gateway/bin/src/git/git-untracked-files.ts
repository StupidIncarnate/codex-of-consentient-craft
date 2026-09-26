/**
 * PURPOSE: Lists the files git can see but has never been told about. Reach for this alongside
 * `diffFiles` — never instead of it — whenever the surface being measured is a working tree rather
 * than committed history: `git diff` in every form reports tracked paths only. Throws on a non-zero
 * git exit, preserved from the adapter this replaces.
 *
 * USAGE:
 * const files = await untrackedFiles({ cwd: '/repo' });
 * // Returns file paths in git's reported order
 */

import { gitRun } from './git-run';

export const untrackedFiles = async ({ cwd }: { cwd: string }): Promise<string[]> => {
  const { exitCode, output } = await gitRun({
    args: ['ls-files', '--others', '--exclude-standard'],
    cwd,
  });

  if (exitCode !== 0) {
    throw new Error(
      `git ls-files --others --exclude-standard failed with exit code ${String(exitCode)}: ${output}`,
    );
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};
