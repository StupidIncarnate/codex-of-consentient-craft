import { dirname } from '#gateway/node/path';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { locationsRateLimitsSnapshotPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/rate-limits-snapshot-path-find/locations-rate-limits-snapshot-path-find-broker.proxy';
import { locationsRateLimitsSnapshotTmpPathFindBrokerProxy } from '@dungeonmaster/shared/brokers/locations/rate-limits-snapshot-tmp-path-find/locations-rate-limits-snapshot-tmp-path-find-broker.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const rateLimitsSnapshotWriteBrokerProxy = (): {
  setupAcceptedWrite: () => void;
  setupThrottledWrite: ({ mtimeMs }: { mtimeMs: number }) => void;
  getWriteCalls: () => readonly { path: unknown; content: unknown }[];
  getRenameCalls: () => readonly { from: unknown; to: unknown }[];
} => {
  const statProxy = statIfExistsProxy();
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();
  const snapshotRenameProxy = renameProxy();
  const dirnameHandle = registerMock({ fn: dirname });
  const snapshotPathProxy = locationsRateLimitsSnapshotPathFindBrokerProxy();
  const tmpPathProxy = locationsRateLimitsSnapshotTmpPathFindBrokerProxy();

  const snapshotPath = '/home/test/.dungeonmaster/rate-limits.json';
  const tmpPath = '/home/test/.dungeonmaster/rate-limits.json.tmp';

  dirnameHandle
    .calledWith([snapshotPath])
    .returns('/home/test/.dungeonmaster');
  snapshotPathProxy.setupSnapshotPath({
    homeDir: '/home/test',
    homePath: '/home/test/.dungeonmaster',
    snapshotPath,
  });
  tmpPathProxy.setupTmpPath({
    homeDir: '/home/test',
    homePath: '/home/test/.dungeonmaster',
    tmpPath,
  });

  return {
    setupAcceptedWrite: (): void => {
      statProxy.missing({ path: snapshotPath });
      mkdirProxy.succeeds({ path: '/home/test/.dungeonmaster' });
      writeProxy.succeeds({ path: tmpPath });
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
    getRenameCalls: (): readonly { from: unknown; to: unknown }[] =>
      snapshotRenameProxy
        .getCallsFor({ from: () => true, to: () => true })
        .map((call) => ({ from: call[0], to: call[1] })),
  };
};
