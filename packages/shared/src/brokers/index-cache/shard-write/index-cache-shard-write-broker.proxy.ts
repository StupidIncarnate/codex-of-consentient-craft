import { writeFileAtomicSyncProxy } from '#gateway/node/fs/write-file-atomic-sync/write-file-atomic-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { locationsStatics } from '../../../statics/locations/locations-statics';
import { indexCacheStatics } from '../../../statics/index-cache/index-cache-statics';
import { staleTempFilesRemoveLayerBrokerProxy } from './stale-temp-files-remove-layer-broker.proxy';

export const indexCacheShardWriteBrokerProxy = (): {
  setupShardWriteFails: ({ shardPath }: { shardPath: string }) => void;
  setupNow: ({ ms }: { ms: number }) => void;
  setupTempFiles: ({
    cacheDir,
    files,
  }: {
    cacheDir: string;
    files: readonly { name: string; modifiedAtMs: number }[];
  }) => void;
  writtenShard: ({ shardPath }: { shardPath: string }) => unknown;
  shardWriteCalls: ({ shardPath }: { shardPath: string }) => readonly unknown[][];
  unlinkCalls: ({ path }: { path: string }) => unknown[][];
  stderrText: () => string;
} => {
  const shardWriteProxy = writeFileAtomicSyncProxy();
  const errorOutput = stderrProxy();
  const staleTempProxy = staleTempFilesRemoveLayerBrokerProxy();

  // Every repo root's cache folders take writes, so a test that is not about the cache (a lint
  // rule's) needs no staging for it. An exact stage outranks this one.
  const cacheRoot = `/${[locationsStatics.repoRoot.nodeModules, ...indexCacheStatics.rootFolderNames].join('/')}`;
  shardWriteProxy.succeedsMatchingPath({
    path: (value: unknown): boolean => typeof value === 'string' && value.includes(cacheRoot),
  });

  return {
    setupShardWriteFails: ({ shardPath }: { shardPath: string }): void => {
      shardWriteProxy.writeThrows({
        path: shardPath,
        error: FsErrorStub({ code: 'EROFS', path: shardPath, syscall: 'open' }),
      });
    },
    setupNow: staleTempProxy.setupNow,
    setupTempFiles: staleTempProxy.setupTempFiles,
    writtenShard: ({ shardPath }: { shardPath: string }): unknown =>
      shardWriteProxy.writtenContents({ path: shardPath }),
    shardWriteCalls: ({ shardPath }: { shardPath: string }): readonly unknown[][] =>
      shardWriteProxy.getCallsFor({ seam: 'renameSync', path: shardPath }),
    unlinkCalls: staleTempProxy.unlinkCalls,
    stderrText: (): string => errorOutput.getWrittenText(),
  };
};
