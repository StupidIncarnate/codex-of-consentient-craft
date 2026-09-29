import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

const isCallback = (value: unknown): boolean => typeof value === 'function';

export const setTimeoutProxy = (): {
  stageHandle: (params: {
    delay: number;
    handle: ReturnType<typeof globalThis.setTimeout>;
  }) => void;
  getCallsFor: (params: { delay: number }) => RecordedCalls;
} => {
  // passthrough: React's, Mantine's and jsdom's own timers keep working; only the address a test
  // stages (a callback at an exact delay) is answered by the proxy.
  const handle = registerSpyOn({ object: globalThis, method: 'setTimeout', passthrough: true });

  return {
    stageHandle: ({ delay, handle: stagedHandle }): void => {
      handle.calledWith([isCallback, delay]).returns(stagedHandle);
    },

    getCallsFor: ({ delay }: { delay: number }): RecordedCalls =>
      handle.callsMatching([isCallback, delay]),
  };
};
