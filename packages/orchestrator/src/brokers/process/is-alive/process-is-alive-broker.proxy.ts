import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { killProxy } from '#gateway/node/process/kill/kill.proxy';

type ProcessPid = number;

const PROBE_SIGNAL = 0;

// Every probe is staged through `killProxy`, addressed by the pid and the probe signal — the exact
// `[pid, signal]` tuple `kill` forwards.
export const processIsAliveBrokerProxy = (): {
  setupAlive: (params: { pid: ProcessPid }) => void;
  setupDead: (params: { pid: ProcessPid }) => void;
  setupPermissionDenied: (params: { pid: ProcessPid }) => void;
  // The probe fails with a code this broker reads as neither alive nor dead: the recorded EINVAL.
  setupUnrecognisedFailure: (params: { pid: ProcessPid }) => void;
} => {
  isFsErrorProxy();
  const kill = killProxy();

  return {
    setupAlive: ({ pid }: { pid: ProcessPid }): void => {
      kill.setupSent({ pid, signal: PROBE_SIGNAL });
    },
    setupDead: ({ pid }: { pid: ProcessPid }): void => {
      kill.setupNotFound({ pid, signal: PROBE_SIGNAL });
    },
    setupPermissionDenied: ({ pid }: { pid: ProcessPid }): void => {
      kill.setupPermissionDenied({ pid, signal: PROBE_SIGNAL });
    },
    setupUnrecognisedFailure: ({ pid }: { pid: ProcessPid }): void => {
      kill.setupInvalidSignal({ pid, signal: PROBE_SIGNAL });
    },
  };
};
