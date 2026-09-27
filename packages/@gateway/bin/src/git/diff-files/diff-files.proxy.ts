import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const diffFilesProxy = (): {
  setupResult: (params: { revisionArg: string; exitCode: number; output: string }) => void;
  returnsMatchingRevisionArg: (params: {
    revisionArg: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { revisionArg: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      revisionArg,
      exitCode,
      output,
    }: {
      revisionArg: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: ['diff', revisionArg, '--name-only'], exitCode, output });
    },

    returnsMatchingRevisionArg: ({
      revisionArg,
      exitCode,
      output,
    }: {
      revisionArg: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['diff', revisionArg, '--name-only'],
        exitCode,
        output,
      });
    },

    getCallsFor: ({ revisionArg }: { revisionArg: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['diff', revisionArg, '--name-only'] }),
  };
};
