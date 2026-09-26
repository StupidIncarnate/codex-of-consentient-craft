/**
 * PURPOSE: True when a rejection is git reporting "not a git repository" — the expected result of
 * asking for a branch from a `cwd` outside any git worktree (an instance reserved from a bare temp
 * directory, an installed-but-unversioned consumer repo). `instanceReserveBroker` reaches for this to
 * treat that one case like detached HEAD, which `currentBranch` already collapses to `null` itself.
 * `GitNotInstalledError` (missing binary) and every other git failure — permission denied, a
 * corrupted `.git` — are NOT this, and read `false` so the caller still lets them propagate.
 *
 * USAGE:
 * isGitNotARepositoryErrorGuard({ error: new Error('... fatal: not a git repository') });
 * // Returns true
 */

export const isGitNotARepositoryErrorGuard = ({ error }: { error?: unknown }): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('fatal: not a git repository');
};
