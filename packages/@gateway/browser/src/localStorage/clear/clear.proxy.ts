import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const clearProxy = (): {
  setupClearFails: (params: { error: Error }) => void;
  getCalls: () => RecordedCalls;
} => {
  const handle = registerSpyOn({
    object: Storage.prototype,
    method: 'clear',
    passthrough: true,
  });

  return {
    setupClearFails: ({ error }: { error: Error }): void => {
      handle.calledWith([]).throws(error);
    },

    // clear() takes no arguments, so there is no address to narrow on.
    getCalls: (): RecordedCalls => handle.callsMatching([]),
  };
};
