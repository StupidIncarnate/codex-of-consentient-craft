import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable, Writable } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';

interface ProxyConfig {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  error: Error | null;
  // Models a descendant process holding a stdio pipe open past the child's own exit: `exit`
  // fires but neither stream ever pushes `null`, so neither `end` nor `close` ever follows.
  neverDrain: boolean;
}

const createMockChildFromConfig = ({
  snapshot,
  killMock,
}: {
  snapshot: ProxyConfig;
  killMock: () => boolean;
}): ChildProcess => {
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
    write(_chunk, _encoding, callback): void {
      callback();
    },
  });
  child.kill = killMock as ChildProcess['kill'];

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

    if (snapshot.stdout.length > 0) {
      mockStdout.push(Buffer.from(snapshot.stdout));
    }
    mockStdout.push(null);
    if (snapshot.stderr.length > 0) {
      mockStderr.push(Buffer.from(snapshot.stderr));
    }
    mockStderr.push(null);

    child.emit('exit', snapshot.exitCode, snapshot.signal);
  });

  return child;
};

export const runProxy = (): {
  setupSuccess: (params: {
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    neverDrain?: boolean;
  }) => void;
  setupSignalKill: (params: {
    command: string;
    signal: NodeJS.Signals;
    stdout: string;
    stderr: string;
  }) => void;
  setupError: (params: { command: string; error: Error }) => void;
  // The process never exits on its own — the mock only emits `exit` once its own `kill()` is
  // called, so a test proves the wrapper's OWN timeout timer is what triggers the kill, not just
  // that the mocked child happens to exit around the same time.
  setupHangsUntilKilled: (params: { command: string; signalOnKill: NodeJS.Signals }) => void;
  getKillCallCount: (params: { command: string }) => number;
} => {
  const handle = registerMock({ fn: spawn });
  const killCallCountByCommand = new Map<string, number>();

  const buildKillMock = ({ command }: { command: string }): (() => boolean) => {
    killCallCountByCommand.set(command, 0);
    return (): boolean => {
      killCallCountByCommand.set(command, (killCallCountByCommand.get(command) ?? 0) + 1);
      return true;
    };
  };

  return {
    setupSuccess: ({
      command,
      exitCode,
      stdout,
      stderr,
      neverDrain,
    }: {
      command: string;
      exitCode: number;
      stdout: string;
      stderr: string;
      neverDrain?: boolean;
    }): void => {
      const snapshot: ProxyConfig = {
        exitCode,
        signal: null,
        stdout,
        stderr,
        error: null,
        neverDrain: neverDrain ?? false,
      };
      handle
        .calledWith([command])
        .implement(() =>
          createMockChildFromConfig({ snapshot, killMock: buildKillMock({ command }) }),
        );
    },

    setupSignalKill: ({
      command,
      signal,
      stdout,
      stderr,
    }: {
      command: string;
      signal: NodeJS.Signals;
      stdout: string;
      stderr: string;
    }): void => {
      const snapshot: ProxyConfig = {
        exitCode: null,
        signal,
        stdout,
        stderr,
        error: null,
        neverDrain: false,
      };
      handle
        .calledWith([command])
        .implement(() =>
          createMockChildFromConfig({ snapshot, killMock: buildKillMock({ command }) }),
        );
    },

    setupError: ({ command, error }: { command: string; error: Error }): void => {
      const snapshot: ProxyConfig = {
        exitCode: 0,
        signal: null,
        stdout: '',
        stderr: '',
        error,
        neverDrain: false,
      };
      handle
        .calledWith([command])
        .implement(() =>
          createMockChildFromConfig({ snapshot, killMock: buildKillMock({ command }) }),
        );
    },

    setupHangsUntilKilled: ({
      command,
      signalOnKill,
    }: {
      command: string;
      signalOnKill: NodeJS.Signals;
    }): void => {
      killCallCountByCommand.set(command, 0);
      handle.calledWith([command]).implement(() => {
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
        child.stdout.push(null);
        child.stderr.push(null);
        child.kill = ((): boolean => {
          killCallCountByCommand.set(command, (killCallCountByCommand.get(command) ?? 0) + 1);
          setImmediate(() => {
            child.emit('exit', null, signalOnKill);
          });
          return true;
        }) as ChildProcess['kill'];
        return child;
      });
    },

    getKillCallCount: ({ command }: { command: string }): number =>
      killCallCountByCommand.get(command) ?? 0,
  };
};
