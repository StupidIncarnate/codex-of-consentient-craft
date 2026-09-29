import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// passthrough: the real cancel must still run. The spy only records which handles were cleared.
export const clearImmediateProxy = (): {
  callsMatching: () => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'clearImmediate', passthrough: true });

  return {
    callsMatching: (): RecordedCalls => handle.callsMatching([]),
  };
};
