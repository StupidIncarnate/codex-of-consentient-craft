import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// process.exit really would end the test run, so every scenario spies on it instead of
// letting it run — the honest catch-all ([] as the address) matches any code argument.
export const exitProxy = (): {
  callsMatching: () => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: process, method: 'exit' });
  handle.calledWith([]).returns(undefined as never);

  return {
    callsMatching: (): RecordedCalls => handle.callsMatching([]),
  };
};
