import { setTimeout } from '#gateway/node/setTimeout';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { ElapsedMsStub } from '../../../contracts/elapsed-ms/elapsed-ms.stub';

type ElapsedMs = ReturnType<typeof ElapsedMsStub>;

// The gateway hands out `globalThis.setTimeout` captured at module load, so the wrapper function
// is what gets staged. Every staging is addressed by the delay a caller is known to pass; the
// callback is opaque, so it is a positional placeholder.
const isCallback = (value: unknown): boolean => typeof value === 'function';

export const timerSleepBrokerProxy = (): {
  setupResolvesImmediately: (params: { ms: number }) => void;
  getRegisteredDelays: () => readonly ElapsedMs[];
} => {
  const delays: ElapsedMs[] = [];
  const setTimeoutMock = registerMock({ fn: setTimeout });

  return {
    setupResolvesImmediately: ({ ms }: { ms: number }): void => {
      setTimeoutMock.calledWith([isCallback, ms]).implement((callback: () => void) => {
        delays.push(ElapsedMsStub({ value: ms }));
        callback();
        return undefined;
      });
    },
    getRegisteredDelays: (): readonly ElapsedMs[] => [...delays],
  };
};
