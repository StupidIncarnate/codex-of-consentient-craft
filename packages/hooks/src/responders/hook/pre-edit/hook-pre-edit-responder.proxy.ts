import { violationsCheckNewBrokerProxy } from '../../../brokers/violations/check-new/violations-check-new-broker.proxy';

export const HookPreEditResponderProxy = (): {
  setupViolationCheck: (params?: { hasViolations?: boolean }) => void;
} => {
  const brokerProxy = violationsCheckNewBrokerProxy();

  return {
    setupViolationCheck: ({ hasViolations = false }: { hasViolations?: boolean } = {}): void => {
      brokerProxy.setupViolationCheck({ hasViolations });
    },
  };
};
