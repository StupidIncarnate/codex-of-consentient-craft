import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';

import { locationsStatics } from '../../../statics/locations/locations-statics';
import { indexCacheStatics } from '../../../statics/index-cache/index-cache-statics';

export const indexCacheShardReadBrokerProxy = (): {
  setupShard: ({ shardPath, contents }: { shardPath: string; contents: string }) => void;
} => {
  const readProxy = readFileSyncIfExistsProxy();

  // Every repo root's cache folders start empty, so a test that is not about the cache (a lint
  // rule's) needs no staging for it. An exact setupShard stage outranks this one.
  const cacheRoot = `/${[locationsStatics.repoRoot.nodeModules, ...indexCacheStatics.rootFolderNames].join('/')}/`;
  readProxy.implementsMatchingPath({
    path: (value: unknown): boolean => typeof value === 'string' && value.includes(cacheRoot),
    fn: (): null => null,
  });

  return {
    setupShard: ({ shardPath, contents }: { shardPath: string; contents: string }): void => {
      readProxy.returns({ path: shardPath, contents });
    },
  };
};
