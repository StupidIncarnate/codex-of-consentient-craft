import { run, RunNotFoundError } from '#gateway/node/child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// `port` reaches argv only after being embedded in `:${port}`, so a tolerant address is a predicate
// over that assembled string rather than the caller's own number.
type PortMatcher = number | ((value: unknown) => boolean);

const portArg = (port: PortMatcher): string | ((value: unknown) => boolean) =>
  typeof port === 'function' ? port : `:${String(port)}`;

export const listeningPidsProxy = (): {
  setupPids: (params: { port: number; pids: number[] }) => void;
  setupNoneListening: (params: { port: number }) => void;
  setupNotFound: (params: { port: number; message: string }) => void;
  returnsMatchingPort: (params: { port: PortMatcher; pids: number[] }) => void;
  noneListeningMatchingPort: (params: { port: PortMatcher }) => void;
  throwsMatchingPort: (params: { port: PortMatcher; message: string }) => void;
  getCallsFor: (params: { port: PortMatcher }) => readonly unknown[][];
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

    returnsMatchingPort: ({ port, pids }: { port: PortMatcher; pids: number[] }): void => {
      handle.calledWith([{ command: 'lsof', args: ['-ti', portArg(port)] }]).resolves({
        exitCode: 0,
        output: `${pids.join('\n')}\n`,
        signal: null,
        timedOut: false,
      });
    },
    noneListeningMatchingPort: ({ port }: { port: PortMatcher }): void => {
      handle.calledWith([{ command: 'lsof', args: ['-ti', portArg(port)] }]).resolves({
        exitCode: 1,
        output: '',
        signal: null,
        timedOut: false,
      });
    },
    throwsMatchingPort: ({ port, message }: { port: PortMatcher; message: string }): void => {
      handle
        .calledWith([{ command: 'lsof', args: ['-ti', portArg(port)] }])
        .rejects(new RunNotFoundError({ command: 'lsof', code: 'ENOENT', message }));
    },

    getCallsFor: ({ port }: { port: PortMatcher }): readonly unknown[][] =>
      handle.callsMatching([{ command: 'lsof', args: ['-ti', portArg(port)] }]),
  };
};
