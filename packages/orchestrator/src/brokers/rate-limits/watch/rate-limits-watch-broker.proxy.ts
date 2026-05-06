import { timerSetIntervalAdapterProxy } from '../../../adapters/timer/set-interval/timer-set-interval-adapter.proxy';
import { rateLimitsWatchTickLayerBrokerProxy } from './rate-limits-watch-tick-layer-broker.proxy';

export const rateLimitsWatchBrokerProxy = (): {
  setupReadSucceeds: ({ contents }: { contents: string }) => void;
  setupReadEnoent: () => void;
  setupReadError: ({ error }: { error: Error }) => void;
  triggerTick: () => void;
} => {
  const tickProxy = rateLimitsWatchTickLayerBrokerProxy();
  const timerProxy = timerSetIntervalAdapterProxy();

  return {
    setupReadSucceeds: ({ contents }: { contents: string }): void => {
      tickProxy.setupReadSucceeds({ contents });
    },
    setupReadEnoent: (): void => {
      tickProxy.setupReadEnoent();
    },
    setupReadError: ({ error }: { error: Error }): void => {
      tickProxy.setupReadError({ error });
    },
    triggerTick: (): void => {
      timerProxy.triggerTick();
    },
  };
};
