import { questExecutionQueueRunnerBrokerProxy } from '../../../brokers/quest/execution-queue-runner/quest-execution-queue-runner-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { webPresenceStateProxy } from '../../../state/web-presence/web-presence-state.proxy';
import { RunOrchestrationLoopLayerResponderProxy } from './run-orchestration-loop-layer-responder.proxy';

// Bootstrap responder is idempotent and wires module-scoped state. The proxy
// composes child proxies per enforce-proxy-child-creation so tests that exercise
// wiring can reset all transitive state in one call.
export const ExecutionQueueBootstrapResponderProxy = (): {
  reset: () => void;
} => {
  const runnerProxy = questExecutionQueueRunnerBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const queueProxy = questExecutionQueueStateProxy();
  const presenceProxy = webPresenceStateProxy();
  RunOrchestrationLoopLayerResponderProxy();

  return {
    reset: (): void => {
      runnerProxy.reset();
      getProxy.setupEmptyFolder();
      eventsProxy.setupEmpty();
      queueProxy.setupEmpty();
      presenceProxy.setupEmpty();
    },
  };
};
