import type { join } from 'path';
import { requireActual } from '@dungeonmaster/testing/register-mock';
import { childProcessExecSyncAdapterProxy } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

const WORKTREE_DIR = '.claude/worktrees';
const BRANCH_PREFIX = 'worktree-';

export const HookWorktreeCreateResponderProxy = (): {
  setupSuccess: ({ cwd, name }: { cwd: string; name: string }) => void;
  setupGitFailure: ({ cwd, name, error }: { cwd: string; name: string; error: Error }) => void;
  setupBuildFailure: ({ cwd, name, error }: { cwd: string; name: string; error: Error }) => void;
} => {
  const execProxy = childProcessExecSyncAdapterProxy();
  const joinProxy = pathJoinAdapterProxy();

  // The responder joins cwd/dir/name into worktreePath before running any command; the exact
  // segments vary per test's WorktreeCreateHookDataStub, so delegate to the real path.join
  // instead of staging every combination — join arithmetic isn't what these tests are proving.
  const { join: realJoin } = requireActual<{ join: typeof join }>({ module: 'path' });
  joinProxy
    .getHandle()
    .calledWith([])
    .implement((...segments) => realJoin(...segments));

  return {
    setupSuccess: ({ cwd, name }: { cwd: string; name: string }): void => {
      const addCommand = `git worktree add ${realJoin(cwd, WORKTREE_DIR, name)} -b ${BRANCH_PREFIX}${name}`;
      execProxy.returns({ command: addCommand, output: 'worktree created' });
      execProxy.returns({ command: 'npm install', output: 'installed' });
      execProxy.returns({ command: 'npm run build', output: 'build complete' });
    },
    setupGitFailure: ({ cwd, name, error }: { cwd: string; name: string; error: Error }): void => {
      const addCommand = `git worktree add ${realJoin(cwd, WORKTREE_DIR, name)} -b ${BRANCH_PREFIX}${name}`;
      execProxy.throws({ command: addCommand, error });
    },
    setupBuildFailure: ({
      cwd,
      name,
      error,
    }: {
      cwd: string;
      name: string;
      error: Error;
    }): void => {
      const addCommand = `git worktree add ${realJoin(cwd, WORKTREE_DIR, name)} -b ${BRANCH_PREFIX}${name}`;
      execProxy.returns({ command: addCommand, output: 'worktree created' });
      execProxy.returns({ command: 'npm install', output: 'installed' });
      execProxy.throws({ command: 'npm run build', error });
    },
  };
};
