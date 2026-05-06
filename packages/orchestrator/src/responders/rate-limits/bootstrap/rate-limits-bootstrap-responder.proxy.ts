import { rateLimitsWatchBrokerProxy } from '../../../brokers/rate-limits/watch/rate-limits-watch-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { rateLimitsBootstrapStateProxy } from '../../../state/rate-limits-bootstrap/rate-limits-bootstrap-state.proxy';
import { rateLimitsStateProxy } from '../../../state/rate-limits/rate-limits-state.proxy';

export const RateLimitsBootstrapResponderProxy = (): {
  setupReadSucceeds: ({ contents }: { contents: string }) => void;
  setupReadEnoent: () => void;
  triggerTick: () => void;
  reset: () => void;
} => {
  const bootstrapState = rateLimitsBootstrapStateProxy();
  const limitsState = rateLimitsStateProxy();
  orchestrationEventsStateProxy();
  const watchProxy = rateLimitsWatchBrokerProxy();

  return {
    setupReadSucceeds: watchProxy.setupReadSucceeds,
    setupReadEnoent: watchProxy.setupReadEnoent,
    triggerTick: watchProxy.triggerTick,
    reset: (): void => {
      bootstrapState.reset();
      limitsState.reset();
    },
  };
};
