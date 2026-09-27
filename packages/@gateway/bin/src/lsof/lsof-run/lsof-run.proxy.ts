import { run, RunNotFoundError } from '#gateway/node/child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { ArgsMatcher } from '../../gateway-test-support/arg-matcher';

export const lsofRunProxy = (): {
  setupResult: (params: {
    args: string[];
    exitCode: number;
    output: string;
    signal?: NodeJS.Signals;
    timedOut?: boolean;
  }) => void;
  setupNotFound: (params: { args: string[]; message: string }) => void;
  returnsMatchingArgs: (params: {
    args: ArgsMatcher;
    exitCode: number;
    output: string;
    signal?: NodeJS.Signals;
    timedOut?: boolean;
  }) => void;
  throwsMatchingArgs: (params: { args: ArgsMatcher; message: string }) => void;
  getCallsFor: (params: { args: ArgsMatcher }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: run });

  return {
    setupResult: ({
      args,
      exitCode,
      output,
      signal,
      timedOut,
    }: {
      args: string[];
      exitCode: number;
      output: string;
      signal?: NodeJS.Signals;
      timedOut?: boolean;
    }): void => {
      handle.calledWith([{ command: 'lsof', args }]).resolves({
        exitCode,
        output,
        signal: signal ?? null,
        timedOut: timedOut ?? false,
      });
    },

    setupNotFound: ({ args, message }: { args: string[]; message: string }): void => {
      handle
        .calledWith([{ command: 'lsof', args }])
        .rejects(new RunNotFoundError({ command: 'lsof', code: 'ENOENT', message }));
    },

    returnsMatchingArgs: ({
      args,
      exitCode,
      output,
      signal,
      timedOut,
    }: {
      args: ArgsMatcher;
      exitCode: number;
      output: string;
      signal?: NodeJS.Signals;
      timedOut?: boolean;
    }): void => {
      handle.calledWith([{ command: 'lsof', args }]).resolves({
        exitCode,
        output,
        signal: signal ?? null,
        timedOut: timedOut ?? false,
      });
    },

    throwsMatchingArgs: ({ args, message }: { args: ArgsMatcher; message: string }): void => {
      handle
        .calledWith([{ command: 'lsof', args }])
        .rejects(new RunNotFoundError({ command: 'lsof', code: 'ENOENT', message }));
    },

    getCallsFor: ({ args }: { args: ArgsMatcher }): readonly unknown[][] =>
      handle.callsMatching([{ command: 'lsof', args }]),
  };
};
