import type { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { orchestrationLoopLayerBrokerProxy } from './orchestration-loop-layer-broker.proxy';

export const runOrchestrationLayerBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
} => {
  const loopProxy = orchestrationLoopLayerBrokerProxy();

  return {
    getWorkTracker: () => loopProxy.getWorkTracker(),
  };
};
