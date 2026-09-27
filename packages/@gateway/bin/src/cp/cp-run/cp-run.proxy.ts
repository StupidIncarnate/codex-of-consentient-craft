import { run, RunNotFoundError } from '#gateway/node/child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const cpRunProxy = (): {
  setupResult: (params: {
    args: string[];
    exitCode: number;
    output: string;
    signal?: NodeJS.Signals;
    timedOut?: boolean;
  }) => void;
  setupNotFound: (params: { args: string[]; message: string }) => void;
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
      handle.calledWith([{ command: 'cp', args }]).resolves({
        exitCode,
        output,
        signal: signal ?? null,
        timedOut: timedOut ?? false,
      });
    },

    setupNotFound: ({ args, message }: { args: string[]; message: string }): void => {
      handle
        .calledWith([{ command: 'cp', args }])
        .rejects(new RunNotFoundError({ command: 'cp', code: 'ENOENT', message }));
    },
  };
};
