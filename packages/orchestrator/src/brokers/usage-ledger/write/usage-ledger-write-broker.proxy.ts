import {
  dungeonmasterHomeEnsureBrokerProxy,
  locationsUsageLedgerPathFindBrokerProxy,
  locationsUsageLedgerTmpPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const usageLedgerWriteBrokerProxy = (): {
  setupWriteSuccess: () => void;
  setupWriteFailure: (params: { error: Error }) => void;
  getWrittenContent: () => unknown;
} => {
  const ensureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const ledgerPathProxy = locationsUsageLedgerPathFindBrokerProxy();
  const tmpPathProxy = locationsUsageLedgerTmpPathFindBrokerProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();

  const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
  const tmpPath = FilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json.tmp' });

  // Queued in the broker's own order: ensure-home, then the ledger path, then the tmp path.
  const queuePaths = (): void => {
    ensureProxy.setupEnsureSuccess({
      homeDir: '/home/user',
      homePath,
      guildsPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
    });
    ledgerPathProxy.setupLedgerPath({
      homeDir: '/home/user',
      homePath,
      ledgerPath: FilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json' }),
    });
    tmpPathProxy.setupLedgerTmpPath({
      homeDir: '/home/user',
      homePath,
      ledgerTmpPath: tmpPath,
    });
  };

  return {
    setupWriteSuccess: (): void => {
      queuePaths();
      writeFileProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath });
    },

    setupWriteFailure: ({ error }: { error: Error }): void => {
      queuePaths();
      writeFileProxy.throws({ filePath: tmpPath, error });
    },

    getWrittenContent: (): unknown => writeFileProxy.getWrittenFor({ filePath: tmpPath }),
  };
};
