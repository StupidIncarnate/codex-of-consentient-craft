import { processStaleWatchBrokerProxy } from '../../../brokers/process/stale-watch/process-stale-watch-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { processStaleWatchBootstrapStateProxy } from '../../../state/process-stale-watch-bootstrap/process-stale-watch-bootstrap-state.proxy';
import { processStaleThresholdStatics } from '../../../statics/process-stale-threshold/process-stale-threshold-statics';

export const ProcessStaleWatchBootstrapResponderProxy = (): {
  triggerTick: () => void;
  setupAlive: (
    params: Parameters<ReturnType<typeof processStaleWatchBrokerProxy>['setupAlive']>[0],
  ) => void;
  setupDead: (
    params: Parameters<ReturnType<typeof processStaleWatchBrokerProxy>['setupDead']>[0],
  ) => void;
  reset: () => void;
} => {
  const bootstrapState = processStaleWatchBootstrapStateProxy();
  // ProcessStaleWatchBootstrapResponder calls processStaleWatchBroker with no intervalMs
  // override, so it uses the broker's own default: processStaleThresholdStatics.tickIntervalMs.
  const watchProxy = processStaleWatchBrokerProxy({
    intervalMs: processStaleThresholdStatics.tickIntervalMs,
  });
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
