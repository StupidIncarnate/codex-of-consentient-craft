/**
 * PURPOSE: Resolves which ref stands for "origin's default branch", so a committed-work diff has a
 * remote-side base to measure against. Reach for this over `detectDefaultBranch` when the question
 * is what the REMOTE holds — a local main/master can itself be ahead of origin. The branch's own
 * `@{upstream}` is deliberately not consulted here: on a branch already pushed it resolves to that
 * branch's own remote copy, collapsing the diff to nothing the moment it is pushed.
 *
 * USAGE:
 * const ref = await detectOriginDefaultBranch({ cwd: '/repo' });
 * // Returns 'origin/main', 'origin/master', or null when the repo has no origin refs at all
 */

import { gitRun } from '../git-run/git-run';

const ORIGIN_MAIN = 'origin/main';
const ORIGIN_MASTER = 'origin/master';

export const detectOriginDefaultBranch = async ({
  cwd,
}: {
  cwd: string;
}): Promise<string | null> => {
  const mainResult = await gitRun({ args: ['rev-parse', '--verify', ORIGIN_MAIN], cwd });

  if (mainResult.exitCode === 0) {
    return ORIGIN_MAIN;
  }

  const masterResult = await gitRun({ args: ['rev-parse', '--verify', ORIGIN_MASTER], cwd });

  if (masterResult.exitCode === 0) {
    return ORIGIN_MASTER;
  }

  return null;
};
