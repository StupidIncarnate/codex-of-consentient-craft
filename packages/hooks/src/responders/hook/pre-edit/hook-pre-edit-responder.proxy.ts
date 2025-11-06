import { violationsCheckNewBroker } from '../../../brokers/violations/check-new/violations-check-new-broker';
import type { ViolationComparison } from '../../../contracts/violation-comparison/violation-comparison-contract';

jest.mock('../../../brokers/violations/check-new/violations-check-new-broker');

export const HookPreEditResponderProxy = (): {
  setupViolationCheck: (params: { result: ViolationComparison }) => void;
} => {
  const mockViolationsCheckNewBroker = jest.mocked(violationsCheckNewBroker);

  return {
    setupViolationCheck: ({ result }: { result: ViolationComparison }): void => {
      mockViolationsCheckNewBroker.mockResolvedValueOnce(result);
    },
  };
};
