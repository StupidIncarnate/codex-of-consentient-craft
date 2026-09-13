import type { DispatchHoldStub } from '@dungeonmaster/shared/contracts';
import { DispatchStateStub, UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { dispatchStateReadBrokerProxy } from '../../dispatch-state/read/dispatch-state-read-broker.proxy';
import { dispatchStateWriteBrokerProxy } from '../../dispatch-state/write/dispatch-state-write-broker.proxy';
import { usageLedgerCalibrateBroker } from '../../usage-ledger/calibrate/usage-ledger-calibrate-broker';
import { usageLedgerCalibrateBrokerProxy } from '../../usage-ledger/calibrate/usage-ledger-calibrate-broker.proxy';

// Calibration has its own suite over which ceiling it picks. What THIS broker owns is firing it,
// on the right window, on every refusal — so it is replaced at the module boundary and the tests
// assert the call. Replacing it also keeps its ledger fs chains off the dispatch-state ones these
// tests stage.
registerModuleMock({ module: '../../usage-ledger/calibrate/usage-ledger-calibrate-broker' });

type DispatchHold = ReturnType<typeof DispatchHoldStub>;

export const dispatchHoldRejectBrokerProxy = (): {
  setupNoHeldState: () => void;
  setupPlayingNoHeldState: () => void;
  setupHeldState: (params: { hold: DispatchHold }) => void;
  getCalibrateCalls: () => unknown[];
  getWrittenContent: () => unknown;
} => {
  const readProxy = dispatchStateReadBrokerProxy();
  const writeProxy = dispatchStateWriteBrokerProxy();
  usageLedgerCalibrateBrokerProxy();

  const calibrateMock = usageLedgerCalibrateBroker as jest.MockedFunction<
    typeof usageLedgerCalibrateBroker
  >;
  calibrateMock.mockResolvedValue(UsageLedgerStub());

  return {
    setupNoHeldState: (): void => {
      readProxy.setupStateFile({ json: JSON.stringify(DispatchStateStub()) });
      writeProxy.setupWriteSuccess();
    },

    setupPlayingNoHeldState: (): void => {
      readProxy.setupStateFile({
        json: JSON.stringify(DispatchStateStub({ mode: 'node-playing' })),
      });
      writeProxy.setupWriteSuccess();
    },

    setupHeldState: ({ hold }: { hold: DispatchHold }): void => {
      readProxy.setupStateFile({ json: JSON.stringify(DispatchStateStub({ hold })) });
      writeProxy.setupWriteSuccess();
    },

    getCalibrateCalls: (): unknown[] => calibrateMock.mock.calls.map((call) => call[0]),

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),
  };
};
