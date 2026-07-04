import { questNodeDispatchLoopBrokerProxy } from '../../../brokers/quest/node-dispatch-loop/quest-node-dispatch-loop-broker.proxy';
import { questNodeDispatchRunnerBrokerProxy } from '../../../brokers/quest/node-dispatch-runner/quest-node-dispatch-runner-broker.proxy';
import { orchestrationDispatchStateProxy } from '../../../state/orchestration-dispatch/orchestration-dispatch-state.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

export const OrchestrationDispatchBootstrapResponderProxy = (): {
  reset: () => void;
} => {
  questNodeDispatchLoopBrokerProxy();
  questNodeDispatchRunnerBrokerProxy();
  const dispatchStateProxy = orchestrationDispatchStateProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  const queueProxy = questExecutionQueueStateProxy();

  return {
    reset: (): void => {
      dispatchStateProxy.setupEmpty();
      eventsProxy.setupEmpty();
      processesProxy.setupEmpty();
      queueProxy.setupEmpty();
    },
  };
};
