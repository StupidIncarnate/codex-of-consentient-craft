import { spawn, type ChildProcess } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const childProcessSpawnDetachedAdapterProxy = (): {
  succeeds: (params: { command: string; args: string[]; pid: number }) => void;
  succeedsWithNoPid: (params: { command: string; args: string[] }) => void;
  // Reads the options object (3rd arg) the LAST matching call actually passed, so a test can
  // assert the whole shape with toStrictEqual — "spawn was called" alone is the false positive
  // this adapter exists to avoid.
  getOptionsFor: (params: { command: string; args: string[] }) => unknown;
} => {
  const handle: MockHandle = registerMock({ fn: spawn });

  return {
    succeeds: ({ command, args, pid }: { command: string; args: string[]; pid: number }): void => {
      handle.calledWith([command, args]).implement(() => ({ pid }) as ChildProcess);
    },

    succeedsWithNoPid: ({ command, args }: { command: string; args: string[] }): void => {
      handle.calledWith([command, args]).implement(() => ({ pid: undefined }) as ChildProcess);
    },

    getOptionsFor: ({ command, args }: { command: string; args: string[] }): unknown =>
      handle.callsMatching([command, args]).at(-1)?.[2],
  };
};
