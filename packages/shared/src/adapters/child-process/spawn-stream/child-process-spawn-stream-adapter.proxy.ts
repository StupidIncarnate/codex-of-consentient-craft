import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';
import type { ChildProcess, spawn } from 'child_process';

jest.mock('child_process');

type DataCallback = (chunk: Buffer) => void;
type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null) => void;

export const childProcessSpawnStreamAdapterProxy = (): {
  setupSuccess: (params: { exitCode: ExitCode; stdout: string; stderr: string }) => void;
  setupSuccessMultiChunk: (params: {
    exitCode: ExitCode;
    stdoutChunks: string[];
    stderr: string;
  }) => void;
  setupError: (params: { error: Error; stdout?: string }) => void;
  setupErrorWithCode: (params: { error: Error; exitCode: ExitCode }) => void;
  setupCloseNull: (params: { stdout: string }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const mock = jest.mocked(
    jest.requireMock<{ spawn: typeof spawn }>('child_process').spawn,
  ) as jest.Mock;

  const createMockChild = (): {
    child: ChildProcess;
    listeners: {
      stdoutData: DataCallback[];
      stderrData: DataCallback[];
      error: ErrorCallback[];
      close: CloseCallback[];
    };
  } => {
    const listeners = {
      stdoutData: [] as DataCallback[],
      stderrData: [] as DataCallback[],
      error: [] as ErrorCallback[],
      close: [] as CloseCallback[],
    };

    const stdoutOn = (_event: string, callback: DataCallback): unknown => {
      listeners.stdoutData.push(callback);
      return undefined;
    };

    const stderrOn = (_event: string, callback: DataCallback): unknown => {
      listeners.stderrData.push(callback);
      return undefined;
    };

    const child = {
      stdout: { on: stdoutOn },
      stderr: { on: stderrOn },
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

    return { child, listeners };
  };

  mock.mockImplementation(() => {
    const { child, listeners } = createMockChild();

    process.nextTick(() => {
      for (const cb of listeners.close) {
        cb(0);
      }
    });

    return child;
  });

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
      mock.mockImplementationOnce(() => {
        const { child, listeners } = createMockChild();

        process.nextTick(() => {
          if (stdout) {
            for (const cb of listeners.stdoutData) {
              cb(Buffer.from(stdout));
            }
          }
          if (stderr) {
            for (const cb of listeners.stderrData) {
              cb(Buffer.from(stderr));
            }
          }
          for (const cb of listeners.close) {
            cb(exitCode === successCode ? 0 : Number(exitCode));
          }
        });

        return child;
      });
    },

    setupSuccessMultiChunk: ({
      exitCode,
      stdoutChunks,
      stderr,
    }: {
      exitCode: ExitCode;
      stdoutChunks: string[];
      stderr: string;
    }): void => {
      const successCode = ExitCodeStub({ value: 0 });
      mock.mockImplementationOnce(() => {
        const { child, listeners } = createMockChild();

        process.nextTick(() => {
          for (const chunk of stdoutChunks) {
            for (const cb of listeners.stdoutData) {
              cb(Buffer.from(chunk));
            }
          }
          if (stderr) {
            for (const cb of listeners.stderrData) {
              cb(Buffer.from(stderr));
            }
          }
          for (const cb of listeners.close) {
            cb(exitCode === successCode ? 0 : (exitCode as unknown as ExitCode));
          }
        });

        return child;
      });
    },

    setupError: ({ error, stdout }: { error: Error; stdout?: string }): void => {
      mock.mockImplementationOnce(() => {
        const { child, listeners } = createMockChild();

        process.nextTick(() => {
          if (stdout) {
            for (const cb of listeners.stdoutData) {
              cb(Buffer.from(stdout));
            }
          }
          for (const cb of listeners.error) {
            cb(error);
          }
        });

        return child;
      });
    },

    setupErrorWithCode: ({ error, exitCode }: { error: Error; exitCode: ExitCode }): void => {
      const errorWithCode = Object.assign(error, { code: exitCode as unknown });
      mock.mockImplementationOnce(() => {
        const { child, listeners } = createMockChild();

        process.nextTick(() => {
          for (const cb of listeners.error) {
            cb(errorWithCode as Error);
          }
        });

        return child;
      });
    },

    setupCloseNull: ({ stdout }: { stdout: string }): void => {
      mock.mockImplementationOnce(() => {
        const { child, listeners } = createMockChild();

        process.nextTick(() => {
          if (stdout) {
            for (const cb of listeners.stdoutData) {
              cb(Buffer.from(stdout));
            }
          }
          for (const cb of listeners.close) {
            cb(null);
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
