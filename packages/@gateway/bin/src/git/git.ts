/**
 * PURPOSE: Curated surface for the `git` binary. Every function is built on
 * `#gateway/node/child_process`'s `run` and throws `GitNotInstalledError` when git itself is
 * missing, rather than letting that collapse into an ordinary command failure.
 *
 * USAGE:
 * import { currentBranch, addAll, commit } from '#gateway/bin/git';
 */

export { addAll } from './add-all/add-all';
export { branchDelete } from './branch-delete/branch-delete';
export { checkout } from './checkout/checkout';
export { commit } from './commit/commit';
export { currentBranch } from './current-branch/current-branch';
export { detectDefaultBranch } from './detect-default-branch/detect-default-branch';
export { detectOriginDefaultBranch } from './detect-origin-default-branch/detect-origin-default-branch';
export { diffFiles } from './diff-files/diff-files';
export { GitNotInstalledError } from './git-run/git-not-installed.error';
export { gitRun } from './git-run/git-run';
export { headSha } from './head-sha/head-sha';
export { logNameOnly } from './log-name-only/log-name-only';
export { push } from './push/push';
export { untrackedFiles } from './untracked-files/untracked-files';
export { upstreamSha } from './upstream-sha/upstream-sha';
export { verifyRef } from './verify-ref/verify-ref';
export { worktreeAdd } from './worktree-add/worktree-add';
export { worktreePrune } from './worktree-prune/worktree-prune';
export { worktreeRemove } from './worktree-remove/worktree-remove';
