import { graphReachabilityCheckBrokerProxy } from '@dungeonmaster/orchestrator/testing';

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
