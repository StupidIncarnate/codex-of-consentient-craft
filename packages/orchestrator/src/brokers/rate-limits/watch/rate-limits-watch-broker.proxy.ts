import type { FsError } from '#gateway/node/fs';

import { timerIntervalStartBrokerProxy } from '../../timer/interval-start/timer-interval-start-broker.proxy';
import { rateLimitsWatchTickLayerBrokerProxy } from './rate-limits-watch-tick-layer-broker.proxy';

export const rateLimitsWatchBrokerProxy = ({
  intervalMs,
}: {
  intervalMs: number;
}): {
  setupReadSucceeds: ({ contents }: { contents: string }) => void;
  setupReadEnoent: () => void;
  setupReadError: ({ error }: { error: FsError }) => void;
  triggerTick: () => void;
} => {
  const tickProxy = rateLimitsWatchTickLayerBrokerProxy();
  const timerProxy = timerIntervalStartBrokerProxy({ intervalMs });

  return {
    setupReadSucceeds: ({ contents }: { contents: string }): void => {
      tickProxy.setupReadSucceeds({ contents });
    },
    setupReadEnoent: (): void => {
      tickProxy.setupReadEnoent();
    },
    setupReadError: ({ error }: { error: FsError }): void => {
      tickProxy.setupReadError({ error });
    },
    triggerTick: (): void => {
      timerProxy.triggerTick();
    },
  };
};
