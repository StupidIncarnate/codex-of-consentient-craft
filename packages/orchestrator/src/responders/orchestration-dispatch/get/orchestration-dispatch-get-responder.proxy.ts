import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateReadBrokerProxy } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;

registerModuleMock({ module: '../../../brokers/dispatch-state/read/dispatch-state-read-broker' });

export const OrchestrationDispatchGetResponderProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
} => {
  dispatchStateReadBrokerProxy();
  const readMock = dispatchStateReadBroker as jest.MockedFunction<typeof dispatchStateReadBroker>;
  readMock.mockResolvedValue(DispatchStateStub());

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      readMock.mockResolvedValueOnce(state);
    },
  };
};
