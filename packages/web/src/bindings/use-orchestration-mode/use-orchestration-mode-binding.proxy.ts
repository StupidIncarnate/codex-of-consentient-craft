import { orchestrationModeGetBrokerProxy } from '../../brokers/orchestration/mode-get/orchestration-mode-get-broker.proxy';

export const useOrchestrationModeBindingProxy = (): ReturnType<
  typeof orchestrationModeGetBrokerProxy
> => {
  const broker = orchestrationModeGetBrokerProxy();

  return { ...broker };
};
