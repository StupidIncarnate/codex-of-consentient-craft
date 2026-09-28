import { locationsUsageLedgerPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const usageLedgerReadBrokerProxy = (): {
  setupLedgerFile: (params: { json: string }) => void;
  setupMissingFile: () => void;
  setupCorruptFile: () => void;
} => {
  const pathProxy = locationsUsageLedgerPathFindBrokerProxy();
  const readFileHandle = readFileProxy();

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
      readFileHandle.returns({ path: ledgerPath, contents: json });
    },

    setupMissingFile: (): void => {
      queuePath();
      readFileHandle.missing({ path: ledgerPath });
    },

    setupCorruptFile: (): void => {
      queuePath();
      readFileHandle.returns({ path: ledgerPath, contents: 'not-valid-json{{{' });
    },
  };
};
