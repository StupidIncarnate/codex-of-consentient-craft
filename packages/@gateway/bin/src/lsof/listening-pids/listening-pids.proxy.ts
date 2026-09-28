import { lsofRunProxy } from '../lsof-run/lsof-run.proxy';

// `port` reaches argv only after being embedded in `:${port}`, so a tolerant address is a predicate
// over that assembled string rather than the caller's own number.
type PortMatcher = number | ((value: unknown) => boolean);

const portArg = (port: PortMatcher): string | ((value: unknown) => boolean) =>
  typeof port === 'function' ? port : `:${String(port)}`;

export const listeningPidsProxy = (): {
  setupPids: (params: { port: number; pids: number[] }) => void;
  setupNoneListening: (params: { port: number }) => void;
  setupNotFound: (params: { port: number }) => void;
  returnsMatchingPort: (params: { port: PortMatcher; pids: number[] }) => void;
  noneListeningMatchingPort: (params: { port: PortMatcher }) => void;
  throwsMatchingPort: (params: { port: PortMatcher }) => void;
  getCallsFor: (params: { port: PortMatcher }) => readonly unknown[][];
} => {
  const runProxy = lsofRunProxy();

  return {
    setupPids: ({ port, pids }: { port: number; pids: number[] }): void => {
      runProxy.setupResult({
        args: ['-ti', `:${String(port)}`],
        exitCode: 0,
        output: `${pids.join('\n')}\n`,
      });
    },
    setupNoneListening: ({ port }: { port: number }): void => {
      runProxy.setupResult({ args: ['-ti', `:${String(port)}`], exitCode: 1, output: '' });
    },
    setupNotFound: ({ port }: { port: number }): void => {
      runProxy.setupNotFound({ args: ['-ti', `:${String(port)}`] });
    },

    returnsMatchingPort: ({ port, pids }: { port: PortMatcher; pids: number[] }): void => {
      runProxy.returnsMatchingArgs({
        args: ['-ti', portArg(port)],
        exitCode: 0,
        output: `${pids.join('\n')}\n`,
      });
    },
    noneListeningMatchingPort: ({ port }: { port: PortMatcher }): void => {
      runProxy.returnsMatchingArgs({ args: ['-ti', portArg(port)], exitCode: 1, output: '' });
    },
    throwsMatchingPort: ({ port }: { port: PortMatcher }): void => {
      runProxy.throwsMatchingArgs({ args: ['-ti', portArg(port)] });
    },

    getCallsFor: ({ port }: { port: PortMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['-ti', portArg(port)] }),
  };
};
