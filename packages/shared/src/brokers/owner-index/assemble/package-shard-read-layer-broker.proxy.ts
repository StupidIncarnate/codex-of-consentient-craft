import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';

import { indexCacheShardReadBrokerProxy } from '../../index-cache/shard-read/index-cache-shard-read-broker.proxy';
import { indexCacheShardWriteBrokerProxy } from '../../index-cache/shard-write/index-cache-shard-write-broker.proxy';

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
  const sourceReadProxy = readFileSyncIfExistsProxy();
  const shardReadProxy = indexCacheShardReadBrokerProxy();
  const shardWriteProxy = indexCacheShardWriteBrokerProxy();

  return {
    setupShard: shardReadProxy.setupShard,

    setupSourceText: ({ filePath, text }: { filePath: string; text: string }): void => {
      sourceReadProxy.returns({ path: filePath, contents: text });
    },

    setupMissingSource: ({ filePath }: { filePath: string }): void => {
      sourceReadProxy.missing({ path: filePath });
    },

    setupShardWriteFails: shardWriteProxy.setupShardWriteFails,
    setupNow: shardWriteProxy.setupNow,
    setupTempFiles: shardWriteProxy.setupTempFiles,
    unlinkCalls: shardWriteProxy.unlinkCalls,
    writtenShard: shardWriteProxy.writtenShard,
    shardWriteCalls: shardWriteProxy.shardWriteCalls,
    sourceReadCalls: ({ filePath }: { filePath: string }): readonly unknown[][] =>
      sourceReadProxy.getCallsFor({ path: filePath }),
    stderrText: shardWriteProxy.stderrText,
  };
};
