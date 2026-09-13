import { locationsUsageLedgerPathFindBroker } from './locations-usage-ledger-path-find-broker';
import { locationsUsageLedgerPathFindBrokerProxy } from './locations-usage-ledger-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsUsageLedgerPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/usage-ledger.json', () => {
    const proxy = locationsUsageLedgerPathFindBrokerProxy();

    proxy.setupLedgerPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      ledgerPath: FilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json' }),
    });

    const result = locationsUsageLedgerPathFindBroker();

    expect(result).toBe(
      AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json' }),
    );
  });
});
