import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { killProxy } from '#gateway/node/process/kill/kill.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { ProcessPidStub } from '../../../contracts/process-pid/process-pid.stub';

type ProcessPid = ReturnType<typeof ProcessPidStub>;

const PROBE_SIGNAL = 0;

// `kill` is a near-passthrough over `process.kill`, so the probe is staged on the global it calls
// — the same spy `killProxy` owns — addressed by the pid and the probe signal every caller knows.
export const processIsAliveBrokerProxy = (): {
  setupAlive: (params: { pid: ProcessPid }) => void;
  setupDead: (params: { pid: ProcessPid }) => void;
  setupPermissionDenied: (params: { pid: ProcessPid }) => void;
  setupUnknownError: (params: { pid: ProcessPid; error: Error }) => void;
} => {
  isFsErrorProxy();
  killProxy();
  const handle = registerSpyOn({ object: process, method: 'kill' });

  return {
    setupAlive: ({ pid }: { pid: ProcessPid }): void => {
      handle.calledWith([pid, PROBE_SIGNAL]).returns(true);
    },
    setupDead: ({ pid }: { pid: ProcessPid }): void => {
      handle
        .calledWith([pid, PROBE_SIGNAL])
        .throws(FsErrorStub({ code: 'ESRCH', syscall: 'kill' }));
    },
    setupPermissionDenied: ({ pid }: { pid: ProcessPid }): void => {
      handle
        .calledWith([pid, PROBE_SIGNAL])
        .throws(FsErrorStub({ code: 'EPERM', syscall: 'kill' }));
    },
    setupUnknownError: ({ pid, error }: { pid: ProcessPid; error: Error }): void => {
      handle.calledWith([pid, PROBE_SIGNAL]).throws(error);
    },
  };
};
