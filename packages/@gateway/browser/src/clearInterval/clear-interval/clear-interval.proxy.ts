import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const clearIntervalProxy = (): {
  getCallsFor: (params: {
    handle: ReturnType<typeof globalThis.setInterval> | undefined;
  }) => RecordedCalls;
} => {
  // passthrough: the real cancel still runs, so a test that also waits on the timer sees it stay silent.
  const spy = registerSpyOn({ object: globalThis, method: 'clearInterval', passthrough: true });

  return {
    getCallsFor: ({ handle }): RecordedCalls => spy.callsMatching([handle]),
  };
};
