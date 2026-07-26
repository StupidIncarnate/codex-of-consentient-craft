import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';
import { spawn, type ChildProcess } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type DataCallback = (chunk: Buffer) => void;
type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null) => void;

export const childProcessSpawnStreamAdapterProxy = (): {
  setupSuccess: (params: {
    command: string;
    exitCode: ExitCode;
    stdout: string;
    stderr: string;
  }) => void;
  setupSuccessMultiChunk: (params: {
    command: string;
    exitCode: ExitCode;
    stdoutChunks: string[];
    stderr: string;
  }) => void;
  setupError: (params: { command: string; error: Error; stdout?: string }) => void;
  setupErrorWithCode: (params: { command: string; error: Error; exitCode: ExitCode }) => void;
  setupCloseNull: (params: { command: string; stdout: string }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getAllSpawnedArgs: () => unknown[];
  getSpawnedCwd: () => unknown;
} => {
  const handle = registerMock({ fn: spawn });

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

  return {
    setupSuccess: ({
      command,
      exitCode,
      stdout,
      stderr,
    }: {
      command: string;
      exitCode: ExitCode;
      stdout: string;
      stderr: string;
    }): void => {
      const successCode = ExitCodeStub({ value: 0 });
      handle.calledWith([command]).implement(() => {
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
      command,
      exitCode,
      stdoutChunks,
      stderr,
    }: {
      command: string;
      exitCode: ExitCode;
      stdoutChunks: string[];
      stderr: string;
    }): void => {
      const successCode = ExitCodeStub({ value: 0 });
      handle.calledWith([command]).implement(() => {
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

    setupError: ({
      command,
      error,
      stdout,
    }: {
      command: string;
      error: Error;
      stdout?: string;
    }): void => {
      handle.calledWith([command]).implement(() => {
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

    setupErrorWithCode: ({
      command,
      error,
      exitCode,
    }: {
      command: string;
      error: Error;
      exitCode: ExitCode;
    }): void => {
      const errorWithCode = Object.assign(error, { code: exitCode as unknown });
      handle.calledWith([command]).implement(() => {
        const { child, listeners } = createMockChild();

        process.nextTick(() => {
          for (const cb of listeners.error) {
            cb(errorWithCode as Error);
          }
        });

        return child;
      });
    },

    setupCloseNull: ({ command, stdout }: { command: string; stdout: string }): void => {
      handle.calledWith([command]).implement(() => {
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
      const calls = handle.callsMatching([]);
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      return lastCall[0];
    },

    getSpawnedArgs: (): unknown => {
      const calls = handle.callsMatching([]);
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      return lastCall[1];
    },

    getAllSpawnedArgs: (): unknown[] => handle.callsMatching([]).map((call) => call[1]),

    getSpawnedCwd: (): unknown => {
      const calls = handle.callsMatching([]);
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      const [, , opts] = lastCall as unknown[];
      if (typeof opts !== 'object' || opts === null) return undefined;
      const { cwd } = opts as { cwd?: unknown };
      return cwd;
    },
  };
};
