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
  setupChildFactory: (params: { command: string; create: () => ChildProcess }) => void;
  setupChildFactoryOnce: (params: { command: string; create: () => ChildProcess }) => void;
  setupSpawnThrows: (params: { command: string; error: Error }) => void;
  setupSpawnThrowsOnce: (params: { command: string; error: Error }) => void;
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

    // Sticky: every spawn of `command` gets whatever `create` builds at spawn time.
    setupChildFactory: ({
      command,
      create,
    }: {
      command: string;
      create: () => ChildProcess;
    }): void => {
      handle.calledWith([command]).implement(create);
    },

    // One-shot: the next spawn of `command` only; it outranks a sticky factory for the same command.
    setupChildFactoryOnce: ({
      command,
      create,
    }: {
      command: string;
      create: () => ChildProcess;
    }): void => {
      handle.onceFor([command]).implement(create);
    },

    setupSpawnThrows: ({ command, error }: { command: string; error: Error }): void => {
      handle.calledWith([command]).throws(error);
    },

    setupSpawnThrowsOnce: ({ command, error }: { command: string; error: Error }): void => {
      handle.onceFor([command]).throws(error);
    },

    getSpawnedOptions: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[2],

    getCallsFor: ({ command }: { command: string }): readonly unknown[][] =>
      handle.callsMatching([command]),

    captureStderrWrites: (): string[] =>
      stderrWriteSpy.callsMatching([]).map((call) => String(call[0])),
  };
};
