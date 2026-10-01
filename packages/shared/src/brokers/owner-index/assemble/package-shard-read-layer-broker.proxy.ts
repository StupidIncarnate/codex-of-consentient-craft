import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { writeFileAtomicSyncProxy } from '#gateway/node/fs/write-file-atomic-sync/write-file-atomic-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { locationsStatics } from '../../../statics/locations/locations-statics';
import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';
import { staleTempFilesRemoveLayerBrokerProxy } from './stale-temp-files-remove-layer-broker.proxy';

export const packageShardReadLayerBrokerProxy = (): {
  setupShard: ({ shardPath, contents }: { shardPath: string; contents: string }) => void;
  setupSourceText: ({ filePath, text }: { filePath: string; text: string }) => void;
  setupMissingSource: ({ filePath }: { filePath: string }) => void;
  setupShardWriteFails: ({ shardPath }: { shardPath: string }) => void;
  setupNow: ({ ms }: { ms: number }) => void;
  setupTempFiles: ({
    cacheDir,
    files,
  }: {
    cacheDir: string;
    files: readonly { name: string; modifiedAtMs: number }[];
  }) => void;
  unlinkCalls: ({ path }: { path: string }) => unknown[][];
  writtenShard: ({ shardPath }: { shardPath: string }) => unknown;
  shardWriteCalls: ({ shardPath }: { shardPath: string }) => readonly unknown[][];
  sourceReadCalls: ({ filePath }: { filePath: string }) => readonly unknown[][];
  stderrText: () => string;
} => {
  const fileReadProxy = readFileSyncIfExistsProxy();
  const shardWriteProxy = writeFileAtomicSyncProxy();
  const errorOutput = stderrProxy();
  const staleTempProxy = staleTempFilesRemoveLayerBrokerProxy();

  // Every repo root's cache folder starts empty and takes writes, so a test that is not about the
  // cache (a lint rule's) needs no staging for it. An exact stage outranks both.
  const cacheFolder = `/${[locationsStatics.repoRoot.nodeModules, ...ownerIndexStatics.cache.folderNames].join('/')}`;
  fileReadProxy.implementsMatchingPath({
    path: (value: unknown): boolean =>
      typeof value === 'string' && value.includes(`${cacheFolder}/`),
    fn: (): null => null,
  });
  shardWriteProxy.succeedsMatchingPath({
    path: (value: unknown): boolean => typeof value === 'string' && value.includes(cacheFolder),
  });

  return {
    setupShard: ({ shardPath, contents }: { shardPath: string; contents: string }): void => {
      fileReadProxy.returns({ path: shardPath, contents });
    },

    setupSourceText: ({ filePath, text }: { filePath: string; text: string }): void => {
      fileReadProxy.returns({ path: filePath, contents: text });
    },

    setupMissingSource: ({ filePath }: { filePath: string }): void => {
      fileReadProxy.missing({ path: filePath });
    },

    setupNow: staleTempProxy.setupNow,
    setupTempFiles: staleTempProxy.setupTempFiles,
    unlinkCalls: staleTempProxy.unlinkCalls,

    setupShardWriteFails: ({ shardPath }: { shardPath: string }): void => {
      shardWriteProxy.writeThrows({
        path: shardPath,
        error: FsErrorStub({ code: 'EROFS', path: shardPath, syscall: 'open' }),
      });
    },

    writtenShard: ({ shardPath }: { shardPath: string }): unknown =>
      shardWriteProxy.writtenContents({ path: shardPath }),

    shardWriteCalls: ({ shardPath }: { shardPath: string }): readonly unknown[][] =>
      shardWriteProxy.getCallsFor({ seam: 'renameSync', path: shardPath }),

    sourceReadCalls: ({ filePath }: { filePath: string }): readonly unknown[][] =>
      fileReadProxy.getCallsFor({ path: filePath }),

    stderrText: (): string => errorOutput.getWrittenText(),
  };
};
