import { spawn, type ChildProcess } from 'child_process';
import { PassThrough } from 'stream';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null, signal: NodeJS.Signals | null) => void;

// A caller composing this proxy for a program that takes an argument only known at test-run time
// needs a tolerant element or a whole-array predicate, not just a literal — the identical shape
// `run.proxy.ts` declares for its own `SpawnArgsMatcher`. Kept local rather than imported: this
// file and `run.proxy.ts` are sibling gateway-wrapper folders, and `run.proxy.ts`'s own comment
// explains why ITS copy stays local (no shared home crosses `@gateway/node`'s wrapper folders);
// the same reasoning keeps this one local too.
type SpawnArgsMatcher =
  readonly (string | ((value: unknown) => boolean))[] | ((args: readonly unknown[]) => boolean);

// `spawn(command, args, options)` is the real call this proxy mocks. Same address-building shape
// as `run.proxy.ts`'s own `buildSpawnAddress`: `command` alone by default, `args` and/or `cwd`
// layered in only when a caller passes them — which is what lets two callers of the SAME binary
// (`streamLines` and `run` share this one raw `spawn` mock) stage apart by whichever they give.
const buildSpawnAddress = ({
  command,
  args,
  cwd,
}: {
  command: string;
  args?: SpawnArgsMatcher;
  cwd?: string;
}): unknown[] => {
  const address: unknown[] = [command];

  if (args !== undefined) {
    address.push(args);
  } else if (cwd !== undefined) {
    address.push((value: unknown): boolean => Array.isArray(value));
  }

  if (cwd !== undefined) {
    address.push({ cwd });
  }

  return address;
};

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
  setupSuccess: (params: {
    command: string;
    args?: SpawnArgsMatcher;
    cwd?: string;
    exitCode: number;
    stdoutLines: string[];
  }) => void;
  setupSignalKill: (params: {
    command: string;
    args?: SpawnArgsMatcher;
    cwd?: string;
    signal: NodeJS.Signals;
  }) => void;
  setupStderrOnly: (params: {
    command: string;
    args?: SpawnArgsMatcher;
    cwd?: string;
    exitCode: number;
    stderrChunks: string[];
  }) => void;
  setupError: (params: {
    command: string;
    args?: SpawnArgsMatcher;
    cwd?: string;
    error: Error;
  }) => void;
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
      args,
      cwd,
      exitCode,
      stdoutLines,
    }: {
      command: string;
      args?: SpawnArgsMatcher;
      cwd?: string;
      exitCode: number;
      stdoutLines: string[];
    }): void => {
      handle
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() => {
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

    setupSignalKill: ({
      command,
      args,
      cwd,
      signal,
    }: {
      command: string;
      args?: SpawnArgsMatcher;
      cwd?: string;
      signal: NodeJS.Signals;
    }): void => {
      handle
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() => {
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
      args,
      cwd,
      exitCode,
      stderrChunks,
    }: {
      command: string;
      args?: SpawnArgsMatcher;
      cwd?: string;
      exitCode: number;
      stderrChunks: string[];
    }): void => {
      handle
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() => {
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

    setupError: ({
      command,
      args,
      cwd,
      error,
    }: {
      command: string;
      args?: SpawnArgsMatcher;
      cwd?: string;
      error: Error;
    }): void => {
      handle
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() => {
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
