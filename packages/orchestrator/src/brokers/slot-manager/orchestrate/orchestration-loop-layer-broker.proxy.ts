import { WorkTrackerStub } from '../../../contracts/work-tracker/work-tracker.stub';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

export const orchestrationLoopLayerBrokerProxy = (): {
  getWorkTracker: () => ReturnType<typeof WorkTrackerStub>;
} => {
  spawnAgentLayerBrokerProxy();
  handleSignalLayerBrokerProxy();

  const workTracker = WorkTrackerStub({
    markStarted: jest.fn().mockResolvedValue(undefined),
    markCompleted: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    markPartiallyCompleted: jest.fn().mockResolvedValue(undefined),
    markBlocked: jest.fn().mockResolvedValue(undefined),
    addWorkItem: jest.fn().mockReturnValue(undefined),
  });

  return {
    getWorkTracker: () => workTracker,
  };
};
