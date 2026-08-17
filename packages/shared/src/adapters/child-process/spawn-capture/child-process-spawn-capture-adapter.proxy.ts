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
  // Models the race the production adapter guards against: the child's `exit` firing before its
  // stdio pipes have drained. `false` keeps every existing caller's ordering (data settles, then
  // exit) so the other ~25 composed proxies are unaffected.
  raceExitBeforeDrain: boolean;
  // Models a descendant process holding a stdio pipe open past the child's own exit (e.g. a
  // detached postinstall helper inheriting the fd): `exit` fires but neither stream ever pushes
  // `null`, so neither `end` nor `close` ever follows.
  neverDrain: boolean;
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
      return;
    }

    if (snapshot.neverDrain) {
      child.emit('exit', snapshot.exitCode, snapshot.signal);
      return;
    }

    // Racy ordering: fire `exit` BEFORE the pipes drain, matching a real short-lived process.
    if (snapshot.raceExitBeforeDrain) {
      child.emit('exit', snapshot.exitCode, snapshot.signal);
    }

    if (String(snapshot.stdout).length > 0) {
      mockStdout.push(Buffer.from(String(snapshot.stdout)));
    }
    mockStdout.push(null);
    if (String(snapshot.stderr).length > 0) {
      mockStderr.push(Buffer.from(String(snapshot.stderr)));
    }
    mockStderr.push(null);

    if (!snapshot.raceExitBeforeDrain) {
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
    raceExitBeforeDrain?: boolean;
    neverDrain?: boolean;
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
      raceExitBeforeDrain,
      neverDrain,
    }: {
      command: string;
      exitCode: ExitCode;
      stdout: ErrorMessage;
      stderr: ErrorMessage;
      raceExitBeforeDrain?: boolean;
      neverDrain?: boolean;
    }): void => {
      const snapshot: ProxyConfig = {
        exitCode,
        signal: null,
        stdout,
        stderr,
        error: null,
        raceExitBeforeDrain: raceExitBeforeDrain ?? false,
        neverDrain: neverDrain ?? false,
      };
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
      const snapshot: ProxyConfig = {
        exitCode: null,
        signal,
        stdout,
        stderr,
        error: null,
        raceExitBeforeDrain: false,
        neverDrain: false,
      };
      handle.calledWith([command]).implement(() => createMockChildFromConfig({ snapshot }));
    },

    setupError: ({ command, error }: { command: string; error: Error }): void => {
      const snapshot: ProxyConfig = {
        exitCode: ExitCodeStub({ value: 0 }),
        signal: null,
        stdout: '' as ErrorMessage,
        stderr: '' as ErrorMessage,
        error,
        raceExitBeforeDrain: false,
        neverDrain: false,
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
