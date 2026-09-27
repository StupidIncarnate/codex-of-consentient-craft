import { killRunProxy } from '../kill-run/kill-run.proxy';

// `pgid` reaches argv only after being embedded in the negated-pid form `-${pgid}`, so a tolerant
// address is a predicate over that assembled string rather than the caller's own number.
type PgidMatcher = number | ((value: unknown) => boolean);

export const killGroupProxy = (): {
  setupResult: (params: {
    pgid: number;
    signal?: NodeJS.Signals;
    exitCode: number;
    output: string;
  }) => void;
  returnsMatchingPgid: (params: {
    pgid: PgidMatcher;
    signal?: NodeJS.Signals;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { pgid: PgidMatcher; signal?: NodeJS.Signals }) => readonly unknown[][];
} => {
  const runProxy = killRunProxy();

  return {
    setupResult: ({
      pgid,
      signal,
      exitCode,
      output,
    }: {
      pgid: number;
      signal?: NodeJS.Signals;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({
        args: [`-${signal ?? 'SIGKILL'}`, `-${pgid}`],
        exitCode,
        output,
      });
    },

    returnsMatchingPgid: ({
      pgid,
      signal,
      exitCode,
      output,
    }: {
      pgid: PgidMatcher;
      signal?: NodeJS.Signals;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: [`-${signal ?? 'SIGKILL'}`, typeof pgid === 'function' ? pgid : `-${pgid}`],
        exitCode,
        output,
      });
    },

    getCallsFor: ({
      pgid,
      signal,
    }: {
      pgid: PgidMatcher;
      signal?: NodeJS.Signals;
    }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: [`-${signal ?? 'SIGKILL'}`, typeof pgid === 'function' ? pgid : `-${pgid}`],
      }),
  };
};
