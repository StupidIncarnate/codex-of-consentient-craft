import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { TimeoutStub } from '../timeout/timeout.stub';

const isCallback = (value: unknown): boolean => typeof value === 'function';

export const setTimeoutProxy = (): {
  setupFiresImmediately: (params: { ms: number }) => void;
  setupNeverFires: (params: { ms: number }) => void;
  getCallsFor: (params: { ms: number }) => RecordedCalls;
} => {
  // Built before the spy exists: TimeoutStub arms a real timer through globalThis.setTimeout, and
  // built inside a staged implementation it would re-enter that same stage.
  const stagedHandle = TimeoutStub();
  // passthrough: every delay a test did not stage keeps its real timer (jest's own, a socket's
  // request timeout), so only the address a test stages is answered by the proxy.
  const handle = registerSpyOn({ object: globalThis, method: 'setTimeout', passthrough: true });

  return {
    setupFiresImmediately: ({ ms }: { ms: number }): void => {
      handle.calledWith([isCallback, ms]).implement((callback: () => void) => {
        callback();
        return stagedHandle;
      });
    },

    setupNeverFires: ({ ms }: { ms: number }): void => {
      handle.calledWith([isCallback, ms]).returns(stagedHandle);
    },

    getCallsFor: ({ ms }: { ms: number }): RecordedCalls => handle.callsMatching([isCallback, ms]),
  };
};
