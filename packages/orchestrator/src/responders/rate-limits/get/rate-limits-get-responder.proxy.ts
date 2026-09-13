import { UsageLedgerStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { usageLedgerScanBroker } from '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker';
import { usageLedgerScanBrokerProxy } from '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker.proxy';

type UsageLedger = ReturnType<typeof UsageLedgerStub>;

// The scan walks the whole Claude home and has its own suite over the incremental rules. Here it is
// the reading this responder serves, so it is replaced at the module boundary and the tests supply
// a ledger directly.
registerModuleMock({ module: '../../../brokers/usage-ledger/scan/usage-ledger-scan-broker' });

export const RateLimitsGetResponderProxy = (): {
  setupLedger: (params: { ledger: UsageLedger }) => void;
  scanCalls: () => unknown;
} => {
  usageLedgerScanBrokerProxy();

  const scanMock = usageLedgerScanBroker as jest.MockedFunction<typeof usageLedgerScanBroker>;
  scanMock.mockResolvedValue(
    UsageLedgerStub({ buckets: {}, cursors: {}, ceilings: { fiveHour: null, sevenDay: null } }),
  );

  // The percentages and the resetsAt countdown are both measured against this instant, so it is
  // pinned rather than left to the wall clock.
  registerSpyOn({ object: Date, method: 'now' })
    .calledWith([])
    .returns(Date.parse('2026-09-13T05:00:00.000Z'));

  return {
    setupLedger: ({ ledger }: { ledger: UsageLedger }): void => {
      scanMock.mockResolvedValue(ledger);
    },

    scanCalls: (): unknown => scanMock.mock.calls,
  };
};
