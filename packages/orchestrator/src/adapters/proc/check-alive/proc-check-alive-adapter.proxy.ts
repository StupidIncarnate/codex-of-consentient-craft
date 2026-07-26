import { kill } from 'node:process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';

type ProcessPid = ReturnType<typeof ProcessPidStub>;

// kill(pid, 0) probes liveness with a no-op signal — the pid is the real, distinguishing
// argument every caller knows before it probes.
export const procCheckAliveAdapterProxy = (): {
  setupAlive: (params: { pid: ProcessPid }) => void;
  setupDead: (params: { pid: ProcessPid }) => void;
  setupPermissionDenied: (params: { pid: ProcessPid }) => void;
  setupUnknownError: (params: { pid: ProcessPid; error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: kill });

  return {
    setupAlive: ({ pid }: { pid: ProcessPid }): void => {
      mock.calledWith([pid, 0]).implement(() => true);
    },
    setupDead: ({ pid }: { pid: ProcessPid }): void => {
      mock.calledWith([pid, 0]).implement(() => {
        const error = new Error('kill ESRCH') as NodeJS.ErrnoException;
        error.code = 'ESRCH';
        throw error;
      });
    },
    setupPermissionDenied: ({ pid }: { pid: ProcessPid }): void => {
      mock.calledWith([pid, 0]).implement(() => {
        const error = new Error('kill EPERM') as NodeJS.ErrnoException;
        error.code = 'EPERM';
        throw error;
      });
    },
    setupUnknownError: ({ pid, error }: { pid: ProcessPid; error: Error }): void => {
      mock.calledWith([pid, 0]).implement(() => {
        throw error;
      });
    },
  };
};
