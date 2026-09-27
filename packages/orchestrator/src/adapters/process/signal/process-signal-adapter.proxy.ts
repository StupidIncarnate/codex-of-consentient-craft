import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';

type ProcessPid = ReturnType<typeof ProcessPidStub>;

// `processSignalAdapter` calls the BARE global `process.kill`, never an imported binding, so this
// stages it with `registerSpyOn({ object: process, method: 'kill' })` (T2's own worked example for
// this exact call shape) rather than `registerMock`, which addresses an imported function.
export const processSignalAdapterProxy = (): {
  setupAlive: (params: { pid: ProcessPid }) => void;
  setupDead: (params: { pid: ProcessPid }) => void;
} => {
  const handle: SpyOnHandle = registerSpyOn({ object: process, method: 'kill' });

  return {
    setupAlive: ({ pid }: { pid: ProcessPid }): void => {
      handle.calledWith([pid, 0]).implement(() => true);
    },
    setupDead: ({ pid }: { pid: ProcessPid }): void => {
      handle.calledWith([pid, 0]).implement(() => {
        const error = new Error('kill ESRCH') as NodeJS.ErrnoException;
        error.code = 'ESRCH';
        throw error;
      });
    },
  };
};
