import { exec, type ChildProcess } from 'child_process';
import { EventEmitter } from 'stream';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const runFireAndForgetProxy = (): {
  setupSuccess: (params: { command: string }) => void;
  setupSpawnError: (params: { command: string; error: Error }) => void;
  captureStderrWrites: () => string[];
} => {
  const handle = registerMock({ fn: exec });
  const stderrWriteSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrWriteSpy.calledWith([]).returns(true);

  return {
    setupSuccess: ({ command }: { command: string }): void => {
      handle.calledWith([command]).implement(() => new EventEmitter() as ChildProcess);
    },

    setupSpawnError: ({ command, error }: { command: string; error: Error }): void => {
      handle.calledWith([command]).implement(() => {
        const child = new EventEmitter() as ChildProcess;
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
