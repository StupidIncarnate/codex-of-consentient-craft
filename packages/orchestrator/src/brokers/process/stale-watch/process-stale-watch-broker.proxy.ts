import { procCheckAliveAdapterProxy } from '../../../adapters/proc/check-alive/proc-check-alive-adapter.proxy';
import { timerSetIntervalAdapterProxy } from '../../../adapters/timer/set-interval/timer-set-interval-adapter.proxy';

export const processStaleWatchBrokerProxy = (): {
  triggerTick: () => void;
  setupAlive: () => void;
  setupDead: () => void;
} => {
  const timerProxy = timerSetIntervalAdapterProxy();
  const aliveProxy = procCheckAliveAdapterProxy();

  return {
    triggerTick: (): void => {
      timerProxy.triggerTick();
    },
    setupAlive: (): void => {
      aliveProxy.setupAlive();
    },
    setupDead: (): void => {
      aliveProxy.setupDead();
    },
  };
};
