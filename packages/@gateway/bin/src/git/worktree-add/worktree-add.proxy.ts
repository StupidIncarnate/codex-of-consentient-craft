import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const worktreeAddProxy = (): {
  setupCreateBranch: (params: {
    worktreePath: string;
    branchName: string;
    baseBranch: string;
    exitCode: number;
    output: string;
  }) => void;
  setupAttachExisting: (params: {
    worktreePath: string;
    branchName: string;
    exitCode: number;
    output: string;
  }) => void;
  returnsMatchingCreateBranch: (params: {
    worktreePath: ArgMatcher;
    branchName: ArgMatcher;
    baseBranch: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  returnsMatchingAttachExisting: (params: {
    worktreePath: ArgMatcher;
    branchName: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupCreateBranch: ({
      worktreePath,
      branchName,
      baseBranch,
      exitCode,
      output,
    }: {
      worktreePath: string;
      branchName: string;
      baseBranch: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        exitCode,
        output,
      });
    },
    setupAttachExisting: ({
      worktreePath,
      branchName,
      exitCode,
      output,
    }: {
      worktreePath: string;
      branchName: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['worktree', 'add', worktreePath, branchName],
        exitCode,
        output,
      });
    },

    returnsMatchingCreateBranch: ({
      worktreePath,
      branchName,
      baseBranch,
      exitCode,
      output,
    }: {
      worktreePath: ArgMatcher;
      branchName: ArgMatcher;
      baseBranch: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        exitCode,
        output,
      });
    },

    returnsMatchingAttachExisting: ({
      worktreePath,
      branchName,
      exitCode,
      output,
    }: {
      worktreePath: ArgMatcher;
      branchName: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['worktree', 'add', worktreePath, branchName],
        exitCode,
        output,
      });
    },

    // Both shapes (create-branch, length 6; attach-existing, length 4) are read back together —
    // `args[0]==='worktree' && args[1]==='add'` covers either.
    getCallsFor: (): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: (args: readonly unknown[]): boolean => args[0] === 'worktree' && args[1] === 'add',
      }),
  };
};
