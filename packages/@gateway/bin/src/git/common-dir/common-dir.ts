/**
 * PURPOSE: Resolves the shared repository directory for a git working tree via
 * `git rev-parse --git-common-dir`. In a linked worktree this points to the main repository's `.git`
 * directory, while in a primary checkout it returns `.git`. Relative paths are resolved against
 * `cwd` so callers always receive an absolute path string, or `null` when git exits non-zero or
 * produces empty output.
 *
 * USAGE:
 * const dir = await commonDir({ cwd: '/repo' });
 * // Returns '/repo/.git', or null if not a git repository
 */

import path from '#gateway/node/path';

import { gitRun } from '../git-run/git-run';

export const commonDir = async ({ cwd }: { cwd: string }): Promise<string | null> => {
  const { exitCode, stdout } = await gitRun({ args: ['rev-parse', '--git-common-dir'], cwd });

  if (exitCode !== 0) {
    return null;
  }

  const trimmedOutput = stdout.trim();
  if (trimmedOutput.length === 0) {
    return null;
  }

  return path.resolve(cwd, trimmedOutput);
};
