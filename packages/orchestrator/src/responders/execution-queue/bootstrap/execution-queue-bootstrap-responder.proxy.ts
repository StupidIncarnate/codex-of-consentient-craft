import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

// Bootstrap responder is idempotent and wires module-scoped state. The proxy
// composes child proxies per enforce-proxy-child-creation so tests that exercise
// wiring can reset all transitive state in one call.
export const ExecutionQueueBootstrapResponderProxy = (): {
  reset: () => void;
} => {
  const eventsProxy = orchestrationEventsStateProxy();
  const queueProxy = questExecutionQueueStateProxy();

  return {
    reset: (): void => {
      eventsProxy.setupEmpty();
      queueProxy.setupEmpty();
    },
  };
};
