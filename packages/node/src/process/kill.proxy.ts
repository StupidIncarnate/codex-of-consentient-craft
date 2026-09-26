import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

// A real signal 0 never harms the test process, but this proxy exists so every OTHER signal
// (SIGTERM, SIGKILL, ...) can be proven to reach process.kill without actually sending one.
export const killProxy = (): {
  callsMatching: () => RecordedCalls;
} => {
  const handle = registerSpyOn({ object: process, method: 'kill' });
  handle.calledWith([]).returns(true);

  return {
    callsMatching: (): RecordedCalls => handle.callsMatching([]),
  };
};
