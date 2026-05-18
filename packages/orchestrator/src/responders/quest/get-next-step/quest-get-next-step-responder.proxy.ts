import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questGetNextStepBroker } from '../../../brokers/quest/get-next-step/quest-get-next-step-broker';
import { questGetNextStepBrokerProxy } from '../../../brokers/quest/get-next-step/quest-get-next-step-broker.proxy';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { QuestGetNextStepResponder } from './quest-get-next-step-responder';

// Mock the broker at the module level so the responder's call resolves through our handle
// rather than triggering the broker's real long-poll loop.
registerModuleMock({
  module: '../../../brokers/quest/get-next-step/quest-get-next-step-broker',
});

export const QuestGetNextStepResponderProxy = (): {
  callResponder: typeof QuestGetNextStepResponder;
  setupBrokerReturns: (params: { step: NextStep }) => void;
  setupBrokerThrows: (params: { error: Error }) => void;
} => {
  // Instantiate the child broker proxy so the dependency-discovery linter sees the link.
  questGetNextStepBrokerProxy();
  const brokerMock = questGetNextStepBroker as jest.MockedFunction<typeof questGetNextStepBroker>;

  return {
    callResponder: QuestGetNextStepResponder,
    setupBrokerReturns: ({ step }: { step: NextStep }): void => {
      brokerMock.mockResolvedValueOnce(step);
    },
    setupBrokerThrows: ({ error }: { error: Error }): void => {
      brokerMock.mockRejectedValueOnce(error);
    },
  };
};
