import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../arg-matcher/arg-matcher';

export const worktreeRemoveProxy = (): {
  setupResult: (params: { worktreePath: string; exitCode: number; output: string }) => void;
  returnsMatchingWorktreePath: (params: {
    worktreePath: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { worktreePath: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      worktreePath,
      exitCode,
      output,
    }: {
      worktreePath: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['worktree', 'remove', '--force', worktreePath],
        exitCode,
        output,
      });
    },

    returnsMatchingWorktreePath: ({
      worktreePath,
      exitCode,
      output,
    }: {
      worktreePath: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['worktree', 'remove', '--force', worktreePath],
        exitCode,
        output,
      });
    },

    getCallsFor: ({ worktreePath }: { worktreePath: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['worktree', 'remove', '--force', worktreePath] }),
  };
};
