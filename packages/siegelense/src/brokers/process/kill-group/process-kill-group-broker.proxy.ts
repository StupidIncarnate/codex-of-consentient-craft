import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { isFsErrorProxy } from '#gateway/node/fs/is-fs-error/is-fs-error.proxy';
import { killProxy } from '#gateway/node/process/kill/kill.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

type ProcessGroupId = ReturnType<typeof ProcessGroupIdStub>;

const PROBE_SIGNAL = 0;

// `kill` is a near-passthrough over `process.kill`, so each signal is staged on the global it
// calls — the same spy `killProxy` owns — addressed by the negated pgid and the signal.
export const processKillGroupBrokerProxy = (): {
  // `onSent` runs as the signal lands — how a caller's test orders this call against a
  // different boundary (lane teardown's kill-before-close).
  setupSent: (params: {
    pgid: ProcessGroupId;
    signal: NodeJS.Signals;
    onSent?: () => void;
  }) => void;
  setupAlreadyGone: (params: { pgid: ProcessGroupId; signal: NodeJS.Signals }) => void;
  // `error` stays `unknown` rather than `Error` — a test proving realm-safety stages a value built
  // by `vm.runInNewContext`, which this repo's own Error is not the constructor of.
  setupUnknownError: (params: {
    pgid: ProcessGroupId;
    signal: NodeJS.Signals;
    error: unknown;
  }) => void;
  // The signals sent to the NEGATED pgid, in call order. The `process.kill` spy is shared with
  // `processIsAliveBroker`'s liveness probe, so probe calls (signal `0`) are left out.
  getCallsFor: (params: { pgid: ProcessGroupId }) => unknown[];
} => {
  isFsErrorProxy();
  killProxy();
  const handle = registerSpyOn({ object: process, method: 'kill' });

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
      handle.calledWith([-Number(pgid), signal]).implement(() => {
        onSent?.();
        return true;
      });
    },

    setupAlreadyGone: ({
      pgid,
      signal,
    }: {
      pgid: ProcessGroupId;
      signal: NodeJS.Signals;
    }): void => {
      handle
        .calledWith([-Number(pgid), signal])
        .throws(FsErrorStub({ code: 'ESRCH', syscall: 'kill' }));
    },

    setupUnknownError: ({
      pgid,
      signal,
      error,
    }: {
      pgid: ProcessGroupId;
      signal: NodeJS.Signals;
      error: unknown;
    }): void => {
      handle.calledWith([-Number(pgid), signal]).implement(() => {
        throw error;
      });
    },

    getCallsFor: ({ pgid }: { pgid: ProcessGroupId }): unknown[] =>
      handle
        .callsMatching([-Number(pgid)])
        .map((call) => call[1])
        .filter((signal) => signal !== PROBE_SIGNAL),
  };
};
