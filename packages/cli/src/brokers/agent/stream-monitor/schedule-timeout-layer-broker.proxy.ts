import { timerSetTimeoutAdapterProxy } from '../../../adapters/timer/set-timeout/timer-set-timeout-adapter.proxy';
import { timerClearTimeoutAdapterProxy } from '../../../adapters/timer/clear-timeout/timer-clear-timeout-adapter.proxy';
import type { TimerIdStub } from '../../../contracts/timer-id/timer-id.stub';

type TimerId = ReturnType<typeof TimerIdStub>;

export const scheduleTimeoutLayerBrokerProxy = (): {
  setupNeverFire: () => TimerId;
  setupImmediate: () => TimerId;
  getClearedTimerId: () => unknown;
} => {
  const setTimeoutProxy = timerSetTimeoutAdapterProxy();
  const clearTimeoutProxy = timerClearTimeoutAdapterProxy();

  return {
    setupNeverFire: (): TimerId => setTimeoutProxy.setupNeverFire(),

    setupImmediate: (): TimerId => setTimeoutProxy.setupImmediate(),

    getClearedTimerId: (): unknown => clearTimeoutProxy.getClearedTimerId(),
  };
};
