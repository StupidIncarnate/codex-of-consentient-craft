import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

import { childProcessSpawnAdapterProxy } from '../../../adapters/child-process/spawn/child-process-spawn-adapter.proxy';

export const devServerStopBrokerProxy = (): {
  makeProcessThatExitsOnSigterm: () => ChildProcess;
  makeProcessThatIgnoresSigterm: () => ChildProcess;
  makeProcessWhereKillThrows: () => ChildProcess;
  getKillCalls: (proc: ChildProcess) => unknown[][];
} => {
  childProcessSpawnAdapterProxy();

  return {
    makeProcessThatExitsOnSigterm: (): ChildProcess => {
      const emitter = new EventEmitter();
      const proc = emitter as unknown as ChildProcess;
      proc.kill = jest.fn((signal) => {
        if (signal === 'SIGTERM' || signal === undefined) {
          setImmediate(() => {
            emitter.emit('close', 0);
          });
        }
        return true;
      });
      return proc;
    },

    makeProcessThatIgnoresSigterm: (): ChildProcess => {
      const emitter = new EventEmitter();
      const proc = emitter as unknown as ChildProcess;
      proc.kill = jest.fn(() => true);
      return proc;
    },

    makeProcessWhereKillThrows: (): ChildProcess => {
      const emitter = new EventEmitter();
      const proc = emitter as unknown as ChildProcess;
      proc.kill = jest.fn(() => {
        throw new Error('kill failed');
      });
      return proc;
    },

    getKillCalls: (proc: ChildProcess): unknown[][] =>
      (proc.kill as unknown as jest.Mock).mock.calls,
  };
};
