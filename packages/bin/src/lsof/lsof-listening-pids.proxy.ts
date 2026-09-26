import { run } from '@dungeonmaster/node/child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const lsofListeningPidsProxy = (): {
  setupPids: (params: { port: number; pids: number[] }) => void;
  setupNoneListening: (params: { port: number }) => void;
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
  };
};
