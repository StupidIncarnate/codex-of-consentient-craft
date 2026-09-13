import { locationsUsageLedgerTmpPathFindBroker } from './locations-usage-ledger-tmp-path-find-broker';
import { locationsUsageLedgerTmpPathFindBrokerProxy } from './locations-usage-ledger-tmp-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsUsageLedgerTmpPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/usage-ledger.json.tmp', () => {
    const proxy = locationsUsageLedgerTmpPathFindBrokerProxy();

    proxy.setupLedgerTmpPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      ledgerTmpPath: FilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json.tmp' }),
    });

    const result = locationsUsageLedgerTmpPathFindBroker();

    expect(result).toBe(
      AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json.tmp' }),
    );
  });
});
