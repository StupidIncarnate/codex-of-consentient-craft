import {
  dungeonmasterHomeEnsureBrokerProxy,
  locationsUsageLedgerPathFindBrokerProxy,
  locationsUsageLedgerTmpPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const usageLedgerWriteBrokerProxy = (): {
  setupWriteSuccess: (params: { nowMs: number }) => void;
  setupWriteFailure: (params: { nowMs: number; error: Error }) => void;
  getWrittenContent: () => unknown;
} => {
  const ensureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const ledgerPathProxy = locationsUsageLedgerPathFindBrokerProxy();
  const tmpPathProxy = locationsUsageLedgerTmpPathFindBrokerProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();

  const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });

  // Queued in the broker's own order: ensure-home, then the ledger path, then the tmp path. The
  // broker's tmp-file token is `${process.pid}-${nowMs}` (usage-ledger-write-broker.ts) — reading
  // process.pid here is not a stage, it is the SAME process the broker runs in, so this proxy and
  // the broker always compute the identical token, which is what lets the write be staged against
  // the exact token-suffixed path instead of a prefix/suffix predicate.
  const queuePaths = ({ nowMs }: { nowMs: number }): ReturnType<typeof FilePathStub> => {
    const token = `${String(process.pid)}-${String(nowMs)}`;
    const tmpPath = FilePathStub({
      value: `/home/user/.dungeonmaster/usage-ledger.json.tmp.${token}`,
    });

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
      token,
      ledgerTmpPath: tmpPath,
    });

    return tmpPath;
  };

  return {
    setupWriteSuccess: ({ nowMs }: { nowMs: number }): void => {
      const tmpPath = queuePaths({ nowMs });
      writeFileProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath });
    },

    setupWriteFailure: ({ nowMs, error }: { nowMs: number; error: Error }): void => {
      const tmpPath = queuePaths({ nowMs });
      writeFileProxy.throws({ filePath: tmpPath, error });
    },

    getWrittenContent: (): unknown => writeFileProxy.getAllWrittenFiles().at(-1)?.content,
  };
};
