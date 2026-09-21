import { registerMock } from '@dungeonmaster/testing/register-mock';
import { graphReachabilityCheckBroker } from '@dungeonmaster/orchestrator/brokers';
import { graphReachabilityCheckBrokerProxy } from '@dungeonmaster/orchestrator/testing';
import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

export const GraphReachabilityCheckResponderProxy = (): {
  setupClean: () => void;
  setupViolation: ({ message }: { message: string }) => void;
} => {
  graphReachabilityCheckBrokerProxy();
  const handle = registerMock({ fn: graphReachabilityCheckBroker });

  return {
    setupClean: (): void => {
      handle.calledWith([]).returns([]);
    },
    setupViolation: ({ message }: { message: string }): void => {
      handle.calledWith([]).returns([ErrorMessageStub({ value: message })]);
    },
  };
};
