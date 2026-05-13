import { processStaleWatchBrokerProxy } from '../../../brokers/process/stale-watch/process-stale-watch-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { processStaleWatchBootstrapStateProxy } from '../../../state/process-stale-watch-bootstrap/process-stale-watch-bootstrap-state.proxy';

export const ProcessStaleWatchBootstrapResponderProxy = (): {
  triggerTick: () => void;
  setupAlive: () => void;
  setupDead: () => void;
  reset: () => void;
} => {
  const bootstrapState = processStaleWatchBootstrapStateProxy();
  const watchProxy = processStaleWatchBrokerProxy();
  // The bootstrap responder reads `orchestrationProcessesState.getAll` / `getActivity` from
  // inside `processStaleWatchBroker`'s closures. The proxy doesn't need to drive that state
  // for the unit tests (callbacks fire on tick, not during setup), but the lint rule
  // requires every state import in the implementation be mirrored in the proxy.
  orchestrationProcessesStateProxy();

  return {
    triggerTick: watchProxy.triggerTick,
    setupAlive: watchProxy.setupAlive,
    setupDead: watchProxy.setupDead,
    reset: (): void => {
      bootstrapState.reset();
    },
  };
};
