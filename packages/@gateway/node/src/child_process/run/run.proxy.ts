import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable, Writable } from 'stream';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

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

// A caller composing this proxy for a program that takes an argument only known at test-run time
// (a resolved worktree path, a generated commit message) needs a tolerant element or a whole-array
// predicate, not just a literal. `mockArgValueMatchTransformer` (packages/testing) already treats a
// function ANYWHERE in a staged structure as a predicate over the corresponding actual value —
// `buildSpawnAddress` just pushes `args` into the staged tuple as-is, so widening this type from
// `string[]` changes no runtime behavior for the many existing callers that still pass a plain
// literal array; it only makes the wider shape typecheck too. Kept local (not imported from
// `#gateway/bin`'s own `ArgsMatcher`) because `@gateway/node` sits BELOW `@gateway/bin` in the
// gateway's own layering — importing upward would be backwards.
type SpawnArgsMatcher =
  readonly (string | ((value: unknown) => boolean))[] | ((args: readonly unknown[]) => boolean);

// `spawn(command, args, options)` is the real call this proxy mocks — one layer below `run` — so
// the address is built positionally: `command` alone (every existing caller's form, kept working),
// plus `args` and/or `cwd` when a caller passes them, addressing by EXACTLY the keys given (never a
// made-up default for the ones it doesn't). `args` given without `cwd` skips position 2 entirely, a
// prefix match; `cwd` given without `args` still has to fill position 1 to reach position 2, so it
// takes a permissive array predicate there rather than inventing an `args` value nobody staged.
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
    args?: SpawnArgsMatcher;
    cwd?: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    neverDrain?: boolean;
  }) => void;
  setupSignalKill: (params: {
    command: string;
    args?: SpawnArgsMatcher;
    cwd?: string;
    signal: NodeJS.Signals;
    stdout: string;
    stderr: string;
  }) => void;
  setupError: (params: {
    command: string;
    args?: SpawnArgsMatcher;
    cwd?: string;
    error: Error;
  }) => void;
  // The process never exits on its own — the mock only emits `exit` once its own `kill()` is
  // called, so a test proves the wrapper's OWN timeout timer is what triggers the kill, not just
  // that the mocked child happens to exit around the same time.
  setupHangsUntilKilled: (params: {
    command: string;
    args?: SpawnArgsMatcher;
    cwd?: string;
    signalOnKill: NodeJS.Signals;
  }) => void;
  getKillCallCount: (params: { command: string }) => number;
  // Every call's own `args` (spawn's 2nd positional argument), in call order, for calls whose
  // command matches — the same shape callers addressed by `{command, args}` staging need back to
  // assert exactly what ran.
  getCallsFor: (params: { command: string }) => readonly string[][];
  // Every call's own OPTIONS (spawn's 3rd positional argument) — `cwd` and `env`, exactly what
  // `run` builds them as — in call order, for calls whose command matches. `env` is what a caller
  // staging by `{command}` alone still needs read back: `run` builds it as
  // `{...process.env, ...env}`, so this is the only way a test proves which of its OWN keys
  // actually reached the child, short of asserting the whole of `process.env` alongside them.
  getOptionsFor: (params: {
    command: string;
  }) => readonly { cwd: string; env: Record<string, string> }[];
  // Every raw `spawn` call on this handle, whatever the command, as full `[command, args, options]`
  // tuples in call order. Reading stages nothing, so an unstaged spawn still throws: a test that
  // stages nothing and reads back `[]` proves no child was started through `spawn`.
  getAllSpawnCalls: () => RecordedCalls;
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
      args,
      cwd,
      exitCode,
      stdout,
      stderr,
      neverDrain,
    }: {
      command: string;
      args?: SpawnArgsMatcher;
      cwd?: string;
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
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() =>
          createMockChildFromConfig({ snapshot, killMock: buildKillMock({ command }) }),
        );
    },

    setupSignalKill: ({
      command,
      args,
      cwd,
      signal,
      stdout,
      stderr,
    }: {
      command: string;
      args?: SpawnArgsMatcher;
      cwd?: string;
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
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() =>
          createMockChildFromConfig({ snapshot, killMock: buildKillMock({ command }) }),
        );
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
      const snapshot: ProxyConfig = {
        exitCode: 0,
        signal: null,
        stdout: '',
        stderr: '',
        error,
        neverDrain: false,
      };
      handle
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() =>
          createMockChildFromConfig({ snapshot, killMock: buildKillMock({ command }) }),
        );
    },

    setupHangsUntilKilled: ({
      command,
      args,
      cwd,
      signalOnKill,
    }: {
      command: string;
      args?: SpawnArgsMatcher;
      cwd?: string;
      signalOnKill: NodeJS.Signals;
    }): void => {
      killCallCountByCommand.set(command, 0);
      handle
        .calledWith(
          buildSpawnAddress({
            command,
            ...(args === undefined ? {} : { args }),
            ...(cwd === undefined ? {} : { cwd }),
          }),
        )
        .implement(() => {
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

    getCallsFor: ({ command }: { command: string }): readonly string[][] =>
      handle.callsMatching([command]).map((call) => call[1] as string[]),

    getOptionsFor: ({
      command,
    }: {
      command: string;
    }): readonly { cwd: string; env: Record<string, string> }[] =>
      handle
        .callsMatching([command])
        .map((call) => call[2] as { cwd: string; env: Record<string, string> }),

    getAllSpawnCalls: (): RecordedCalls => handle.callsMatching([]),
  };
};
