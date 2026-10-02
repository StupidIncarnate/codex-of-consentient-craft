import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { violationsCheckNewBrokerProxy } from '../../../brokers/violations/check-new/violations-check-new-broker.proxy';

export const HookAgyPreToolResponderProxy = (): {
  setupViolationCheck: (params?: { hasViolations?: boolean }) => void;
  setupProcessCwd: (params: { value: string }) => void;
} => {
  const brokerProxy = violationsCheckNewBrokerProxy();
  const processCwd = cwdProxy();

  return {
    setupViolationCheck: ({ hasViolations = false }: { hasViolations?: boolean } = {}): void => {
      brokerProxy.setupViolationCheck({ hasViolations });
    },
    setupProcessCwd: ({ value }: { value: string }): void => {
      processCwd.setupCwd({ value });
    },
  };
};
