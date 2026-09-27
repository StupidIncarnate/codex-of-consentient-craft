import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../arg-matcher/arg-matcher';

export const branchDeleteProxy = (): {
  setupResult: (params: { branchName: string; exitCode: number; output: string }) => void;
  returnsMatchingBranchName: (params: {
    branchName: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { branchName: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      branchName,
      exitCode,
      output,
    }: {
      branchName: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: ['branch', '-D', branchName], exitCode, output });
    },

    returnsMatchingBranchName: ({
      branchName,
      exitCode,
      output,
    }: {
      branchName: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({ args: ['branch', '-D', branchName], exitCode, output });
    },

    getCallsFor: ({ branchName }: { branchName: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['branch', '-D', branchName] }),
  };
};
