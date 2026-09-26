import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// process.on really would attach a live signal listener for the rest of the suite, so every
// scenario spies on it instead of letting it run.
export const onProxy = (): {
  callsMatching: () => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: process, method: 'on' });
  handle.calledWith([]).returns(process);

  return {
    callsMatching: (): RecordedCalls => handle.callsMatching([]),
  };
};
