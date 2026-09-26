/**
 * PURPOSE: Curated surface for the `git` binary. Every function is built on
 * `@dungeonmaster/node/child_process`'s `run` and throws `GitNotInstalledError` when git itself is
 * missing, rather than letting that collapse into an ordinary command failure.
 *
 * USAGE:
 * import { currentBranch, addAll, commit } from '@dungeonmaster/bin/git';
 */

export * from './git-not-installed-error';
export * from './git-current-branch';
export * from './git-add-all';
export * from './git-commit';
export * from './git-push';
export * from './git-checkout';
export * from './git-branch-delete';
export * from './git-head-sha';
export * from './git-upstream-sha';
export * from './git-verify-ref';
export * from './git-diff-files';
export * from './git-untracked-files';
export * from './git-log-name-only';
export * from './git-worktree-add';
export * from './git-worktree-prune';
export * from './git-worktree-remove';
export * from './git-detect-default-branch';
export * from './git-detect-origin-default-branch';
