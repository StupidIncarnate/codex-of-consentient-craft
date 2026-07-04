import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { dispatchStateReadBroker } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker';
import { dispatchStateReadBrokerProxy } from '../../../brokers/dispatch-state/read/dispatch-state-read-broker.proxy';
import { dispatchStateWriteBroker } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker';
import { dispatchStateWriteBrokerProxy } from '../../../brokers/dispatch-state/write/dispatch-state-write-broker.proxy';
import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';
import { orchestrationDispatchStateProxy } from '../../../state/orchestration-dispatch/orchestration-dispatch-state.proxy';

type DispatchState = ReturnType<typeof DispatchStateStub>;

registerModuleMock({ module: '../../../brokers/dispatch-state/read/dispatch-state-read-broker' });
registerModuleMock({ module: '../../../brokers/dispatch-state/write/dispatch-state-write-broker' });

export const OrchestrationDispatchPauseResponderProxy = (): {
  setupCurrentState: (params: { state: DispatchState }) => void;
  setupWrittenState: (params: { state: DispatchState }) => void;
  setPlayingFirst: () => void;
  getWriteCalls: () => readonly unknown[];
  getIsPlaying: () => boolean;
} => {
  dispatchStateReadBrokerProxy();
  dispatchStateWriteBrokerProxy();
  const stateProxy = orchestrationDispatchStateProxy();
  stateProxy.setupEmpty();

  const readMock = dispatchStateReadBroker as jest.MockedFunction<typeof dispatchStateReadBroker>;
  const writeMock = dispatchStateWriteBroker as jest.MockedFunction<
    typeof dispatchStateWriteBroker
  >;

  readMock.mockResolvedValue(DispatchStateStub({ mode: 'node-playing' }));
  writeMock.mockResolvedValue(DispatchStateStub());

  return {
    setupCurrentState: ({ state }: { state: DispatchState }): void => {
      readMock.mockResolvedValueOnce(state);
    },

    setupWrittenState: ({ state }: { state: DispatchState }): void => {
      writeMock.mockResolvedValueOnce(state);
    },

    setPlayingFirst: (): void => {
      orchestrationDispatchState.setPlaying({ isPlaying: true });
    },

    getWriteCalls: (): readonly unknown[] => writeMock.mock.calls.map((call) => call[0]),

    getIsPlaying: (): boolean => orchestrationDispatchState.getIsPlaying(),
  };
};
