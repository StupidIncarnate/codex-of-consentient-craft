import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

const isCallback = (value: unknown): boolean => typeof value === 'function';

export const setIntervalProxy = (): {
  stageHandle: (params: { ms: number; handle: NodeJS.Timeout }) => void;
  getCallsFor: (params: { ms: number }) => RecordedCalls;
} => {
  // passthrough: every period a test did not stage keeps its real timer, so only the address a test
  // stages (a callback at an exact period) is answered by the proxy. A staged period arms nothing:
  // a test fires the callback itself, from `getCallsFor({ ms })[n][0]`.
  const handle = registerSpyOn({ object: globalThis, method: 'setInterval', passthrough: true });

  return {
    stageHandle: ({ ms, handle: stagedHandle }: { ms: number; handle: NodeJS.Timeout }): void => {
      handle.calledWith([isCallback, ms]).returns(stagedHandle);
    },

    getCallsFor: ({ ms }: { ms: number }): RecordedCalls => handle.callsMatching([isCallback, ms]),
  };
};
