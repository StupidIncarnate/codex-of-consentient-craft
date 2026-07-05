import { OrchestrationModeStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { orchestrationModeGetBroker } from '../../../brokers/orchestration-mode/get/orchestration-mode-get-broker';
import { orchestrationModeGetBrokerProxy } from '../../../brokers/orchestration-mode/get/orchestration-mode-get-broker.proxy';

type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;

registerModuleMock({
  module: '../../../brokers/orchestration-mode/get/orchestration-mode-get-broker',
});

export const OrchestrationModeGetResponderProxy = (): {
  setupMode: (params: { mode: OrchestrationMode }) => void;
} => {
  orchestrationModeGetBrokerProxy();
  const brokerMock = orchestrationModeGetBroker as jest.MockedFunction<
    typeof orchestrationModeGetBroker
  >;
  brokerMock.mockResolvedValue(OrchestrationModeStub());

  return {
    setupMode: ({ mode }: { mode: OrchestrationMode }): void => {
      brokerMock.mockResolvedValueOnce(mode);
    },
  };
};
