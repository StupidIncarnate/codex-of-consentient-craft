import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const clearTimeoutProxy = (): {
  getCallsFor: (params: { handle: NodeJS.Timeout }) => RecordedCalls;
} => {
  // passthrough: the timer really is cancelled, so a test that arms one real timer does not leave
  // it running; nothing is staged and the proxy only records.
  const handle = registerSpyOn({ object: globalThis, method: 'clearTimeout', passthrough: true });

  return {
    getCallsFor: ({ handle: timerHandle }: { handle: NodeJS.Timeout }): RecordedCalls =>
      handle.callsMatching([timerHandle]),
  };
};
