import { UsageLedgerStub } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { usageLedgerReadBroker } from '../read/usage-ledger-read-broker';
import { usageLedgerReadBrokerProxy } from '../read/usage-ledger-read-broker.proxy';
import { usageLedgerWriteBroker } from '../write/usage-ledger-write-broker';
import { usageLedgerWriteBrokerProxy } from '../write/usage-ledger-write-broker.proxy';

type UsageLedger = ReturnType<typeof UsageLedgerStub>;

// Both sides own their own suites; here they are this broker's input and output, and what the
// tests grade is the ceiling it decides on.
registerModuleMock({ module: '../read/usage-ledger-read-broker' });
registerModuleMock({ module: '../write/usage-ledger-write-broker' });

export const usageLedgerCalibrateBrokerProxy = (): {
  setupLedger: (params: { ledger: UsageLedger }) => void;
  getWrittenLedger: () => unknown;
} => {
  usageLedgerReadBrokerProxy();
  usageLedgerWriteBrokerProxy();

  const readMock = usageLedgerReadBroker as jest.MockedFunction<typeof usageLedgerReadBroker>;
  const writeMock = usageLedgerWriteBroker as jest.MockedFunction<typeof usageLedgerWriteBroker>;

  readMock.mockResolvedValue(UsageLedgerStub());
  writeMock.mockImplementation(async ({ ledger }) =>
    Promise.resolve(UsageLedgerStub({ ...ledger })),
  );

  return {
    setupLedger: ({ ledger }: { ledger: UsageLedger }): void => {
      readMock.mockResolvedValue(ledger);
    },

    getWrittenLedger: (): unknown => writeMock.mock.calls.at(-1)?.[0]?.ledger,
  };
};
