import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { dispatchStateHeartbeatBroker } from '../../../brokers/dispatch-state/heartbeat/dispatch-state-heartbeat-broker';
import { dispatchStateHeartbeatBrokerProxy } from '../../../brokers/dispatch-state/heartbeat/dispatch-state-heartbeat-broker.proxy';
import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateReadBrokerProxy } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker.proxy';
import { questGetNextStepBroker } from '../../../brokers/quest/get-next-step/quest-get-next-step-broker';
import { questGetNextStepBrokerProxy } from '../../../brokers/quest/get-next-step/quest-get-next-step-broker.proxy';
import type { NextStep } from '../../../contracts/next-step/next-step-contract';
import { QuestGetNextStepResponder } from './quest-get-next-step-responder';

// Mock the brokers at the module level so the responder's calls resolve through our handles
// rather than triggering the broker's real long-poll loop / disk reads.
registerModuleMock({
  module: '../../../brokers/quest/get-next-step/quest-get-next-step-broker',
});
registerModuleMock({
  module: '../../../brokers/dispatch-state/read/dispatch-state-read-broker',
});
registerModuleMock({
  module: '../../../brokers/dispatch-state/heartbeat/dispatch-state-heartbeat-broker',
});

export const QuestGetNextStepResponderProxy = (): {
  callResponder: typeof QuestGetNextStepResponder;
  setupBrokerReturns: (params: { step: NextStep }) => void;
  setupBrokerThrows: (params: { error: Error }) => void;
  setupDispatchMode: (params: { mode: 'node-playing' | 'paused' }) => void;
  getHeartbeatCalls: () => readonly unknown[];
} => {
  // Instantiate the child broker proxies so the dependency-discovery linter sees the links.
  questGetNextStepBrokerProxy();
  dispatchStateReadBrokerProxy();
  dispatchStateHeartbeatBrokerProxy();
  const brokerMock = questGetNextStepBroker as jest.MockedFunction<typeof questGetNextStepBroker>;
  const readMock = dispatchStateReadBroker as jest.MockedFunction<typeof dispatchStateReadBroker>;
  const heartbeatMock = dispatchStateHeartbeatBroker as jest.MockedFunction<
    typeof dispatchStateHeartbeatBroker
  >;

  // Default: paused (no Node dispatcher) so existing dispatch tests flow straight through.
  readMock.mockResolvedValue(DispatchStateStub());
  heartbeatMock.mockResolvedValue(
    DispatchStateStub({ mcpHeartbeatAt: '2024-01-15T10:00:00.000Z' }),
  );

  return {
    callResponder: QuestGetNextStepResponder,
    setupBrokerReturns: ({ step }: { step: NextStep }): void => {
      brokerMock.mockResolvedValueOnce(step);
    },
    setupBrokerThrows: ({ error }: { error: Error }): void => {
      brokerMock.mockRejectedValueOnce(error);
    },
    setupDispatchMode: ({ mode }: { mode: 'node-playing' | 'paused' }): void => {
      readMock.mockResolvedValueOnce(DispatchStateStub({ mode }));
    },
    getHeartbeatCalls: (): readonly unknown[] => [...heartbeatMock.mock.calls],
  };
};
