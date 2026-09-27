import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../arg-matcher/arg-matcher';

export const commitProxy = (): {
  setupResult: (params: {
    message: string;
    allowEmpty?: boolean;
    exitCode: number;
    output: string;
  }) => void;
  returnsMatchingMessage: (params: {
    message: ArgMatcher;
    allowEmpty?: boolean;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { message: ArgMatcher; allowEmpty?: boolean }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResult: ({
      message,
      allowEmpty,
      exitCode,
      output,
    }: {
      message: string;
      allowEmpty?: boolean;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: ['commit', '-m', message, ...(allowEmpty === true ? ['--allow-empty'] : [])],
        exitCode,
        output,
      });
    },

    returnsMatchingMessage: ({
      message,
      allowEmpty,
      exitCode,
      output,
    }: {
      message: ArgMatcher;
      allowEmpty?: boolean;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: ['commit', '-m', message, ...(allowEmpty === true ? ['--allow-empty'] : [])],
        exitCode,
        output,
      });
    },

    getCallsFor: ({
      message,
      allowEmpty,
    }: {
      message: ArgMatcher;
      allowEmpty?: boolean;
    }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: ['commit', '-m', message, ...(allowEmpty === true ? ['--allow-empty'] : [])],
      }),
  };
};
