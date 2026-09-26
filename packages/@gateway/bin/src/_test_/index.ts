/**
 * PURPOSE: Caller-facing proxy surface for @dungeonmaster/bin's wrapped modules. A composing
 * caller mocks the FUNCTION it calls (e.g. `currentBranch`) through the proxy re-exported here,
 * never the `child_process` boundary underneath it — that boundary is this package's own to mock,
 * in each function's colocated `.proxy.ts`.
 *
 * USAGE:
 * import { currentBranchProxy } from '@dungeonmaster/bin/_test_';
 */

export * from '../git/git-current-branch.proxy';
export * from '../git/git-add-all.proxy';
export * from '../git/git-commit.proxy';
export * from '../git/git-push.proxy';
export * from '../git/git-checkout.proxy';
export * from '../git/git-branch-delete.proxy';
export * from '../git/git-head-sha.proxy';
export * from '../git/git-upstream-sha.proxy';
export * from '../git/git-verify-ref.proxy';
export * from '../git/git-diff-files.proxy';
export * from '../git/git-untracked-files.proxy';
export * from '../git/git-log-name-only.proxy';
export * from '../git/git-worktree-add.proxy';
export * from '../git/git-worktree-prune.proxy';
export * from '../git/git-worktree-remove.proxy';
export * from '../git/git-detect-default-branch.proxy';
export * from '../git/git-detect-origin-default-branch.proxy';

export * from '../npm/npm-install.proxy';
export * from '../npm/npm-run-build.proxy';
export * from '../npm/npm-run-script.proxy';

export * from '../lsof/lsof-listening-pids.proxy';

export * from '../kill/kill-pid.proxy';
export * from '../kill/kill-group.proxy';

export * from '../cp/cp-copy-recursive.proxy';

export * from '../claude/claude-not-installed-error.proxy';
export * from '../claude/claude-resolve-cli-path.proxy';
export * from '../claude/claude-spawn-stream-json.proxy';
