import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { ChildProcessStub } from '../child-process/child-process.stub';

const createMockChild = (): {
  child: ReturnType<typeof ChildProcessStub>;
  stdout: PassThrough;
  stderr: PassThrough;
} => {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const child = ChildProcessStub();
  child.stdout = stdout;
  child.stderr = stderr;

  return { child, stdout, stderr };
};

export const streamProxy = (): {
  setupSuccess: (params: {
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
  }) => void;
  setupSignalKill: (params: { command: string; signal: NodeJS.Signals; stdout: string }) => void;
  setupError: (params: { command: string; error: Error; stdout?: string }) => void;
  setupCloseNull: (params: { command: string; stdout: string }) => void;
  getSpawnedArgs: (params: { command: string }) => unknown;
  // Every call's own `args` (spawn's 2nd positional argument), in call order, for calls whose
  // command matches — `getSpawnedArgs` above only reads the LAST one, which collapses a caller
  // that spawns the SAME command once per item (one child per workspace package, in
  // `multiPackageLayerBroker`) down to a single remembered call.
  getCallsFor: (params: { command: string }) => readonly string[][];
  getSpawnedCwds: (params: { command: string }) => readonly string[];
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
      exitCode: number;
      stdout: string;
      stderr: string;
    }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, stdout: stdoutStream, stderr: stderrStream } = createMockChild();
        process.nextTick(() => {
          if (stdout) {
            stdoutStream.emit('data', Buffer.from(stdout));
          }
          if (stderr) {
            stderrStream.emit('data', Buffer.from(stderr));
          }
          child.emit('close', exitCode, null);
        });
        return child;
      });
    },

    setupSignalKill: ({
      command,
      signal,
      stdout,
    }: {
      command: string;
      signal: NodeJS.Signals;
      stdout: string;
    }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, stdout: stdoutStream } = createMockChild();
        process.nextTick(() => {
          if (stdout) {
            stdoutStream.emit('data', Buffer.from(stdout));
          }
          child.emit('close', null, signal);
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
        const { child, stdout: stdoutStream } = createMockChild();
        process.nextTick(() => {
          if (stdout) {
            stdoutStream.emit('data', Buffer.from(stdout));
          }
          child.emit('error', error);
        });
        return child;
      });
    },

    setupCloseNull: ({ command, stdout }: { command: string; stdout: string }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, stdout: stdoutStream } = createMockChild();
        process.nextTick(() => {
          if (stdout) {
            stdoutStream.emit('data', Buffer.from(stdout));
          }
          child.emit('close', null, null);
        });
        return child;
      });
    },

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[1],

    getCallsFor: ({ command }: { command: string }): readonly string[][] =>
      handle.callsMatching([command]).map((call) => call[1] as string[]),

    getSpawnedCwds: ({ command }: { command: string }): readonly string[] =>
      handle.callsMatching([command]).flatMap(([, , options]) => {
        if (typeof options === 'object' && options !== null && 'cwd' in options) {
          const rawCwd = (options as { cwd?: unknown }).cwd;
          return typeof rawCwd === 'string' ? [rawCwd] : [];
        }
        return [];
      }),
  };
};
