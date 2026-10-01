import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';
import { argsMatcher } from '../../gateway-test-support/arg-matcher';
import type { ArgsMatcher } from '../../gateway-test-support/arg-matcher';

// Stages at the SPAWN level (composing #gateway/node/child_process's own runProxy), never
// `registerMock({ fn: run })` directly — a caller composing this proxy alongside anything else that
// runs through `run` (this repo's ward, for one) needs `run`'s real body to keep translating into
// `spawn` for its OWN commands; mocking `run` itself replaces that body outright. No `cwd` is staged
// here, only `command` and `args`: `run.setupSuccess`/`setupError` without a `cwd` key is a prefix
// match, the same "any cwd matches" reach every existing caller of this proxy already relies on.
//
// `output` is staged as what the program prints on stdout. `stderr` is what it prints on stderr,
// empty unless given, so a test can prove a parser reads stdout alone.
//
// `timedOut` is not staged: `run`'s real body sets it ONLY from its OWN internal timer, armed by a
// `timeout` param this gateway's `*-run.ts` wrappers never pass to `run`, so no spawn-level staging
// can produce it.
const COMMAND = 'git';

export const gitRunProxy = (): {
  setupResult: (params: {
    args: string[];
    exitCode: number;
    output: string;
    stderr?: string;
    signal?: NodeJS.Signals;
  }) => void;
  setupNotFound: (params: { args: string[] }) => void;
  returnsMatchingArgs: (params: {
    args: ArgsMatcher;
    exitCode: number;
    output: string;
    stderr?: string;
    signal?: NodeJS.Signals;
  }) => void;
  throwsMatchingArgs: (params: { args: ArgsMatcher }) => void;
  getCallsFor: (params: { args: ArgsMatcher }) => readonly unknown[][];
} => {
  const run = runProxy();

  const stageResult = ({
    args,
    exitCode,
    output,
    stderr = '',
    signal,
  }: {
    args: string[] | ArgsMatcher;
    exitCode: number;
    output: string;
    stderr?: string;
    signal?: NodeJS.Signals;
  }): void => {
    if (signal !== undefined) {
      run.setupSignalKill({ command: COMMAND, args, signal, stdout: output, stderr });
      return;
    }
    run.setupSuccess({ command: COMMAND, args, exitCode, stdout: output, stderr });
  };

  // `run`'s real body wraps spawn's own `'error'` event into RunNotFoundError, reading `code` and
  // `message` off whatever error the mocked spawn emits — so staging that raw error here (rather
  // than constructing RunNotFoundError by hand) produces the identical rejection a real ENOENT does; the
  // error itself is the recorded ENOENT failure from `@gateway/node/fs`.
  const stageNotFound = ({ args }: { args: string[] | ArgsMatcher }): void => {
    run.setupError({
      command: COMMAND,
      args,
      error: FileMissingErrorStub({ path: COMMAND }),
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
              `git-run.proxy: call/options length mismatch at index ${String(index)}`,
            );
          }
          return { command: COMMAND, args: oneCallArgs, cwd: options.cwd };
        })
        .filter((call) => argsMatcher({ matcher: args, actual: call.args }))
        .map((call) => [call]);
    },
  };
};
