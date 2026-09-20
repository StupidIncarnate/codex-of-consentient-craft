import { spawn, type ChildProcess } from 'child_process';
import { processIdContract, type ProcessId } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const childProcessSpawnDetachedAdapterProxy = (): {
  succeeds: (params: { command: string; args: string[]; pid: number }) => void;
  succeedsWithNoPid: (params: { command: string; args: string[] }) => void;
  // Reads the options object (3rd arg) the LAST matching call actually passed, so a test can
  // assert the whole shape with toStrictEqual — "spawn was called" alone is the false positive
  // this adapter exists to avoid.
  getOptionsFor: (params: { command: string; args: string[] }) => unknown;
  // Every pid whose spawned handle was unref'd, in call order. The fake child MUST carry a real
  // `unref`: a stand-in without one makes the adapter throw `child.unref is not a function`, which
  // reads as a broken adapter rather than as a stale proxy.
  unrefedPids: () => ProcessId[];
} => {
  const handle: MockHandle = registerMock({ fn: spawn });
  const unrefed: ProcessId[] = [];

  return {
    succeeds: ({ command, args, pid }: { command: string; args: string[]; pid: number }): void => {
      handle.calledWith([command, args]).implement(
        () =>
          ({
            pid,
            unref: (): void => {
              unrefed.push(processIdContract.parse(String(pid)));
            },
          }) as unknown as ChildProcess,
      );
    },

    unrefedPids: (): ProcessId[] => unrefed,

    succeedsWithNoPid: ({ command, args }: { command: string; args: string[] }): void => {
      handle.calledWith([command, args]).implement(() => ({ pid: undefined }) as ChildProcess);
    },

    getOptionsFor: ({ command, args }: { command: string; args: string[] }): unknown =>
      handle.callsMatching([command, args]).at(-1)?.[2],
  };
};
