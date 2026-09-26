import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'stream';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const spawnLongLivedProxy = (): {
  setupSuccess: (params: { command: string }) => { killMock: () => number };
  setupSpawnError: (params: { command: string; error: Error }) => void;
  captureStderrWrites: () => string[];
} => {
  const handle = registerMock({ fn: spawn });
  const stderrWriteSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrWriteSpy.calledWith([]).returns(true);

  return {
    setupSuccess: ({ command }: { command: string }): { killMock: () => number } => {
      const killCallCount = { total: 0 };
      handle.calledWith([command]).implement(() => {
        const child = new EventEmitter() as ChildProcess;
        child.killed = false;
        child.kill = ((): boolean => {
          killCallCount.total += 1;
          child.killed = true;
          return true;
        }) as ChildProcess['kill'];
        return child;
      });
      return { killMock: (): number => killCallCount.total };
    },

    setupSpawnError: ({ command, error }: { command: string; error: Error }): void => {
      handle.calledWith([command]).implement(() => {
        const child = new EventEmitter() as ChildProcess;
        child.killed = false;
        child.kill = ((): boolean => true) as ChildProcess['kill'];
        setImmediate(() => {
          child.emit('error', error);
        });
        return child;
      });
    },

    captureStderrWrites: (): string[] =>
      stderrWriteSpy.callsMatching([]).map((call) => String(call[0])),
  };
};
