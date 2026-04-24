import { questExecutionQueueRunnerBrokerProxy } from '../../../brokers/quest/execution-queue-runner/quest-execution-queue-runner-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { webPresenceStateProxy } from '../../../state/web-presence/web-presence-state.proxy';
import { PauseActiveHeadLayerResponderProxy } from './pause-active-head-layer-responder.proxy';

type PauseLayerProxy = ReturnType<typeof PauseActiveHeadLayerResponderProxy>;
type GetPauseBrokerCalls = PauseLayerProxy['getPauseBrokerCalls'];

// Bootstrap responder is idempotent and wires module-scoped state. The proxy
// composes child proxies per enforce-proxy-child-creation so tests that exercise
// wiring can reset all transitive state in one call. Presence-handler tests observe
// questPauseBroker invocations via the `getPauseBrokerCalls` semantic method below,
// which delegates to the composed pause-layer proxy without re-exporting it.
export const ExecutionQueueBootstrapResponderProxy = (): {
  reset: () => void;
  getPauseBrokerCalls: GetPauseBrokerCalls;
} => {
  const runnerProxy = questExecutionQueueRunnerBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const queueProxy = questExecutionQueueStateProxy();
  const presenceProxy = webPresenceStateProxy();
  const pauseLayerProxy = PauseActiveHeadLayerResponderProxy();

  return {
    reset: (): void => {
      runnerProxy.reset();
      getProxy.setupEmptyFolder();
      eventsProxy.setupEmpty();
      queueProxy.setupEmpty();
      presenceProxy.setupEmpty();
      pauseLayerProxy.setupPaused();
    },
    getPauseBrokerCalls: pauseLayerProxy.getPauseBrokerCalls,
  };
};
