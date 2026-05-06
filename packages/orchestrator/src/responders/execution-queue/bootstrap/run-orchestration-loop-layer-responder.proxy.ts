import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';

export const RunOrchestrationLoopLayerResponderProxy = (): {
  reset: () => void;
} => {
  guildGetBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const processesProxy = orchestrationProcessesStateProxy();

  eventsProxy.setupEmpty();
  processesProxy.setupEmpty();

  return {
    reset: (): void => {
      eventsProxy.setupEmpty();
      processesProxy.setupEmpty();
    },
  };
};
