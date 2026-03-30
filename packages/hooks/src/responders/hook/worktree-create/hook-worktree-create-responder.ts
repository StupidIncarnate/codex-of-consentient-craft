/**
 * PURPOSE: Creates a git worktree and runs npm build in it for Claude Code WorktreeCreate hook
 *
 * USAGE:
 * const result = HookWorktreeCreateResponder({ input: WorktreeCreateHookDataStub() });
 * // Returns { worktreePath: '/path/to/worktree' } after creating worktree and building
 */

import { childProcessExecSyncAdapter } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import type { WorktreeCreateHookData } from '../../../contracts/worktree-create-hook-data/worktree-create-hook-data-contract';

const WORKTREE_DIR = '.claude/worktrees';
const BRANCH_PREFIX = 'worktree-';

export const HookWorktreeCreateResponder = ({
  input,
}: {
  input: WorktreeCreateHookData;
}): { worktreePath: ReturnType<typeof pathJoinAdapter> } => {
  const worktreePath = pathJoinAdapter({
    paths: [input.cwd, WORKTREE_DIR, input.name],
  });
  const branch = `${BRANCH_PREFIX}${input.name}`;

  childProcessExecSyncAdapter({
    command: `git worktree add ${worktreePath} -b ${branch}`,
    options: { cwd: input.cwd, encoding: 'utf8' },
  });

  childProcessExecSyncAdapter({
    command: 'npm install',
    options: { cwd: worktreePath, encoding: 'utf8' },
  });

  childProcessExecSyncAdapter({
    command: 'npm run build',
    options: { cwd: worktreePath, encoding: 'utf8' },
  });

  return { worktreePath };
};
