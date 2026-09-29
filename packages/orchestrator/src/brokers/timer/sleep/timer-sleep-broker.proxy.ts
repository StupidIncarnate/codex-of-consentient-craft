import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';

import { ElapsedMsStub } from '../../../contracts/elapsed-ms/elapsed-ms.stub';

type ElapsedMs = ReturnType<typeof ElapsedMsStub>;

export const timerSleepBrokerProxy = (): {
  setupResolvesImmediately: (params: { ms: number }) => void;
  getRegisteredDelays: () => readonly ElapsedMs[];
} => {
  const timeoutChild = setTimeoutProxy();
  const stagedDelays: ElapsedMs[] = [];

  return {
    setupResolvesImmediately: ({ ms }: { ms: number }): void => {
      stagedDelays.push(ElapsedMsStub({ value: ms }));
      timeoutChild.setupFiresImmediately({ ms });
    },
    // Grouped by staged delay, in the order the delays were staged: a caller's retry schedule
    // stages its delays in the order it walks them, so the last entry is the last delay reached.
    getRegisteredDelays: (): readonly ElapsedMs[] =>
      stagedDelays.flatMap((ms) => timeoutChild.getCallsFor({ ms }).map(() => ms)),
  };
};
