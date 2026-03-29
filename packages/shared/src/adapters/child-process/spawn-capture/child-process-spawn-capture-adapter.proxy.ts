import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';
import { execFile } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type ExecFileCallback = (error: Error | null, stdout: string, stderr: string) => void;

export const childProcessSpawnCaptureAdapterProxy = (): {
  setupSuccess: (params: { exitCode: ExitCode; stdout: string; stderr: string }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
  getSpawnedOptions: () => unknown;
} => {
  const handle = registerMock({ fn: execFile });

  handle.mockImplementation(
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
      handle.mockImplementationOnce(
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
      handle.mockImplementationOnce(
        (_cmd: string, _args: string[], _opts: unknown, callback: ExecFileCallback) => {
          callback(error, '', '');
        },
      );
    },

    getSpawnedCommand: (): unknown => {
      const { calls } = handle.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return Reflect.get(lastCall as object, 0);
    },

    getSpawnedArgs: (): unknown => {
      const { calls } = handle.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return Reflect.get(lastCall as object, 1);
    },

    getSpawnedCwd: (): unknown => {
      const { calls } = handle.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      const [, , opts] = lastCall as unknown[];
      if (typeof opts !== 'object' || opts === null) return undefined;
      return Reflect.get(opts, 'cwd');
    },

    getSpawnedOptions: (): unknown => {
      const { calls } = handle.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      const [, , opts] = lastCall as unknown[];
      return opts;
    },
  };
};
