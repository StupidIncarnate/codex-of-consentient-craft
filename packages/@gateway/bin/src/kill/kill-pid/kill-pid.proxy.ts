import { killRunProxy } from '../kill-run/kill-run.proxy';

// `pid` reaches argv only after `String(pid)`, so a tolerant address is a predicate over that
// stringified form rather than the caller's own number.
type PidMatcher = number | ((value: unknown) => boolean);

export const killPidProxy = (): {
  setupResult: (params: {
    pid: number;
    signal?: NodeJS.Signals;
    exitCode: number;
    output: string;
  }) => void;
  returnsMatchingPid: (params: {
    pid: PidMatcher;
    signal?: NodeJS.Signals;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { pid: PidMatcher; signal?: NodeJS.Signals }) => readonly unknown[][];
} => {
  const runProxy = killRunProxy();

  return {
    setupResult: ({
      pid,
      signal,
      exitCode,
      output,
    }: {
      pid: number;
      signal?: NodeJS.Signals;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [`-${signal ?? 'SIGKILL'}`, String(pid)],
        exitCode,
        output,
      });
    },

    returnsMatchingPid: ({
      pid,
      signal,
      exitCode,
      output,
    }: {
      pid: PidMatcher;
      signal?: NodeJS.Signals;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: [`-${signal ?? 'SIGKILL'}`, typeof pid === 'function' ? pid : String(pid)],
        exitCode,
        output,
      });
    },

    getCallsFor: ({
      pid,
      signal,
    }: {
      pid: PidMatcher;
      signal?: NodeJS.Signals;
    }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: [`-${signal ?? 'SIGKILL'}`, typeof pid === 'function' ? pid : String(pid)],
      }),
  };
};
