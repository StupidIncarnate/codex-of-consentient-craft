import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'stream';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

// `ChildProcess.killed` is declared readonly, so a fake built by casting straight to `ChildProcess`
// can never assign it (TS2540). This interface keeps `killed`/`kill` writable on the fake itself;
// only the return value is cast to `ChildProcess`, which TypeScript allows because every one of
// `MockChild`'s own members is already assignable from a real `ChildProcess`.
interface MockChild extends EventEmitter {
  killed: boolean;
  kill: ChildProcess['kill'];
}

export const spawnLongLivedProxy = (): {
  setupSuccess: (params: { command: string }) => { killMock: () => number };
  setupSpawnError: (params: { command: string; error: Error }) => void;
  getCallsFor: (params: { command: string }) => readonly unknown[][];
  captureStderrWrites: () => string[];
} => {
  const handle = registerMock({ fn: spawn });
  const stderrWriteSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrWriteSpy.calledWith([]).returns(true);

  return {
    setupSuccess: ({ command }: { command: string }): { killMock: () => number } => {
      const killCallCount = { total: 0 };
      handle.calledWith([command]).implement((): ChildProcess => {
        const child = new EventEmitter() as MockChild;
        child.killed = false;
        child.kill = ((): boolean => {
          killCallCount.total += 1;
          child.killed = true;
          return true;
        }) as ChildProcess['kill'];
        return child as ChildProcess;
      });
      return { killMock: (): number => killCallCount.total };
    },

    setupSpawnError: ({ command, error }: { command: string; error: Error }): void => {
      handle.calledWith([command]).implement((): ChildProcess => {
        const child = new EventEmitter() as MockChild;
        child.killed = false;
        child.kill = ((): boolean => true) as ChildProcess['kill'];
        setImmediate(() => {
          child.emit('error', error);
        });
        return child as ChildProcess;
      });
    },

    getCallsFor: ({ command }: { command: string }): readonly unknown[][] =>
      handle.callsMatching([command]),

    captureStderrWrites: (): string[] =>
      stderrWriteSpy.callsMatching([]).map((call) => String(call[0])),
  };
};
