import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

export const slotManagerOrchestrateBrokerProxy = (): {
  runOrchestrationProxy: ReturnType<typeof runOrchestrationLayerBrokerProxy>;
} => {
  const runOrchestrationProxy = runOrchestrationLayerBrokerProxy();

  return {
    runOrchestrationProxy,
  };
};
