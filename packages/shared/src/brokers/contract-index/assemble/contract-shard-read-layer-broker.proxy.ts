import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';

import { indexCacheShardReadBrokerProxy } from '../../index-cache/shard-read/index-cache-shard-read-broker.proxy';
import { indexCacheShardWriteBrokerProxy } from '../../index-cache/shard-write/index-cache-shard-write-broker.proxy';

export const contractShardReadLayerBrokerProxy = (): {
  setupShard: ({ shardPath, contents }: { shardPath: string; contents: string }) => void;
  setupSourceText: ({ filePath, text }: { filePath: string; text: string }) => void;
  setupMissingSource: ({ filePath }: { filePath: string }) => void;
  writtenShard: ({ shardPath }: { shardPath: string }) => unknown;
  shardWriteCalls: ({ shardPath }: { shardPath: string }) => readonly unknown[][];
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
    writtenShard: shardWriteProxy.writtenShard,
    shardWriteCalls: shardWriteProxy.shardWriteCalls,
  };
};
