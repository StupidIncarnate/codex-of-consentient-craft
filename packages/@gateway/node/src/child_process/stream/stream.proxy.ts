import { spawn, type ChildProcess } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type DataCallback = (chunk: Buffer) => void;
type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null, signal: NodeJS.Signals | null) => void;

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

  const child = {
    stdout: {
      on: (_event: string, callback: DataCallback): unknown => {
        listeners.stdoutData.push(callback);
        return undefined;
      },
    },
    stderr: {
      on: (_event: string, callback: DataCallback): unknown => {
        listeners.stderrData.push(callback);
        return undefined;
      },
    },
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
        const { child, listeners } = createMockChild();
        process.nextTick(() => {
          if (stdout) {
            for (const cb of listeners.stdoutData) cb(Buffer.from(stdout));
          }
          if (stderr) {
            for (const cb of listeners.stderrData) cb(Buffer.from(stderr));
          }
          for (const cb of listeners.close) cb(exitCode, null);
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
        const { child, listeners } = createMockChild();
        process.nextTick(() => {
          if (stdout) {
            for (const cb of listeners.stdoutData) cb(Buffer.from(stdout));
          }
          for (const cb of listeners.close) cb(null, signal);
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
            for (const cb of listeners.stdoutData) cb(Buffer.from(stdout));
          }
          for (const cb of listeners.error) cb(error);
        });
        return child;
      });
    },

    setupCloseNull: ({ command, stdout }: { command: string; stdout: string }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, listeners } = createMockChild();
        process.nextTick(() => {
          if (stdout) {
            for (const cb of listeners.stdoutData) cb(Buffer.from(stdout));
          }
          for (const cb of listeners.close) cb(null, null);
        });
        return child;
      });
    },

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[1],

    getCallsFor: ({ command }: { command: string }): readonly string[][] =>
      handle.callsMatching([command]).map((call) => call[1] as string[]),
  };
};
