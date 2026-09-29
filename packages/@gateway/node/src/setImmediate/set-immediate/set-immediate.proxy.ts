import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// passthrough: the real scheduler must still run — tests flush the event loop through it. The spy
// only records what was asked for, so a scenario can read back the callback and arguments.
export const setImmediateProxy = (): {
  callsMatching: () => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'setImmediate', passthrough: true });

  return {
    callsMatching: (): RecordedCalls => handle.callsMatching([]),
  };
};
