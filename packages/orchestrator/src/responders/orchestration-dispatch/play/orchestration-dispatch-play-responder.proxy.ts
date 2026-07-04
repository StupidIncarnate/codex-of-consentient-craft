import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { dispatchStatePlayGateBroker } from '../../../brokers/dispatch-state/play-gate/dispatch-state-play-gate-broker';
import { dispatchStatePlayGateBrokerProxy } from '../../../brokers/dispatch-state/play-gate/dispatch-state-play-gate-broker.proxy';
import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateReadBrokerProxy } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker.proxy';
import { dispatchStateWriteBroker } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker';
import { dispatchStateWriteBrokerProxy } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker.proxy';
import { DispatchPlayGateResultStub } from '../../../contracts/dispatch-play-gate-result/dispatch-play-gate-result.stub';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';
import { orchestrationDispatchStateProxy } from '../../../state/orchestration-dispatch/orchestration-dispatch-state.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;
type GateResult = ReturnType<typeof DispatchPlayGateResultStub>;

registerModuleMock({
  module: '../../../brokers/dispatch-state/play-gate/dispatch-state-play-gate-broker',
});
registerModuleMock({ module: '../../../brokers/dispatch-state/read/dispatch-state-read-broker' });
registerModuleMock({ module: '../../../brokers/dispatch-state/write/dispatch-state-write-broker' });

export const OrchestrationDispatchPlayResponderProxy = (): {
  setupGate: (params: { result: GateResult }) => void;
  setupCurrentState: (params: { state: DispatchState }) => void;
  setupWrittenState: (params: { state: DispatchState }) => void;
  getWriteCalls: () => readonly unknown[];
  getIsPlaying: () => boolean;
} => {
  dispatchStatePlayGateBrokerProxy();
  dispatchStateReadBrokerProxy();
  dispatchStateWriteBrokerProxy();
  const stateProxy = orchestrationDispatchStateProxy();
  stateProxy.setupEmpty();

  const gateMock = dispatchStatePlayGateBroker as jest.MockedFunction<
    typeof dispatchStatePlayGateBroker
  >;
  const readMock = dispatchStateReadBroker as jest.MockedFunction<typeof dispatchStateReadBroker>;
  const writeMock = dispatchStateWriteBroker as jest.MockedFunction<
    typeof dispatchStateWriteBroker
  >;

  gateMock.mockResolvedValue(DispatchPlayGateResultStub());
  readMock.mockResolvedValue(DispatchStateStub());
  writeMock.mockResolvedValue(DispatchStateStub({ mode: 'node-playing' }));

  return {
    setupGate: ({ result }: { result: GateResult }): void => {
      gateMock.mockResolvedValueOnce(result);
    },

    setupCurrentState: ({ state }: { state: DispatchState }): void => {
      readMock.mockResolvedValueOnce(state);
    },

    setupWrittenState: ({ state }: { state: DispatchState }): void => {
      writeMock.mockResolvedValueOnce(state);
    },

    getWriteCalls: (): readonly unknown[] => writeMock.mock.calls.map((call) => call[0]),

    getIsPlaying: (): boolean => orchestrationDispatchState.getIsPlaying(),
  };
};
