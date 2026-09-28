import { dirname } from '#gateway/node/path';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import {
  locationsRateLimitsSnapshotPathFindBrokerProxy,
  locationsRateLimitsSnapshotTmpPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const rateLimitsSnapshotWriteBrokerProxy = (): {
  setupAcceptedWrite: () => void;
  setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }) => void;
  getWriteCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const statProxy = statIfExistsProxy();
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();
  const snapshotRenameProxy = renameProxy();
  const dirnameHandle = registerMock({ fn: dirname });
  const snapshotPathProxy = locationsRateLimitsSnapshotPathFindBrokerProxy();
  const tmpPathProxy = locationsRateLimitsSnapshotTmpPathFindBrokerProxy();

  const snapshotPath = FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json' });
  const tmpPath = FilePathStub({ value: '/home/test/.dungeonmaster/rate-limits.json.tmp' });

  dirnameHandle
    .calledWith([snapshotPath])
    .returns(FilePathStub({ value: '/home/test/.dungeonmaster' }));
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
      statProxy.missing({ path: snapshotPath });
      mkdirProxy.succeeds({ path: '/home/test/.dungeonmaster' });
      writeProxy.succeeds({ path: tmpPath });
      // Exact tuple, not `from`-only: the gateway's rename proxy exposes no call read-back
      // (F-style gap — every sibling fs__promises proxy does), so this address IS the proof —
      // a swapped `from`/`to` argument mismatches the stage and throws, failing the awaiting test.
      snapshotRenameProxy.succeeds({ from: tmpPath, to: snapshotPath });
    },
    setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }): void => {
      // Stages the write path too: when mtimeMs is outside the throttle window, the broker falls
      // through to mkdir/write/rename with these exact addresses. When mtimeMs is inside the
      // window the broker returns early and these stages simply go unused.
      statProxy.returnsFile({ path: snapshotPath, sizeBytes: 0, modifiedAtMs: mtimeMs });
      mkdirProxy.succeeds({ path: '/home/test/.dungeonmaster' });
      writeProxy.succeeds({ path: tmpPath });
      snapshotRenameProxy.succeeds({ from: tmpPath, to: snapshotPath });
    },
    getWriteCalls: (): readonly { path: unknown; content: unknown }[] => {
      const content = writeProxy.writtenContentsFor({ path: tmpPath });
      return content === undefined ? [] : [{ path: tmpPath, content }];
    },
  };
};
