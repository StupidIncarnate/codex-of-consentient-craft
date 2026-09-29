import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const clearTimeoutProxy = (): {
  getCallsFor: (params: {
    handle: ReturnType<typeof globalThis.setTimeout> | undefined;
  }) => RecordedCalls;
} => {
  // passthrough: the real cancel still runs, so a test that also waits on the timer sees it stay silent.
  const spy = registerSpyOn({ object: globalThis, method: 'clearTimeout', passthrough: true });

  return {
    getCallsFor: ({ handle }): RecordedCalls => spy.callsMatching([handle]),
  };
};
