import { locationsUsageLedgerPathFindBroker } from './locations-usage-ledger-path-find-broker';
import { locationsUsageLedgerPathFindBrokerProxy } from './locations-usage-ledger-path-find-broker.proxy';

describe('locationsUsageLedgerPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/usage-ledger.json', () => {
    const proxy = locationsUsageLedgerPathFindBrokerProxy();

    proxy.setupLedgerPath({
      homeDir: '/home/user',
      homePath: '/home/user/.dungeonmaster',
      ledgerPath: '/home/user/.dungeonmaster/usage-ledger.json',
    });

    const result = locationsUsageLedgerPathFindBroker();

    expect(result).toBe('/home/user/.dungeonmaster/usage-ledger.json');
  });
});
