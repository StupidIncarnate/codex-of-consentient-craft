import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { ProcessKillRecordedErrorStub } from './process-kill-recorded-error.stub';

type KillSignal = NodeJS.Signals | number | undefined;

// `kill` is a near-passthrough over the `process.kill` global, so every stage sits on that global,
// addressed by the exact `[pid, signal]` tuple `kill` forwards — a probe (`0`) and a real signal to
// the same pid stage apart. `signal` is required here even though `kill` makes it optional: `kill`
// always forwards both positions, so an omitted signal arrives as `undefined` and is staged as one.
export const killProxy = (): {
  // `onSent` runs as the signal lands — how a caller's test orders this call against another boundary.
  setupSent: (params: { pid: number; signal: KillSignal; onSent?: () => void }) => void;
  setupNotFound: (params: { pid: number; signal: KillSignal }) => void;
  setupPermissionDenied: (params: { pid: number; signal: KillSignal }) => void;
  setupInvalidSignal: (params: { pid: number; signal: KillSignal }) => void;
  // Lands once, then answers ESRCH — a process that exits between two signals.
  setupSentThenNotFound: (params: { pid: number; signal: KillSignal }) => void;
  // Every call's full `[pid, signal]` tuple for this pid, in call order.
  getCallsFor: (params: { pid: number }) => readonly unknown[][];
} => {
  const handle = registerSpyOn({ object: process, method: 'kill' });

  return {
    setupSent: ({
      pid,
      signal,
      onSent,
    }: {
      pid: number;
      signal: KillSignal;
      onSent?: () => void;
    }): void => {
      handle.calledWith([pid, signal]).implement(() => {
        onSent?.();
        return true;
      });
    },

    setupNotFound: ({ pid, signal }: { pid: number; signal: KillSignal }): void => {
      handle.calledWith([pid, signal]).throws(ProcessKillRecordedErrorStub({ code: 'ESRCH' }));
    },

    setupPermissionDenied: ({ pid, signal }: { pid: number; signal: KillSignal }): void => {
      handle.calledWith([pid, signal]).throws(ProcessKillRecordedErrorStub({ code: 'EPERM' }));
    },

    setupInvalidSignal: ({ pid, signal }: { pid: number; signal: KillSignal }): void => {
      handle.calledWith([pid, signal]).throws(ProcessKillRecordedErrorStub({ code: 'EINVAL' }));
    },

    setupSentThenNotFound: ({ pid, signal }: { pid: number; signal: KillSignal }): void => {
      handle.onceFor([pid, signal]).returns(true);
      handle.onceFor([pid, signal]).throws(ProcessKillRecordedErrorStub({ code: 'ESRCH' }));
    },

    getCallsFor: ({ pid }: { pid: number }): readonly unknown[][] => handle.callsMatching([pid]),
  };
};
