import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { argsMatcher } from '../../gateway-test-support/arg-matcher';
import type { ArgsMatcher } from '../../gateway-test-support/arg-matcher';

// Stages at the SPAWN level (composing #gateway/node/child_process's own runProxy), never
// `registerMock({ fn: run })` directly — a caller composing this proxy alongside anything else that
// runs through `run` (this repo's ward, for one) needs `run`'s real body to keep translating into
// `spawn` for its OWN commands; mocking `run` itself replaces that body outright. No `cwd` is staged
// here, only `command` and `args`: `run.setupSuccess`/`setupError` without a `cwd` key is a prefix
// match, the same "any cwd matches" reach every existing caller of this proxy already relies on.
//
// `timedOut` stays accepted on every method below for API parity, but is never wired through:
// `run`'s real body sets it ONLY from its OWN internal timer, armed by a `timeout` param this
// gateway's `*-run.ts` wrappers never pass to `run`, so no spawn-level staging can produce it —
// there is nothing here for a real caller to ever observe.
const COMMAND = 'npm';

export const npmRunProxy = (): {
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
  const run = runProxy();

  const stageResult = ({
    args,
    exitCode,
    output,
    signal,
  }: {
    args: string[] | ArgsMatcher;
    exitCode: number;
    output: string;
    signal?: NodeJS.Signals;
  }): void => {
    if (signal !== undefined) {
      run.setupSignalKill({ command: COMMAND, args, signal, stdout: output, stderr: '' });
      return;
    }
    run.setupSuccess({ command: COMMAND, args, exitCode, stdout: output, stderr: '' });
  };

  // `run`'s real body wraps spawn's own `'error'` event into RunNotFoundError, reading `code` and
  // `message` off whatever error the mocked spawn emits — so staging that raw error here (rather
  // than constructing RunNotFoundError by hand) produces the identical rejection a real ENOENT does.
  const stageNotFound = ({
    args,
    message,
  }: {
    args: string[] | ArgsMatcher;
    message: string;
  }): void => {
    run.setupError({
      command: COMMAND,
      args,
      error: Object.assign(new Error(message), { code: 'ENOENT' }),
    });
  };

  return {
    setupResult: (params): void => {
      stageResult(params);
    },
    setupNotFound: (params): void => {
      stageNotFound(params);
    },
    returnsMatchingArgs: (params): void => {
      stageResult(params);
    },
    throwsMatchingArgs: (params): void => {
      stageNotFound(params);
    },

    // runProxy's own getCallsFor/getOptionsFor answer by command alone (spawn's 1st positional arg),
    // so the caller's own args address is applied here, zipping the two same-order, same-length
    // read-backs into the `{command, args, cwd}` shape this proxy always handed back.
    getCallsFor: ({ args }: { args: ArgsMatcher }): readonly unknown[][] => {
      const callArgs = run.getCallsFor({ command: COMMAND });
      const callOptions = run.getOptionsFor({ command: COMMAND });

      return callArgs
        .map((oneCallArgs, index) => {
          const options = callOptions[index];
          if (options === undefined) {
            throw new Error(
              `npm-run.proxy: call/options length mismatch at index ${String(index)}`,
            );
          }
          return { command: COMMAND, args: oneCallArgs, cwd: options.cwd };
        })
        .filter((call) => argsMatcher({ matcher: args, actual: call.args }))
        .map((call) => [call]);
    },
  };
};
