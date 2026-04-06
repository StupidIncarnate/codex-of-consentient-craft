import { ExitCodeStub, type ErrorMessage, type ExitCode } from '@dungeonmaster/shared/contracts';
import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable, Writable } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface ProxyConfig {
  exitCode: ExitCode;
  stdout: ErrorMessage;
  stderr: ErrorMessage;
  error: Error | null;
}

export const childProcessSpawnCaptureAdapterProxy = (): {
  setupSuccess: (params: {
    exitCode: ExitCode;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
  getSpawnedOptions: () => unknown;
} => {
  const handle = registerMock({ fn: spawn });

  const config: ProxyConfig = {
    exitCode: ExitCodeStub({ value: 0 }),
    stdout: '' as ErrorMessage,
    stderr: '' as ErrorMessage,
    error: null,
  };

  const createMockChild = (): ChildProcess => {
    const child = new EventEmitter() as ChildProcess;
    child.stdout = new Readable({
      read(): void {
        /* noop */
      },
    });
    child.stderr = new Readable({
      read(): void {
        /* noop */
      },
    });
    child.stdin = new Writable({
      write(_c, _e, cb): void {
        cb();
      },
    });
    child.kill = jest.fn().mockReturnValue(true);

    // Non-null assertion safe: stdout/stderr assigned as Readable above
    const mockStdout = child.stdout;
    const mockStderr = child.stderr;
    setImmediate(() => {
      if (config.error) {
        child.emit('error', config.error);
      } else {
        if (String(config.stdout).length > 0) {
          mockStdout.push(Buffer.from(String(config.stdout)));
        }
        mockStdout.push(null);
        if (String(config.stderr).length > 0) {
          mockStderr.push(Buffer.from(String(config.stderr)));
        }
        mockStderr.push(null);
        child.emit('exit', config.exitCode);
      }
    });

    return child;
  };

  handle.mockImplementation(() => createMockChild());

  return {
    setupSuccess: ({
      exitCode,
      stdout,
      stderr,
    }: {
      exitCode: ExitCode;
      stdout: ErrorMessage;
      stderr: ErrorMessage;
    }): void => {
      config.exitCode = exitCode;
      config.stdout = stdout;
      config.stderr = stderr;
      config.error = null;
    },

    setupError: ({ error }: { error: Error }): void => {
      config.error = error;
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
      const opts: unknown = lastCall[2];
      if (typeof opts !== 'object' || opts === null) return undefined;
      return Reflect.get(opts, 'cwd');
    },

    getSpawnedOptions: (): unknown => {
      const { calls } = handle.mock;
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      return lastCall[2];
    },
  };
};
