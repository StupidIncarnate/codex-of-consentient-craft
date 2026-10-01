/**
 * PURPOSE: Returns one package's shard files — each non-layer contract file's sha256 beside what
 * reading it gave — re-parsing only the files whose text no longer hashes to what the package's
 * cache shard recorded. Every file is read and hashed on every call (cheap); only the parse is
 * skipped. A shard that is missing, unparseable, or written under another schema version, another
 * installed @dungeonmaster/shared version, or for another package or folder counts as empty, so
 * every file is re-parsed. A file that vanished after the walk is left out. The shard is rewritten —
 * atomically, so a concurrent reader sees the old shard or the new one and never half of either —
 * only when a file was re-parsed or one was deleted, and each rewrite also clears stale temp files
 * from the cache folder. A write that fails is reported on stderr and the files are returned
 * anyway: the cache only ever saves time.
 *
 * USAGE:
 * packageShardReadLayerBroker({ shardPath, ownerPackage, filePaths, sharedVersion: '0.1.0' });
 * // Returns OwnerIndexShard['files'] — one per file of `filePaths` still on disk, in that order
 */
import { readFileSyncIfExists } from '#gateway/node/fs';

import type { OwnerIndexPackage } from '../../../contracts/owner-index-package/owner-index-package-contract';
import { ownerIndexShardContract } from '../../../contracts/owner-index-shard/owner-index-shard-contract';
import type { OwnerIndexShard } from '../../../contracts/owner-index-shard/owner-index-shard-contract';
import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';
import { ownerIndexFileReadTransformer } from '../../../transformers/owner-index-file-read/owner-index-file-read-transformer';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { indexCacheShardReadBroker } from '../../index-cache/shard-read/index-cache-shard-read-broker';
import { indexCacheShardWriteBroker } from '../../index-cache/shard-write/index-cache-shard-write-broker';

export const packageShardReadLayerBroker = ({
  shardPath,
  ownerPackage,
  filePaths,
  sharedVersion,
}: {
  shardPath: string;
  ownerPackage: OwnerIndexPackage;
  filePaths: string[];
  sharedVersion: OwnerIndexShard['sharedVersion'];
}): OwnerIndexShard['files'] => {
  const { name: packageName, dir: packageDir } = ownerPackage;
  const shard = indexCacheShardReadBroker({
    shardPath,
    parse: (value: unknown) => {
      const parsed = ownerIndexShardContract.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
  });
  const cached =
    shard !== null &&
    shard.schemaVersion === ownerIndexStatics.cache.schemaVersion &&
    shard.sharedVersion === sharedVersion &&
    shard.packageName === packageName &&
    shard.packageDir === packageDir
      ? shard
      : null;

  const cachedByPath = new Map<string, OwnerIndexShard['files'][number]>(
    (cached?.files ?? []).map((file) => [file.filePath, file]),
  );

  const entries = filePaths.flatMap((filePath) => {
    const text = readFileSyncIfExists(filePath);
    if (text === null) {
      return [];
    }
    const contentHash = contentHashTransformer({ text });
    const hit = cachedByPath.get(filePath);
    if (hit !== undefined && hit.contentHash === contentHash) {
      return [{ file: hit, isReparsed: false }];
    }
    const { owners, standaloneBrands, enums } = ownerIndexFileReadTransformer({
      filePath,
      text,
      packageName,
    });
    return [
      {
        file: ownerIndexShardContract.shape.files.element.parse({
          filePath,
          contentHash,
          owners,
          standaloneBrands,
          enums,
        }),
        isReparsed: true,
      },
    ];
  });

  if (
    cached === null ||
    cached.files.length !== entries.length ||
    entries.some(({ isReparsed }) => isReparsed)
  ) {
    const nextShard = ownerIndexShardContract.parse({
      schemaVersion: ownerIndexStatics.cache.schemaVersion,
      sharedVersion,
      packageName,
      packageDir,
      files: entries.map(({ file }) => file),
    });
    indexCacheShardWriteBroker({ shardPath, shard: nextShard });
  }

  return entries.map(({ file }) => file);
};
