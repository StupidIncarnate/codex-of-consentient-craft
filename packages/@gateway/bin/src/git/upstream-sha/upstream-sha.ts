/**
 * PURPOSE: Reads the sha the current branch's upstream points at via `git rev-parse @{upstream}`, so
 * a caller can measure what has been committed but not yet pushed. `null` is a real answer (no
 * upstream configured), not a failure — preserved from the adapter this replaces.
 *
 * USAGE:
 * const sha = await upstreamSha({ cwd: '/repo' });
 * // Returns the sha string, or null when the branch tracks nothing
 */

import { gitRun } from '../git-run/git-run';

export const upstreamSha = async ({ cwd }: { cwd: string }): Promise<string | null> => {
  const { exitCode, output } = await gitRun({ args: ['rev-parse', '@{upstream}'], cwd });

  if (exitCode !== 0) {
    return null;
  }

  const sha = output.trim();
  return sha.length === 0 ? null : sha;
};
