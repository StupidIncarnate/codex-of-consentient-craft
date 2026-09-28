import { spawn, type ChildProcess } from 'child_process';
import { PassThrough } from 'stream';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null, signal: NodeJS.Signals | null) => void;

const createMockChild = (): {
  child: ChildProcess;
  stdout: PassThrough;
  stderr: PassThrough;
  listeners: { error: ErrorCallback[]; close: CloseCallback[] };
} => {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const listeners = { error: [] as ErrorCallback[], close: [] as CloseCallback[] };

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

  return { child, stdout, stderr, listeners };
};

export const streamLinesProxy = (): {
  setupSuccess: (params: { command: string; exitCode: number; stdoutLines: string[] }) => void;
  setupSignalKill: (params: { command: string; signal: NodeJS.Signals }) => void;
  setupStderrOnly: (params: { command: string; exitCode: number; stderrChunks: string[] }) => void;
  setupError: (params: { command: string; error: Error }) => void;
  getSpawnedArgs: (params: { command: string }) => unknown;
  // Records every process.stderr.write call so a test can prove the wrapper LOGGED a failing
  // onLine rather than letting it crash the process.
  captureStderrWrites: () => string[];
  // Every call's own OPTIONS (spawn's 3rd positional argument) — `cwd`, exactly what `streamLines`
  // builds it as — in call order, for calls whose command matches. Mirrors `run.proxy.ts`'s
  // `getOptionsFor`; unlike `run`, `streamLines` takes no caller-supplied `env` to read back.
  getOptionsFor: (params: { command: string }) => readonly { cwd: string }[];
} => {
  const handle = registerMock({ fn: spawn });
  const stderrWriteSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrWriteSpy.calledWith([]).returns(true);

  return {
    setupSuccess: ({
      command,
      exitCode,
      stdoutLines,
    }: {
      command: string;
      exitCode: number;
      stdoutLines: string[];
    }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, stdout, listeners } = createMockChild();
        process.nextTick(() => {
          for (const line of stdoutLines) {
            stdout.write(`${line}\n`);
          }
          stdout.end();
          for (const cb of listeners.close) cb(exitCode, null);
        });
        return child;
      });
    },

    setupSignalKill: ({ command, signal }: { command: string; signal: NodeJS.Signals }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, stdout, listeners } = createMockChild();
        process.nextTick(() => {
          stdout.end();
          for (const cb of listeners.close) cb(null, signal);
        });
        return child;
      });
    },

    setupStderrOnly: ({
      command,
      exitCode,
      stderrChunks,
    }: {
      command: string;
      exitCode: number;
      stderrChunks: string[];
    }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, stdout, stderr, listeners } = createMockChild();
        process.nextTick(() => {
          stdout.end();
          for (const chunk of stderrChunks) {
            stderr.write(chunk);
          }
          stderr.end();
          for (const cb of listeners.close) cb(exitCode, null);
        });
        return child;
      });
    },

    setupError: ({ command, error }: { command: string; error: Error }): void => {
      handle.calledWith([command]).implement(() => {
        const { child, stdout, listeners } = createMockChild();
        process.nextTick(() => {
          stdout.end();
          for (const cb of listeners.error) cb(error);
        });
        return child;
      });
    },

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[1],

    captureStderrWrites: (): string[] =>
      stderrWriteSpy.callsMatching([]).map((call) => String(call[0])),

    getOptionsFor: ({ command }: { command: string }): readonly { cwd: string }[] =>
      handle.callsMatching([command]).map((call) => call[2] as { cwd: string }),
  };
};
