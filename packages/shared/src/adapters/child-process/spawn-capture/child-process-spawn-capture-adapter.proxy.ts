import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';
import type { execFile } from 'child_process';

jest.mock('child_process');

type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;

export const childProcessSpawnCaptureAdapterProxy = (): {
  setupSuccess: (params: { exitCode: ExitCode; stdout: string; stderr: string }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  // Re-acquire execFile from the current mock registry to avoid stale references
  // when this proxy is used cross-package from compiled dist (where jest.mock is not hoisted)
  const mock = jest.mocked(
    jest.requireMock<{ execFile: typeof execFile }>('child_process').execFile,
  ) as jest.Mock;

  mock.mockImplementation(
    (_cmd: string, _args: string[], _opts: unknown, callback: ExecFileCallback) => {
      callback(null, '', '');
    },
  );

  return {
    setupSuccess: ({
      exitCode,
      stdout,
      stderr,
    }: {
      exitCode: ExitCode;
      stdout: string;
      stderr: string;
    }): void => {
      const successCode = ExitCodeStub({ value: 0 });
      mock.mockImplementationOnce(
        (_cmd: string, _args: string[], _opts: unknown, callback: ExecFileCallback) => {
          if (exitCode === successCode) {
            callback(null, stdout, stderr);
          } else {
            const error = new Error('Command failed') as Error & { code: ExitCode };
            error.code = exitCode;
            callback(error, stdout, stderr);
          }
        },
      );
    },

    setupError: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(
        (_cmd: string, _args: string[], _opts: unknown, callback: ExecFileCallback) => {
          callback(error, '', '');
        },
      );
    },

    getSpawnedCommand: (): unknown => {
      const { calls } = mock.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return Reflect.get(lastCall as object, 0);
    },

    getSpawnedArgs: (): unknown => {
      const { calls } = mock.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return Reflect.get(lastCall as object, 1);
    },

    getSpawnedCwd: (): unknown => {
      const { calls } = mock.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      const [, , opts] = lastCall as unknown[];
      if (typeof opts !== 'object' || opts === null) return undefined;
      return Reflect.get(opts, 'cwd');
    },
  };
};
