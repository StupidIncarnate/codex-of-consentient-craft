import { spawn } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { ChildProcessStub } from '../child-process/child-process.stub';

// The same tolerant `args` shape `run.proxy.ts` and `stream-lines.proxy.ts` declare — a literal
// array, an array holding per-element predicates, or one whole-array predicate — kept local for the
// reason those files give: no shared home crosses `@gateway/node`'s wrapper folders.
type SpawnArgsMatcher =
  readonly (string | ((value: unknown) => boolean))[] | ((args: readonly unknown[]) => boolean);

// `spawn(command, args, options)` is the real call this proxy mocks. `spawnDetached` always passes
// all three, so every stage and every read-back addresses by `command`, `args` and `options.cwd`
// together — two detached spawns of one binary (npm with two different scripts) stage apart.
const buildSpawnAddress = ({
  command,
  args,
  cwd,
}: {
  command: string;
  args: SpawnArgsMatcher;
  cwd: string;
}): unknown[] => [command, args, { cwd }];

export const spawnDetachedProxy = (): {
  setupSuccess: (params: {
    command: string;
    args: SpawnArgsMatcher;
    cwd: string;
    pid: number;
  }) => void;
  setupNoPid: (params: { command: string; args: SpawnArgsMatcher; cwd: string }) => void;
  // The OPTIONS (spawn's 3rd argument) of every call matching this address, in call order.
  getSpawnedOptions: (params: {
    command: string;
    args: SpawnArgsMatcher;
    cwd: string;
  }) => readonly unknown[];
  // Every call's full `[command, args, options]` tuple for this command, in call order.
  getCallsFor: (params: { command: string }) => readonly unknown[][];
} => {
  const handle = registerMock({ fn: spawn });

  return {
    // `ChildProcessStub` leaves `pid` at its real default (undefined, readonly in @types/node)
    // until a real spawn assigns it. `Object.assign` (unlike a direct property write) is not
    // checked against a readonly target field, so it stages a specific pid onto the real instance
    // instead of forcing a partial fake through a cast.
    setupSuccess: ({
      command,
      args,
      cwd,
      pid,
    }: {
      command: string;
      args: SpawnArgsMatcher;
      cwd: string;
      pid: number;
    }): void => {
      handle
        .calledWith(buildSpawnAddress({ command, args, cwd }))
        .implement(() => Object.assign(ChildProcessStub(), { pid }));
    },

    setupNoPid: ({
      command,
      args,
      cwd,
    }: {
      command: string;
      args: SpawnArgsMatcher;
      cwd: string;
    }): void => {
      handle
        .calledWith(buildSpawnAddress({ command, args, cwd }))
        .implement(() => ChildProcessStub());
    },

    getSpawnedOptions: ({
      command,
      args,
      cwd,
    }: {
      command: string;
      args: SpawnArgsMatcher;
      cwd: string;
    }): readonly unknown[] =>
      handle.callsMatching(buildSpawnAddress({ command, args, cwd })).map((call) => call[2]),

    getCallsFor: ({ command }: { command: string }): readonly unknown[][] =>
      handle.callsMatching([command]),
  };
};
