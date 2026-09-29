import { graphReachabilityCheckBrokerProxy } from '@dungeonmaster/orchestrator/brokers/graph-reachability/check/graph-reachability-check-broker.proxy';

export const GraphReachabilityCheckResponderProxy = (): {
  setupClean: () => void;
  setupViolation: ({ message }: { message: string }) => void;
} => {
  const checkProxy = graphReachabilityCheckBrokerProxy();

  return {
    setupClean: (): void => {
      checkProxy.setupClean();
    },
    setupViolation: ({ message }: { message: string }): void => {
      checkProxy.setupViolation({ message });
    },
  };
};
