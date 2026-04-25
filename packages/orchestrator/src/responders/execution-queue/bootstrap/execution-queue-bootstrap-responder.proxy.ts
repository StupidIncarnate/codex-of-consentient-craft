import { questEnqueueRecoverableBrokerProxy } from '../../../brokers/quest/enqueue-recoverable/quest-enqueue-recoverable-broker.proxy';
import { questExecutionQueueRunnerBrokerProxy } from '../../../brokers/quest/execution-queue-runner/quest-execution-queue-runner-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { executionQueueBootstrapStateProxy } from '../../../state/execution-queue-bootstrap/execution-queue-bootstrap-state.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { webPresenceStateProxy } from '../../../state/web-presence/web-presence-state.proxy';
import { PauseActiveHeadLayerResponderProxy } from './pause-active-head-layer-responder.proxy';
import { RunOrchestrationLoopLayerResponderProxy } from './run-orchestration-loop-layer-responder.proxy';

type PauseLayerProxy = ReturnType<typeof PauseActiveHeadLayerResponderProxy>;
type GetKilledProcessIds = PauseLayerProxy['getKilledProcessIds'];

// Bootstrap responder is idempotent and wires module-scoped state. The proxy
// composes child proxies per enforce-proxy-child-creation so tests that exercise
// wiring can reset all transitive state in one call. Presence-handler tests observe
// pause-active-head invocations indirectly via process kill records below — the
// pause layer no longer mutates quest status, only kills the registered process.
export const ExecutionQueueBootstrapResponderProxy = (): {
  reset: () => void;
  getKilledProcessIds: GetKilledProcessIds;
  getRecoveryBrokerCallArgs: () => readonly unknown[][];
} => {
  const runnerProxy = questExecutionQueueRunnerBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const bootstrapStateProxy = executionQueueBootstrapStateProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  const queueProxy = questExecutionQueueStateProxy();
  const presenceProxy = webPresenceStateProxy();
  const pauseLayerProxy = PauseActiveHeadLayerResponderProxy();
  const recoveryProxy = questEnqueueRecoverableBrokerProxy();
  RunOrchestrationLoopLayerResponderProxy();

  processesProxy.setupEmpty();
  bootstrapStateProxy.setupEmpty();

  return {
    reset: (): void => {
      runnerProxy.reset();
      getProxy.setupEmptyFolder();
      eventsProxy.setupEmpty();
      queueProxy.setupEmpty();
      presenceProxy.setupEmpty();
      pauseLayerProxy.setupNoProcess();
      bootstrapStateProxy.setupEmpty();
    },
    getKilledProcessIds: pauseLayerProxy.getKilledProcessIds,
    getRecoveryBrokerCallArgs: (): readonly unknown[][] => recoveryProxy.getCallArgs(),
  };
};
