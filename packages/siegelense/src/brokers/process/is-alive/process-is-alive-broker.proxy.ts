import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { killProxy } from '#gateway/node/process/kill/kill.proxy';

type ProcessGroupId = number;

const PROBE_SIGNAL = 0;

// Every probe is staged through `killProxy`, addressed by the negated pgid and the probe signal —
// the exact `[pid, signal]` tuple `kill` forwards — so a real signal to the same group stages apart.
export const processIsAliveBrokerProxy = (): {
  setupAlive: (params: { pgid: ProcessGroupId }) => void;
  setupGone: (params: { pgid: ProcessGroupId }) => void;
  // Alive at the first probe, gone (ESRCH) at the second — a group that exits between two checks.
  setupAliveThenGone: (params: { pgid: ProcessGroupId }) => void;
  // The probe fails EPERM — a group owned by another user, which this broker does not read as gone.
  setupPermissionDenied: (params: { pgid: ProcessGroupId }) => void;
  getCallFor: (params: { pgid: ProcessGroupId }) => unknown;
} => {
  isFsErrorProxy();
  const kill = killProxy();

  return {
    setupAlive: ({ pgid }: { pgid: ProcessGroupId }): void => {
      kill.setupSent({ pid: -pgid, signal: PROBE_SIGNAL });
    },

    setupGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      kill.setupNotFound({ pid: -pgid, signal: PROBE_SIGNAL });
    },

    setupAliveThenGone: ({ pgid }: { pgid: ProcessGroupId }): void => {
      kill.setupSentThenNotFound({ pid: -pgid, signal: PROBE_SIGNAL });
    },

    setupPermissionDenied: ({ pgid }: { pgid: ProcessGroupId }): void => {
      kill.setupPermissionDenied({ pid: -pgid, signal: PROBE_SIGNAL });
    },

    getCallFor: ({ pgid }: { pgid: ProcessGroupId }): unknown =>
      kill
        .getCallsFor({ pid: -pgid })
        .filter((call) => call[1] === PROBE_SIGNAL)
        .at(-1),
  };
};
