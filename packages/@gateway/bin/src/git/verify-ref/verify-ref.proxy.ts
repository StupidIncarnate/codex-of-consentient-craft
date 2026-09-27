import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const verifyRefProxy = (): {
  setupResult: (params: { ref: string; exitCode: number }) => void;
  returnsMatchingRef: (params: { ref: ArgMatcher; exitCode: number }) => void;
  getCallsFor: (params: { ref: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({ ref, exitCode }: { ref: string; exitCode: number }): void => {
      runProxy.setupResult({ args: ['rev-parse', '--verify', ref], exitCode, output: '' });
    },

    returnsMatchingRef: ({ ref, exitCode }: { ref: ArgMatcher; exitCode: number }): void => {
      runProxy.returnsMatchingArgs({
        args: ['rev-parse', '--verify', ref],
        exitCode,
        output: '',
      });
    },

    getCallsFor: ({ ref }: { ref: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['rev-parse', '--verify', ref] }),
  };
};
