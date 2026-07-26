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

  const snapshotPath = FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json' });
  const tmpPath = FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json.tmp' });

  dirnameProxy.returns({
    result: FilePathStub({ value: '/home/test/.dungeonmaster' }),
  });
  snapshotPathProxy.setupSnapshotPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    snapshotPath,
  });
  tmpPathProxy.setupTmpPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    tmpPath,
  });

  return {
    setupAcceptedWrite: (): void => {
      statProxy.returnsNull({ filePath: snapshotPath });
      mkdirProxy.succeeds({ filePath: FilePathStub({ value: '/home/test/.dungeonmaster' }) });
      writeProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath });
    },
    setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }): void => {
      // Stages the write path too: when mtimeMs is outside the throttle window, the broker falls
      // through to mkdir/write/rename with these exact addresses. When mtimeMs is inside the
      // window the broker returns early and these stages simply go unused.
      statProxy.returnsMtime({ filePath: snapshotPath, mtimeMs });
      mkdirProxy.succeeds({ filePath: FilePathStub({ value: '/home/test/.dungeonmaster' }) });
      writeProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath });
    },
    getWriteCalls: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
    getRenameCalls: (): readonly { from: unknown; to: unknown }[] => renameProxy.getRenameCalls(),
  };
};
