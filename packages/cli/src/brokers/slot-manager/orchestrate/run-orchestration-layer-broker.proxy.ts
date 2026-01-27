import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

export const runOrchestrationLayerBrokerProxy = (): {
  loopProxy: ReturnType<typeof orchestrationLoopLayerBrokerProxy>;
} => {
  const loopProxy = orchestrationLoopLayerBrokerProxy();

  return {
    loopProxy,
  };
};
