import { run, RunNotFoundError } from '@dungeonmaster/node/child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const listeningPidsProxy = (): {
  setupPids: (params: { port: number; pids: number[] }) => void;
  setupNoneListening: (params: { port: number }) => void;
  setupNotFound: (params: { port: number; message: string }) => void;
} => {
  const handle = registerMock({ fn: run });

  return {
    setupPids: ({ port, pids }: { port: number; pids: number[] }): void => {
      handle.calledWith([{ command: 'lsof', args: ['-ti', `:${String(port)}`] }]).resolves({
        exitCode: 0,
        output: `${pids.join('\n')}\n`,
        signal: null,
        timedOut: false,
      });
    },
    setupNoneListening: ({ port }: { port: number }): void => {
      handle.calledWith([{ command: 'lsof', args: ['-ti', `:${String(port)}`] }]).resolves({
        exitCode: 1,
        output: '',
        signal: null,
        timedOut: false,
      });
    },
    setupNotFound: ({ port, message }: { port: number; message: string }): void => {
      handle
        .calledWith([{ command: 'lsof', args: ['-ti', `:${String(port)}`] }])
        .rejects(new RunNotFoundError({ command: 'lsof', code: 'ENOENT', message }));
    },
  };
};
