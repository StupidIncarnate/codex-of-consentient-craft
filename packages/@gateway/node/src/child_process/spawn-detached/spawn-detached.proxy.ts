import { spawn } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { ChildProcessStub } from '../child-process/child-process.stub';

export const spawnDetachedProxy = (): {
  setupSuccess: (params: { command: string; pid: number }) => void;
  setupNoPid: (params: { command: string }) => void;
  getSpawnedOptions: (params: { command: string }) => unknown;
} => {
  const handle = registerMock({ fn: spawn });

  return {
    // `ChildProcessStub` leaves `pid` at its real default (undefined, readonly in @types/node)
    // until a real spawn assigns it. `Object.assign` (unlike a direct property write) is not
    // checked against a readonly target field, so it stages a specific pid onto the real instance
    // instead of forcing a partial fake through `as unknown as`.
    setupSuccess: ({ command, pid }: { command: string; pid: number }): void => {
      handle.calledWith([command]).implement(() => Object.assign(ChildProcessStub(), { pid }));
    },

    setupNoPid: ({ command }: { command: string }): void => {
      handle.calledWith([command]).implement(() => ChildProcessStub());
    },

    getSpawnedOptions: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[2],
  };
};
