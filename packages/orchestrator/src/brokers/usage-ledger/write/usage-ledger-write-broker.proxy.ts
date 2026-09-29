import { dungeonmasterHomeEnsureBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/ensure/dungeonmaster-home-ensure-broker.proxy';
import { locationsUsageLedgerPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/usage-ledger-path-find/locations-usage-ledger-path-find-broker.proxy';
import { locationsUsageLedgerTmpPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/usage-ledger-tmp-path-find/locations-usage-ledger-tmp-path-find-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { pid } from '#gateway/node/process';
import { getPidProxy } from '#gateway/node/process/get-pid/get-pid.proxy';

export const usageLedgerWriteBrokerProxy = (): {
  setupWriteSuccess: (params: { nowMs: number }) => void;
  setupWriteFailure: (params: { nowMs: number; error: Error }) => void;
  getWrittenContent: () => unknown;
} => {
  const ensureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const ledgerPathProxy = locationsUsageLedgerPathFindBrokerProxy();
  const tmpPathProxy = locationsUsageLedgerTmpPathFindBrokerProxy();
  const writeHandle = writeFileProxy();
  const renameHandle = renameProxy();
  // Unstaged: creating it restores the real pid, which is the `pid` the token below reads.
  getPidProxy();

  const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
  const ledgerPath = FilePathStub({ value: '/home/user/.dungeonmaster/usage-ledger.json' });
  // The tmp path of the last staged write: `getWrittenContent` reads back the write at that address.
  const lastTmpPath: { value: ReturnType<typeof FilePathStub> | undefined } = {
    value: undefined,
  };

  // Queued in the broker's own order: ensure-home, then the ledger path, then the tmp path. The
  // broker's tmp-file token is `${getPid()}-${nowMs}` (usage-ledger-write-broker.ts) — reading
  // the real pid here is not a stage, it is the SAME process the broker runs in, so this proxy and
  // the broker always compute the identical token, which is what lets the write be staged against
  // the exact token-suffixed path instead of a prefix/suffix predicate.
  const queuePaths = ({ nowMs }: { nowMs: number }): ReturnType<typeof FilePathStub> => {
    const token = `${String(pid)}-${String(nowMs)}`;
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
      ledgerPath,
    });
    tmpPathProxy.setupLedgerTmpPath({
      homeDir: '/home/user',
      homePath,
      token,
      ledgerTmpPath: tmpPath,
    });

    lastTmpPath.value = tmpPath;

    return tmpPath;
  };

  return {
    setupWriteSuccess: ({ nowMs }: { nowMs: number }): void => {
      const tmpPath = queuePaths({ nowMs });
      writeHandle.succeeds({ path: tmpPath });
      renameHandle.succeeds({ from: tmpPath, to: ledgerPath });
    },

    setupWriteFailure: ({ nowMs, error }: { nowMs: number; error: Error }): void => {
      const tmpPath = queuePaths({ nowMs });
      writeHandle.rejects({ path: tmpPath, error: Object.assign(error, { code: 'EIO' }) });
    },

    getWrittenContent: (): unknown =>
      lastTmpPath.value === undefined
        ? undefined
        : writeHandle.writtenContentsFor({ path: lastTmpPath.value }),
  };
};
