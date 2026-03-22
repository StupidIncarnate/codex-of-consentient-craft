import { PassThrough } from 'stream';
import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';
import type { ChildProcess, spawn } from 'child_process';

jest.mock('child_process');

type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null) => void;

export const childProcessSpawnStreamLinesAdapterProxy = (): {
  setupSuccess: (params: {
    exitCode: ExitCode;
    stdoutLines: string[];
    stderrChunks?: string[];
  }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const mock = jest.mocked(
    jest.requireMock<{ spawn: typeof spawn }>('child_process').spawn,
  ) as jest.Mock;

  mock.mockImplementation(() => {
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const listeners = {
      error: [] as ErrorCallback[],
      close: [] as CloseCallback[],
    };

    const child = {
      stdout,
      stderr,
      on: (event: string, callback: ErrorCallback | CloseCallback): unknown => {
        if (event === 'error') {
          listeners.error.push(callback as ErrorCallback);
        }
        if (event === 'close') {
          listeners.close.push(callback as CloseCallback);
        }
        return undefined;
      },
    } as unknown as ChildProcess;

    process.nextTick(() => {
      stdout.end();
      stderr.end();
      for (const cb of listeners.close) {
        cb(0);
      }
    });

    return child;
  });

  return {
    setupSuccess: ({
      exitCode,
      stdoutLines,
      stderrChunks,
    }: {
      exitCode: ExitCode;
      stdoutLines: string[];
      stderrChunks?: string[];
    }): void => {
      const successCode = ExitCodeStub({ value: 0 });
      mock.mockImplementationOnce(() => {
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        const listeners = {
          error: [] as ErrorCallback[],
          close: [] as CloseCallback[],
        };

        const child = {
          stdout,
          stderr,
          on: (event: string, callback: ErrorCallback | CloseCallback): unknown => {
            if (event === 'error') {
              listeners.error.push(callback as ErrorCallback);
            }
            if (event === 'close') {
              listeners.close.push(callback as CloseCallback);
            }
            return undefined;
          },
        } as unknown as ChildProcess;

        process.nextTick(() => {
          for (const line of stdoutLines) {
            stdout.write(`${line}\n`);
          }
          stdout.end();

          if (stderrChunks) {
            for (const chunk of stderrChunks) {
              stderr.write(chunk);
            }
          }
          stderr.end();

          for (const cb of listeners.close) {
            cb(exitCode === successCode ? 0 : Number(exitCode));
          }
        });

        return child;
      });
    },

    setupError: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        const listeners = {
          error: [] as ErrorCallback[],
          close: [] as CloseCallback[],
        };

        const child = {
          stdout,
          stderr,
          on: (event: string, callback: ErrorCallback | CloseCallback): unknown => {
            if (event === 'error') {
              listeners.error.push(callback as ErrorCallback);
            }
            if (event === 'close') {
              listeners.close.push(callback as CloseCallback);
            }
            return undefined;
          },
        } as unknown as ChildProcess;

        process.nextTick(() => {
          stdout.end();
          stderr.end();
          for (const cb of listeners.error) {
            cb(error);
          }
        });

        return child;
      });
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
