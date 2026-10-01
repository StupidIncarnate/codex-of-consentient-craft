/**
 * PURPOSE: Reads one index cache shard and hands its JSON to the caller's `parse`, which validates
 * it against that index's shard contract. Null when the shard is missing, not JSON, or rejected by
 * `parse` — a truncated or foreign file reads as a miss, never a crash. Both the owner index and the
 * contract index read their shards through here and check their own keys on what comes back.
 *
 * USAGE:
 * indexCacheShardReadBroker({ shardPath, parse: (value) => ownerIndexShardContract.safeParse(value).data ?? null });
 * // Returns the parsed shard, or null
 */
import { readFileSyncIfExists } from '#gateway/node/fs';

import { safeJsonParseTransformer } from '../../../transformers/safe-json-parse/safe-json-parse-transformer';

export const indexCacheShardReadBroker = <Shard>({
  shardPath,
  parse,
}: {
  shardPath: string;
  parse: (value: unknown) => Shard | null;
}): Shard | null => {
  const text = readFileSyncIfExists(shardPath);
  if (text === null) {
    return null;
  }
  const json = safeJsonParseTransformer({ value: text });
  return json.ok ? parse(json.value) : null;
};
