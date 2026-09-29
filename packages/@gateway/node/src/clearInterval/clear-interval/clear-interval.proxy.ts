import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const clearIntervalProxy = (): {
  getCallsFor: (params: { handle: unknown }) => RecordedCalls;
} => {
  // passthrough: the timer really is cancelled, so a test that arms one real interval does not leave
  // it running; nothing is staged and the proxy only records.
  const handle = registerSpyOn({ object: globalThis, method: 'clearInterval', passthrough: true });

  return {
    // By identity, not by value: an object address matches on its keys, and two cleared handles armed
    // in the same millisecond carry identical keys, so a value address reads back both.
    getCallsFor: ({ handle: timerHandle }: { handle: unknown }): RecordedCalls =>
      handle.callsMatching([(value: unknown): boolean => value === timerHandle]),
  };
};
