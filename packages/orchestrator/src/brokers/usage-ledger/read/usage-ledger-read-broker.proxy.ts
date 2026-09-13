import { locationsUsageLedgerPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const usageLedgerReadBrokerProxy = (): {
  setupLedgerFile: (params: { json: string }) => void;
  setupMissingFile: () => void;
  setupCorruptFile: () => void;
} => {
  const pathProxy = locationsUsageLedgerPathFindBrokerProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const ledgerPath = FilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json' });
  const queuePath = (): void => {
    pathProxy.setupLedgerPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      ledgerPath,
    });
  };

  return {
    setupLedgerFile: ({ json }: { json: string }): void => {
      queuePath();
      readFileProxy.resolves({ filePath: ledgerPath, content: json });
    },

    setupMissingFile: (): void => {
      queuePath();
      readFileProxy.rejects({
        filePath: ledgerPath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },

    setupCorruptFile: (): void => {
      queuePath();
      readFileProxy.resolves({ filePath: ledgerPath, content: 'not-valid-json{{{' });
    },
  };
};
