import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questQueueSyncListenerBrokerProxy } from '../../../brokers/quest/queue-sync-listener/quest-queue-sync-listener-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

export const ExecutionQueueSyncListenerBootstrapResponderProxy = (): {
  reset: () => void;
} => {
  const listenerProxy = questQueueSyncListenerBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const queueProxy = questExecutionQueueStateProxy();

  return {
    reset: (): void => {
      listenerProxy.reset();
      getProxy.setupEmptyFolder();
      eventsProxy.setupEmpty();
      queueProxy.setupEmpty();
    },
  };
};
