/**
 * PURPOSE: Creates a git worktree and runs npm build in it for Claude Code WorktreeCreate hook
 *
 * USAGE:
 * const result = HookWorktreeCreateResponder({ input: WorktreeCreateHookDataStub() });
 * // Returns { worktreePath: '/path/to/worktree' } after creating worktree and building
 */

import { childProcessExecSyncAdapter } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter';
import type { WorktreeCreateHookData } from '../../../contracts/worktree-create-hook-data/worktree-create-hook-data-contract';

export const HookWorktreeCreateResponder = ({
  input,
}: {
  input: WorktreeCreateHookData;
}): { worktreePath: WorktreeCreateHookData['worktree_path'] } => {
  childProcessExecSyncAdapter({
    command: `git worktree add ${input.worktree_path} -b ${input.branch}`,
    options: { cwd: input.cwd, encoding: 'utf8' },
  });

  childProcessExecSyncAdapter({
    command: 'npm run build',
    options: { cwd: input.worktree_path, encoding: 'utf8' },
  });

  return { worktreePath: input.worktree_path };
};
