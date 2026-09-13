import { UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { usageLedgerReadBroker } from './usage-ledger-read-broker';
import { usageLedgerReadBrokerProxy } from './usage-ledger-read-broker.proxy';

describe('usageLedgerReadBroker', () => {
  describe('a ledger on disk', () => {
    it('VALID: {a measured ledger} => returns it parsed', async () => {
      const proxy = usageLedgerReadBrokerProxy();
      proxy.setupLedgerFile({ json: JSON.stringify(UsageLedgerStub()) });

      const result = await usageLedgerReadBroker();

      expect(result).toStrictEqual(UsageLedgerStub());
    });

    it('VALID: {a calibrated ceiling} => survives the round trip', async () => {
      const proxy = usageLedgerReadBrokerProxy();
      proxy.setupLedgerFile({
        json: JSON.stringify(
          UsageLedgerStub({ ceilings: { fiveHour: 122_469_486, sevenDay: 2_751_372_486 } }),
        ),
      });

      const result = await usageLedgerReadBroker();

      expect(result.ceilings).toStrictEqual({
        fiveHour: 122_469_486,
        sevenDay: 2_751_372_486,
      });
    });
  });

  describe('no usable ledger', () => {
    it('EMPTY: {file missing} => returns the empty ledger, which is a first run', async () => {
      const proxy = usageLedgerReadBrokerProxy();
      proxy.setupMissingFile();

      const result = await usageLedgerReadBroker();

      expect(result).toStrictEqual(
        UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
          updatedAt: '1970-01-01T00:00:00.000Z',
        }),
      );
    });

    it('ERROR: {file corrupt} => returns the empty ledger rather than throwing at the poller', async () => {
      const proxy = usageLedgerReadBrokerProxy();
      proxy.setupCorruptFile();

      const result = await usageLedgerReadBroker();

      expect(result).toStrictEqual(
        UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
          updatedAt: '1970-01-01T00:00:00.000Z',
        }),
      );
    });

    it('ERROR: {file corrupt} => reports NULL ceilings, so a lost ledger cannot clear a live hold', async () => {
      const proxy = usageLedgerReadBrokerProxy();
      proxy.setupCorruptFile();

      const result = await usageLedgerReadBroker();

      expect(result.ceilings).toStrictEqual({ fiveHour: null, sevenDay: null });
    });
  });
});
