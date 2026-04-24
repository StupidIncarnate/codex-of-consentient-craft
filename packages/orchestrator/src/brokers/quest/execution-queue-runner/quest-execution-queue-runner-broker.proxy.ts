import { drainOnceLayerBrokerProxy } from './drain-once-layer-broker.proxy';

// Proxy intentionally minimal — quest-execution-queue-runner-broker takes injected
// callbacks and does no I/O, so tests assemble jest.fn() deps inline rather than
// going through adapter mocks. Includes the drain-once layer's proxy per
// enforce-proxy-child-creation.
export const questExecutionQueueRunnerBrokerProxy = (): {
  reset: () => void;
} => {
  const drainProxy = drainOnceLayerBrokerProxy();
  return {
    reset: (): void => {
      drainProxy.reset();
    },
  };
};
