import { clearInterval } from '#gateway/node/clearInterval';
import { setInterval } from '#gateway/node/setInterval';
import { IntervalHandleStub } from '#gateway/node/setInterval/interval-handle.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// The gateway hands out `globalThis.setInterval` captured at module load, so a spy on the global
// never reaches it: the wrapper functions are what get staged. Each staging is addressed by the
// interval the caller is known to pass; the callback is opaque, so it is a positional placeholder.
const isCallback = (value: unknown): boolean => typeof value === 'function';

// One handle for the whole test file, not one per proxy: a module-level state (the rate-limits
// bootstrap's) keeps the handle it was given in an earlier test and stops it in a later one, and a
// per-proxy handle would make that stop an unstaged call.
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
  const captured: { callback: (() => void) | undefined } = { callback: undefined };

  const setIntervalMock = registerMock({ fn: setInterval });
  setIntervalMock.calledWith([isCallback, intervalMs]).implement((callback: () => void) => {
    captured.callback = callback;
    return STAGED_HANDLE;
  });

  const isStagedHandle = (value: unknown): boolean => value === STAGED_HANDLE;
  const clearIntervalMock = registerMock({ fn: clearInterval });
  clearIntervalMock.calledWith([isStagedHandle]).returns(undefined);

  return {
    triggerTick: (): void => {
      captured.callback?.();
    },
    getRegisteredCallback: (): (() => void) | undefined => captured.callback,
    wasStopped: (): boolean => clearIntervalMock.callsMatching([isStagedHandle]).length > 0,
  };
};
