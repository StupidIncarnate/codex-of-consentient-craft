import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const pushProxy = (): {
  setupPlainPush: (params: { exitCode: number; output: string }) => void;
  setupUpstreamPush: (params: { branchName: string; exitCode: number; output: string }) => void;
  returnsMatchingUpstreamPush: (params: {
    branchName: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupPlainPush: ({ exitCode, output }: { exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ['push'], exitCode, output });
    },
    setupUpstreamPush: ({
      branchName,
      exitCode,
      output,
    }: {
      branchName: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: ['push', '-u', 'origin', branchName], exitCode, output });
    },

    returnsMatchingUpstreamPush: ({
      branchName,
      exitCode,
      output,
    }: {
      branchName: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['push', '-u', 'origin', branchName],
        exitCode,
        output,
      });
    },

    // Both the plain and the upstream shape are read back together — `args[0] === 'push'` covers
    // either length.
    getCallsFor: (): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: (args: readonly unknown[]): boolean => args[0] === 'push',
      }),
  };
};
