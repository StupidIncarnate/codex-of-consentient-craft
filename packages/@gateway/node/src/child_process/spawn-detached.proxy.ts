import { spawn, type ChildProcess } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const spawnDetachedProxy = (): {
  setupSuccess: (params: { command: string; pid: number }) => void;
  setupNoPid: (params: { command: string }) => void;
  getSpawnedOptions: (params: { command: string }) => unknown;
} => {
  const handle = registerMock({ fn: spawn });

  return {
    setupSuccess: ({ command, pid }: { command: string; pid: number }): void => {
      handle.calledWith([command]).implement(
        () =>
          ({
            pid,
            unref: (): void => undefined,
          }) as unknown as ChildProcess,
      );
    },

    setupNoPid: ({ command }: { command: string }): void => {
      handle.calledWith([command]).implement(
        () =>
          ({
            pid: undefined,
            unref: (): void => undefined,
          }) as unknown as ChildProcess,
      );
    },

    getSpawnedOptions: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[2],
  };
};
