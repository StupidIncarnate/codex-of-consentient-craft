import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { killProxy } from '#gateway/node/process/kill/kill.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

const PROBE_SIGNAL = 0;

// `kill` is a near-passthrough over `process.kill`, so the probe is staged on the global it calls
// — the same spy `killProxy` owns — addressed by the negated pgid and the probe signal.
export const processIsAliveBrokerProxy = (): {
  setupAlive: (params: { pgid: ProcessGroupId }) => void;
  setupGone: (params: { pgid: ProcessGroupId }) => void;
  // Alive at the first probe, gone (ESRCH) at the second — a group that exits between two checks.
  setupAliveThenGone: (params: { pgid: ProcessGroupId }) => void;
  // `error` stays `unknown` rather than `Error` — a test proving realm-safety stages a value built
  // by `vm.runInNewContext`, which this repo's own Error is not the constructor of.
  setupUnknownError: (params: { pgid: ProcessGroupId; error: unknown }) => void;
  getCallFor: (params: { pgid: ProcessGroupId }) => unknown;
} => {
  isFsErrorProxy();
  killProxy();
  const handle = registerSpyOn({ object: process, method: 'kill' });

  return {
    setupAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      handle.calledWith([-Number(pgid), PROBE_SIGNAL]).returns(true);
    },

    setupGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      handle
        .calledWith([-Number(pgid), PROBE_SIGNAL])
        .throws(FsErrorStub({ code: 'ESRCH', syscall: 'kill' }));
    },

    setupAliveThenGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      handle.onceFor([-Number(pgid), PROBE_SIGNAL]).returns(true);
      handle
        .onceFor([-Number(pgid), PROBE_SIGNAL])
        .throws(FsErrorStub({ code: 'ESRCH', syscall: 'kill' }));
    },

    setupUnknownError: ({ pgid, error }: { pgid: ProcessGroupId; error: unknown }): void => {
      handle.calledWith([-Number(pgid), PROBE_SIGNAL]).implement(() => {
        throw error;
      });
    },

    getCallFor: ({ pgid }: { pgid: ProcessGroupId }): unknown =>
      handle.callsMatching([-Number(pgid), PROBE_SIGNAL]).at(-1),
  };
};
