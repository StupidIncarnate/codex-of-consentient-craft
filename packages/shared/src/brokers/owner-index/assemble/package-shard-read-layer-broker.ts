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
import { createHash } from '#gateway/node/crypto';
import { readFileSyncIfExists, writeFileAtomicSync } from '#gateway/node/fs';
import { dirname } from '#gateway/node/path';
import { stderr } from '#gateway/node/process';

import type { OwnerIndexPackage } from '../../../contracts/owner-index-package/owner-index-package-contract';
import { ownerIndexShardContract } from '../../../contracts/owner-index-shard/owner-index-shard-contract';
import type { OwnerIndexShard } from '../../../contracts/owner-index-shard/owner-index-shard-contract';
import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';
import { ownerIndexFileReadTransformer } from '../../../transformers/owner-index-file-read/owner-index-file-read-transformer';
import { safeJsonParseTransformer } from '../../../transformers/safe-json-parse/safe-json-parse-transformer';
import { staleTempFilesRemoveLayerBroker } from './stale-temp-files-remove-layer-broker';

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
  const shardText = readFileSyncIfExists(shardPath);
  const shardJson = shardText === null ? null : safeJsonParseTransformer({ value: shardText });
  const shardParse =
    shardJson?.ok === true ? ownerIndexShardContract.safeParse(shardJson.value) : null;
  const cached =
    shardParse?.success === true &&
    shardParse.data.schemaVersion === ownerIndexStatics.cache.schemaVersion &&
    shardParse.data.sharedVersion === sharedVersion &&
    shardParse.data.packageName === packageName &&
    shardParse.data.packageDir === packageDir
      ? shardParse.data
      : null;

  const cachedByPath = new Map<string, OwnerIndexShard['files'][number]>(
    (cached?.files ?? []).map((file) => [file.filePath, file]),
  );

  const entries = filePaths.flatMap((filePath) => {
    const text = readFileSyncIfExists(filePath);
    if (text === null) {
      return [];
    }
    const contentHash = createHash('sha256').update(text).digest('hex');
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
    const shard = ownerIndexShardContract.parse({
      schemaVersion: ownerIndexStatics.cache.schemaVersion,
      sharedVersion,
      packageName,
      packageDir,
      files: entries.map(({ file }) => file),
    });
    try {
      writeFileAtomicSync(shardPath, JSON.stringify(shard));
    } catch (error: unknown) {
      stderr.write(`[owner-index] cache shard not written: ${shardPath}: ${String(error)}\n`);
    }
    staleTempFilesRemoveLayerBroker({ cacheDir: dirname(shardPath) });
  }

  return entries.map(({ file }) => file);
};
