import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateReadBrokerProxy } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker.proxy';
import { dispatchStateWriteBroker } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker';
import { dispatchStateWriteBrokerProxy } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;

registerModuleMock({ module: '../../../brokers/dispatch-state/read/dispatch-state-read-broker' });
registerModuleMock({ module: '../../../brokers/dispatch-state/write/dispatch-state-write-broker' });

export const OrchestrationDispatchNormalizeBootResponderProxy = (): {
  setupCurrentState: (params: { state: DispatchState }) => void;
  setupWrittenState: (params: { state: DispatchState }) => void;
  getWriteCalls: () => readonly unknown[];
} => {
  dispatchStateReadBrokerProxy();
  dispatchStateWriteBrokerProxy();

  const readMock = dispatchStateReadBroker as jest.MockedFunction<typeof dispatchStateReadBroker>;
  const writeMock = dispatchStateWriteBroker as jest.MockedFunction<
    typeof dispatchStateWriteBroker
  >;
  readMock.mockResolvedValue(DispatchStateStub());
  writeMock.mockResolvedValue(DispatchStateStub());

  return {
    setupCurrentState: ({ state }: { state: DispatchState }): void => {
      readMock.mockResolvedValueOnce(state);
    },

    setupWrittenState: ({ state }: { state: DispatchState }): void => {
      writeMock.mockResolvedValueOnce(state);
    },

    getWriteCalls: (): readonly unknown[] => writeMock.mock.calls.map((call) => call[0]),
  };
};
