import { clearIntervalProxy } from '#gateway/node/clearInterval/clear-interval/clear-interval.proxy';
import { IntervalHandleStub } from '#gateway/node/setInterval/interval-handle.stub';
import { setIntervalProxy } from '#gateway/node/setInterval/set-interval/set-interval.proxy';

// One handle for the whole test file, not one per proxy: a module-level state (the rate-limits
// bootstrap's) keeps the handle it was given in an earlier test and stops it in a later one, and a
// per-proxy handle would leave that stop reading back against the wrong handle.
const STAGED_HANDLE = IntervalHandleStub();

export const timerIntervalStartBrokerProxy = ({
  intervalMs,
}: {
  intervalMs: number;
}): {
  triggerTick: () => void;
  getRegisteredCallback: () => (() => void) | undefined;
  wasStopped: () => boolean;
} => {
  const intervalChild = setIntervalProxy({
    stageHandleFor: { ms: intervalMs, handle: STAGED_HANDLE },
  });
  const clearChild = clearIntervalProxy();

  const latestCallback = (): (() => void) | undefined =>
    intervalChild
      .getCallsFor({ ms: intervalMs })
      .map(([callback]) => callback as () => void)
      .at(-1);

  return {
    triggerTick: (): void => {
      latestCallback()?.();
    },
    getRegisteredCallback: (): (() => void) | undefined => latestCallback(),
    wasStopped: (): boolean => clearChild.getCallsFor({ handle: STAGED_HANDLE }).length > 0,
  };
};
