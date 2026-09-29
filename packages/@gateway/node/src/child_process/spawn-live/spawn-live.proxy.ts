import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

const createMockChild = (): ChildProcess => {
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
  child.kill = ((): boolean => true) as ChildProcess['kill'];
  return child;
};

export const spawnLiveProxy = (): {
  setupSuccess: (params: { command: string }) => ChildProcess;
  setupNullStdout: (params: { command: string }) => void;
  setupSpawnError: (params: { command: string; error: Error }) => ChildProcess;
  getSpawnedOptions: (params: { command: string }) => unknown;
  getCallsFor: (params: { command: string }) => readonly unknown[][];
  captureStderrWrites: () => string[];
} => {
  const handle = registerMock({ fn: spawn });
  const stderrWriteSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrWriteSpy.calledWith([]).returns(true);

  return {
    setupSuccess: ({ command }: { command: string }): ChildProcess => {
      const child = createMockChild();
      handle.calledWith([command]).implement(() => child);
      return child;
    },

    setupNullStdout: ({ command }: { command: string }): void => {
      handle.calledWith([command]).implement(() => {
        const child = new EventEmitter() as ChildProcess;
        child.stdout = null;
        child.stderr = null;
        child.kill = ((): boolean => true) as ChildProcess['kill'];
        return child;
      });
    },

    setupSpawnError: ({ command, error }: { command: string; error: Error }): ChildProcess => {
      const child = createMockChild();
      handle.calledWith([command]).implement(() => child);
      setImmediate(() => {
        child.emit('error', error);
      });
      return child;
    },

    getSpawnedOptions: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[2],

    getCallsFor: ({ command }: { command: string }): readonly unknown[][] =>
      handle.callsMatching([command]),

    captureStderrWrites: (): string[] =>
      stderrWriteSpy.callsMatching([]).map((call) => String(call[0])),
  };
};
