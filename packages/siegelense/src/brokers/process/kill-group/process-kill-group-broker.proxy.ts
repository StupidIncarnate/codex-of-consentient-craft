import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { killProxy } from '#gateway/node/process/kill/kill.proxy';


type ProcessGroupId = number;

const PROBE_SIGNAL = 0;

// Every signal is staged through `killProxy`, addressed by the negated pgid and the signal — the
// exact `[pid, signal]` tuple `kill` forwards.
export const processKillGroupBrokerProxy = (): {
  // `onSent` runs as the signal lands — how a caller's test orders this call against a
  // different boundary (lane teardown's kill-before-close).
  setupSent: (params: {
    pgid: ProcessGroupId;
    signal: NodeJS.Signals;
    onSent?: () => void;
  }) => void;
  setupAlreadyGone: (params: { pgid: ProcessGroupId; signal: NodeJS.Signals }) => void;
  // The signal fails EPERM — a group owned by another user, a real failure this broker rethrows.
  setupPermissionDenied: (params: { pgid: ProcessGroupId; signal: NodeJS.Signals }) => void;
  // The signals sent to the NEGATED pgid, in call order. `kill` is shared with
  // `processIsAliveBroker`'s liveness probe, so probe calls (signal `0`) are left out.
  getCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
} => {
  isFsErrorProxy();
  const kill = killProxy();

  return {
    setupSent: ({
      pgid,
      signal,
      onSent,
    }: {
      pgid: ProcessGroupId;
      signal: NodeJS.Signals;
      onSent?: () => void;
    }): void => {
      kill.setupSent({
        pid: -Number(pgid),
        signal,
        ...(onSent === undefined ? {} : { onSent }),
      });
    },

    setupAlreadyGone: ({
      pgid,
      signal,
    }: {
      pgid: ProcessGroupId;
      signal: NodeJS.Signals;
    }): void => {
      kill.setupNotFound({ pid: -Number(pgid), signal });
    },

    setupPermissionDenied: ({
      pgid,
      signal,
    }: {
      pgid: ProcessGroupId;
      signal: NodeJS.Signals;
    }): void => {
      kill.setupPermissionDenied({ pid: -Number(pgid), signal });
    },

    getCallsFor: ({ pgid }: { pgid: ProcessGroupId }): unknown[] =>
      kill
        .getCallsFor({ pid: -Number(pgid) })
        .map((call) => call[1])
        .filter((signal) => signal !== PROBE_SIGNAL),
  };
};
