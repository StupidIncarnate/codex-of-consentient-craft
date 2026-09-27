/**
 * PURPOSE: Detects whether the repo uses `main` or `master` as its LOCAL default branch. Kept
 * distinct from `detectOriginDefaultBranch` deliberately — collapsing the two would answer "what
 * does this checkout hold" where a diff needs "what has origin seen", and a local branch ahead of
 * origin would silently shrink that diff. See that file's own header.
 *
 * USAGE:
 * const branch = await detectDefaultBranch({ cwd: '/repo' });
 * // Returns 'main', 'master', or null if neither exists
 */

import { gitRun } from '../git-run/git-run';

export const detectDefaultBranch = async ({ cwd }: { cwd: string }): Promise<string | null> => {
  const mainResult = await gitRun({ args: ['rev-parse', '--verify', 'main'], cwd });

  if (mainResult.exitCode === 0) {
    return 'main';
  }

  const masterResult = await gitRun({ args: ['rev-parse', '--verify', 'master'], cwd });

  if (masterResult.exitCode === 0) {
    return 'master';
  }

  return null;
};
