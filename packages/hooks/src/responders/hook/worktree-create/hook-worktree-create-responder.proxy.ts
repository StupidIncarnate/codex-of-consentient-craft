import { childProcessExecSyncAdapterProxy } from '../../../adapters/child-process/exec-sync/child-process-exec-sync-adapter.proxy';

export const HookWorktreeCreateResponderProxy = (): {
  setupSuccess: () => void;
  setupGitFailure: ({ error }: { error: Error }) => void;
  setupBuildFailure: ({ error }: { error: Error }) => void;
} => {
  const execProxy = childProcessExecSyncAdapterProxy();

  return {
    setupSuccess: (): void => {
      execProxy.returns({ output: 'worktree created' });
      execProxy.returns({ output: 'build complete' });
    },
    setupGitFailure: ({ error }: { error: Error }): void => {
      execProxy.throws({ error });
    },
    setupBuildFailure: ({ error }: { error: Error }): void => {
      execProxy.returns({ output: 'worktree created' });
      execProxy.throws({ error });
    },
  };
};
