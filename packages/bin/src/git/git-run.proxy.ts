import { run, RunNotFoundError } from '@dungeonmaster/node/child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const gitRunProxy = (): {
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
      handle.calledWith([{ command: 'git', args }]).resolves({
        exitCode,
        output,
        signal: signal ?? null,
        timedOut: timedOut ?? false,
      });
    },

    setupNotFound: ({ args, message }: { args: string[]; message: string }): void => {
      handle
        .calledWith([{ command: 'git', args }])
        .rejects(new RunNotFoundError({ command: 'git', code: 'ENOENT', message }));
    },
  };
};
