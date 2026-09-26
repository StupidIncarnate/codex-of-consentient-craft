/**
 * PURPOSE: Reads the current git HEAD commit sha via `git rev-parse HEAD`. Returns `null` for a
 * non-zero exit or empty output — preserved from the adapter this replaces, which is not one of the
 * two reconciliations this module makes (see `git-current-branch.ts`'s header for the one that is).
 *
 * USAGE:
 * const sha = await headSha({ cwd: '/repo' });
 * // Returns the sha string, or null if HEAD cannot be read
 */

import { gitRun } from './git-run';

export const headSha = async ({ cwd }: { cwd: string }): Promise<string | null> => {
  const { exitCode, output } = await gitRun({ args: ['rev-parse', 'HEAD'], cwd });

  if (exitCode !== 0) {
    return null;
  }

  const sha = output.trim();
  return sha.length === 0 ? null : sha;
};
