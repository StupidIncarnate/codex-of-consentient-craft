import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

const diffArgs = ({
  revisionArg,
  excludeDeleted,
}: {
  revisionArg: string;
  excludeDeleted?: boolean | undefined;
}): string[] => [
  'diff',
  revisionArg,
  '--name-only',
  ...(excludeDeleted ? ['--diff-filter=d'] : []),
];

export const diffFilesProxy = (): {
  setupResult: (params: {
    revisionArg: string;
    excludeDeleted?: boolean | undefined;
    exitCode: number;
    output: string;
    stderr?: string;
  }) => void;
  setupNotFound: (params: { revisionArg: string; excludeDeleted?: boolean }) => void;
  returnsMatchingRevisionArg: (params: {
    revisionArg: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: {
    revisionArg: ArgMatcher;
    excludeDeleted?: boolean | undefined;
  }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      revisionArg,
      excludeDeleted,
      exitCode,
      output,
      stderr,
    }: {
      revisionArg: string;
      excludeDeleted?: boolean | undefined;
      exitCode: number;
      output: string;
      stderr?: string;
    }): void => {
      runProxy.setupResult({
        args: diffArgs({ revisionArg, excludeDeleted }),
        exitCode,
        output,
        ...(stderr === undefined ? {} : { stderr }),
      });
    },

    setupNotFound: ({
      revisionArg,
      excludeDeleted,
    }: {
      revisionArg: string;
      excludeDeleted?: boolean | undefined;
    }): void => {
      runProxy.setupNotFound({ args: diffArgs({ revisionArg, excludeDeleted }) });
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

    getCallsFor: ({
      revisionArg,
      excludeDeleted,
    }: {
      revisionArg: ArgMatcher;
      excludeDeleted?: boolean | undefined;
    }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: ['diff', revisionArg, '--name-only', ...(excludeDeleted ? ['--diff-filter=d'] : [])],
      }),
  };
};
