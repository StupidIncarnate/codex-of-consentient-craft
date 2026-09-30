import { setTimeoutProxy } from '#gateway/node/setTimeout/set-timeout/set-timeout.proxy';

type TimeoutMs = number;

export const timerSleepBrokerProxy = (): {
  setupResolvesImmediately: (params: { ms: number }) => void;
  getRegisteredDelays: () => readonly TimeoutMs[];
} => {
  const timeoutChild = setTimeoutProxy();
  const stagedDelays: TimeoutMs[] = [];

  return {
    setupResolvesImmediately: ({ ms }: { ms: number }): void => {
      stagedDelays.push(ms);
      timeoutChild.setupFiresImmediately({ ms });
    },
    // Grouped by staged delay, in the order the delays were staged: a caller's retry schedule
    // stages its delays in the order it walks them, so the last entry is the last delay reached.
    getRegisteredDelays: (): readonly TimeoutMs[] =>
      stagedDelays.flatMap((ms) => timeoutChild.getCallsFor({ ms }).map(() => ms)),
  };
};
