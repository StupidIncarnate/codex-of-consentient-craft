/**
 * PURPOSE: Writes one index cache shard as JSON, atomically — a concurrent reader sees the old shard
 * or the new one, never half of either — then clears temp files a killed writer left in the same
 * folder over an hour ago. A write that fails is one stderr line and the caller goes on: a cache only
 * ever saves time. Both the owner index and the contract index write their shards through here.
 *
 * USAGE:
 * indexCacheShardWriteBroker({ shardPath: '/repo/node_modules/.cache/dungeonmaster/owner-index/@repo__a.json', shard });
 * // Writes the shard JSON beside a `.tmp` sibling, renames it into place, removes stale `.tmp` files
 */
import { writeFileAtomicSync } from '#gateway/node/fs';
import { dirname } from '#gateway/node/path';
import { stderr } from '#gateway/node/process';

import { staleTempFilesRemoveLayerBroker } from './stale-temp-files-remove-layer-broker';

export const indexCacheShardWriteBroker = ({
  shardPath,
  shard,
}: {
  shardPath: string;
  shard: unknown;
}): void => {
  try {
    writeFileAtomicSync(shardPath, JSON.stringify(shard));
  } catch (error: unknown) {
    stderr.write(`[index-cache] cache shard not written: ${shardPath}: ${String(error)}\n`);
  }
  staleTempFilesRemoveLayerBroker({ cacheDir: dirname(shardPath) });
};
