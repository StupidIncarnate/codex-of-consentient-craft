import { spawnSync, type SpawnSyncReturns } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface SpawnedCall {
  command: string;
  args: readonly string[];
  cwd: string;
  input: unknown;
  env: unknown;
}

// `spawnSync(command, args, options)` is the real call this proxy mocks. The address is the command,
// the exact args array and a predicate keyed on the cwd the test supplies, so two callers of one
// binary stage apart by whichever of args or cwd differs.
export const runSyncWithInputProxy = (): {
  setupResult: (params: {
    command: string;
    args: string[];
    cwd: string;
    status: number | null;
    stdout: string;
    stderr: string;
    signal?: NodeJS.Signals;
  }) => void;
  getInputFor: (params: { command: string; args: string[]; cwd: string }) => unknown;
  getSpawnedEnvFor: (params: { command: string; args: string[]; cwd: string }) => unknown;
} => {
  const handle = registerMock({ fn: spawnSync });
  const calls: SpawnedCall[] = [];

  const findLast = ({
    command,
    args,
    cwd,
  }: {
    command: string;
    args: string[];
    cwd: string;
  }): SpawnedCall | undefined =>
    calls
      .filter(
        (call) =>
          call.command === command &&
          call.cwd === cwd &&
          call.args.length === args.length &&
          call.args.every((arg, index) => arg === args[index]),
      )
      .at(-1);

  return {
    setupResult: ({ command, args, cwd, status, stdout, stderr, signal }): void => {
      handle
        .calledWith([
          command,
          args,
          (options: unknown): boolean => (options as { cwd?: string }).cwd === cwd,
        ])
        .implement((...callArgs: unknown[]): SpawnSyncReturns<string> => {
          const options = callArgs[2] as { input?: unknown; env?: unknown };
          calls.push({ command, args, cwd, input: options.input, env: options.env });
          return {
            pid: 0,
            output: [null, stdout, stderr],
            stdout,
            stderr,
            status,
            signal: signal ?? null,
          };
        });
    },

    getInputFor: (params): unknown => findLast(params)?.input,

    getSpawnedEnvFor: (params): unknown => findLast(params)?.env,
  };
};
