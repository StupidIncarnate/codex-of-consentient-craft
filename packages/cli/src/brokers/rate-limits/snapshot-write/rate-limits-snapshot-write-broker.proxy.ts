import {
  locationsRateLimitsSnapshotPathFindBrokerProxy,
  locationsRateLimitsSnapshotTmpPathFindBrokerProxy,
  pathDirnameAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';

export const rateLimitsSnapshotWriteBrokerProxy = (): {
  setupAcceptedWrite: () => void;
  setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }) => void;
  getWriteCalls: () => readonly { path: unknown; content: unknown }[];
  getRenameCalls: () => readonly { from: unknown; to: unknown }[];
} => {
  const statProxy = fsStatAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  const dirnameProxy = pathDirnameAdapterProxy();
  const snapshotPathProxy = locationsRateLimitsSnapshotPathFindBrokerProxy();
  const tmpPathProxy = locationsRateLimitsSnapshotTmpPathFindBrokerProxy();

  dirnameProxy.returns({
    result: FilePathStub({ value: '/home/test/.dungeonmaster' }),
  });
  snapshotPathProxy.setupSnapshotPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    snapshotPath: FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json' }),
  });
  tmpPathProxy.setupTmpPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    tmpPath: FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json.tmp' }),
  });

  return {
    setupAcceptedWrite: (): void => {
      statProxy.returnsNull();
      mkdirProxy.succeeds();
      writeProxy.succeeds();
      renameProxy.succeeds();
    },
    setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }): void => {
      statProxy.returnsMtime({ mtimeMs });
    },
    getWriteCalls: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
    getRenameCalls: (): readonly { from: unknown; to: unknown }[] => renameProxy.getRenameCalls(),
  };
};
