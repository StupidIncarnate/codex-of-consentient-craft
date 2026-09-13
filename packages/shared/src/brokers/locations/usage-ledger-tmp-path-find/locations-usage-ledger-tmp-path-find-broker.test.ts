import { locationsUsageLedgerTmpPathFindBroker } from './locations-usage-ledger-tmp-path-find-broker';
import { locationsUsageLedgerTmpPathFindBrokerProxy } from './locations-usage-ledger-tmp-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsUsageLedgerTmpPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns the staging path under the dungeonmaster home', () => {
    const proxy = locationsUsageLedgerTmpPathFindBrokerProxy();

    proxy.setupLedgerTmpPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      ledgerTmpPath: FilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json.tmp' }),
    });

    const result = locationsUsageLedgerTmpPathFindBroker({ token: '4821-1789337123234' });

    expect(result).toBe(
      AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json.tmp' }),
    );
  });

  describe('the token is what keeps two writers apart', () => {
    it('VALID: {token: "4821-1789337123234"} => appends the token to the staging file name', () => {
      const proxy = locationsUsageLedgerTmpPathFindBrokerProxy();

      proxy.setupHomeOnly({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      });

      const result = locationsUsageLedgerTmpPathFindBroker({ token: '4821-1789337123234' });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.dungeonmaster/usage-ledger.json.tmp.4821-1789337123234',
        }),
      );
    });

    it('VALID: {two different tokens} => yields two different staging paths', () => {
      const proxy = locationsUsageLedgerTmpPathFindBrokerProxy();

      proxy.setupHomeOnly({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      });

      const first = locationsUsageLedgerTmpPathFindBroker({ token: '4821-1789337123234' });

      proxy.setupHomeOnly({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      });

      const second = locationsUsageLedgerTmpPathFindBroker({ token: '4822-1789337123234' });

      expect(first).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.dungeonmaster/usage-ledger.json.tmp.4821-1789337123234',
        }),
      );
      expect(second).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.dungeonmaster/usage-ledger.json.tmp.4822-1789337123234',
        }),
      );
    });
  });
});
