import { PassThrough } from 'stream';
import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';
import { spawn, type ChildProcess } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null) => void;

export const childProcessSpawnStreamLinesAdapterProxy = (): {
  setupSuccess: (params: {
    command: string;
    exitCode: ExitCode;
    stdoutLines: string[];
    stderrChunks?: string[];
  }) => void;
  setupError: (params: { command: string; error: Error }) => void;
  getSpawnedCommand: (params: { command: string }) => unknown;
  getSpawnedArgs: (params: { command: string }) => unknown;
  getSpawnedCwd: (params: { command: string }) => unknown;
} => {
  const handle = registerMock({ fn: spawn });

  return {
    setupSuccess: ({
      command,
      exitCode,
      stdoutLines,
      stderrChunks,
    }: {
      command: string;
      exitCode: ExitCode;
      stdoutLines: string[];
      stderrChunks?: string[];
    }): void => {
      const successCode = ExitCodeStub({ value: 0 });
      handle.calledWith([command]).implement(() => {
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

    setupError: ({ command, error }: { command: string; error: Error }): void => {
      handle.calledWith([command]).implement(() => {
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
  };
};
