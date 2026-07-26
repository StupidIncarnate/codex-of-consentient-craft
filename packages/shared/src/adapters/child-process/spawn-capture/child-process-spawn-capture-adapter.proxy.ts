import { ExitCodeStub, type ErrorMessage, type ExitCode } from '@dungeonmaster/shared/contracts';
import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable, Writable } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface ProxyConfig {
  exitCode: ExitCode | null;
  signal: NodeJS.Signals | null;
  stdout: ErrorMessage;
  stderr: ErrorMessage;
  error: Error | null;
}

const createMockChildFromConfig = ({ snapshot }: { snapshot: ProxyConfig }): ChildProcess => {
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
    if (snapshot.error) {
      child.emit('error', snapshot.error);
    } else {
      if (String(snapshot.stdout).length > 0) {
        mockStdout.push(Buffer.from(String(snapshot.stdout)));
      }
      mockStdout.push(null);
      if (String(snapshot.stderr).length > 0) {
        mockStderr.push(Buffer.from(String(snapshot.stderr)));
      }
      mockStderr.push(null);
      child.emit('exit', snapshot.exitCode, snapshot.signal);
    }
  });

  return child;
};

export const childProcessSpawnCaptureAdapterProxy = (): {
  setupSuccess: (params: {
    command: string;
    exitCode: ExitCode;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }) => void;
  setupSignalKill: (params: {
    command: string;
    signal: NodeJS.Signals;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }) => void;
  setupError: (params: { command: string; error: Error }) => void;
  getSpawnedCommand: (params: { command: string }) => unknown;
  getSpawnedArgs: (params: { command: string }) => unknown;
  getSpawnedCwd: (params: { command: string }) => unknown;
  getSpawnedOptions: (params: { command: string }) => unknown;
} => {
  const handle = registerMock({ fn: spawn });

  return {
    setupSuccess: ({
      command,
      exitCode,
      stdout,
      stderr,
    }: {
      command: string;
      exitCode: ExitCode;
      stdout: ErrorMessage;
      stderr: ErrorMessage;
    }): void => {
      const snapshot: ProxyConfig = { exitCode, signal: null, stdout, stderr, error: null };
      handle.calledWith([command]).implement(() => createMockChildFromConfig({ snapshot }));
    },

    setupSignalKill: ({
      command,
      signal,
      stdout,
      stderr,
    }: {
      command: string;
      signal: NodeJS.Signals;
      stdout: ErrorMessage;
      stderr: ErrorMessage;
    }): void => {
      const snapshot: ProxyConfig = { exitCode: null, signal, stdout, stderr, error: null };
      handle.calledWith([command]).implement(() => createMockChildFromConfig({ snapshot }));
    },

    setupError: ({ command, error }: { command: string; error: Error }): void => {
      const snapshot: ProxyConfig = {
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        stdout: '' as ErrorMessage,
        stderr: '' as ErrorMessage,
        error,
      };
      handle.calledWith([command]).implement(() => createMockChildFromConfig({ snapshot }));
    },

    getSpawnedCommand: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[0],

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[1],

    getSpawnedCwd: ({ command }: { command: string }): unknown => {
      const opts: unknown = handle.callsMatching([command]).at(-1)?.[2];
      if (typeof opts !== 'object' || opts === null) return undefined;
      const { cwd } = opts as { cwd?: unknown };
      return cwd;
    },

    getSpawnedOptions: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[2],
  };
};
