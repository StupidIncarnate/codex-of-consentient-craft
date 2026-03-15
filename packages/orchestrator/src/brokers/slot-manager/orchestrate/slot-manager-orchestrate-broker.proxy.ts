import type { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { runOrchestrationLayerBrokerProxy } from './run-orchestration-layer-broker.proxy';

export const slotManagerOrchestrateBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
} => {
  const runOrchestrationProxy = runOrchestrationLayerBrokerProxy();

  return {
    getWorkTracker: () => runOrchestrationProxy.getWorkTracker(),
  };
};
