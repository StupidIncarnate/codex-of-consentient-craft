/**
 * PURPOSE: Returns one package's files for the contract index, each with its per-file read or null,
 * re-parsing only files whose text no longer hashes to what the package's cache shard recorded. A
 * file is read (and hashed) on every call; one that is neither a contract file nor mentions
 * `ontract` gets a null read and no cache entry, exactly as an uncached build skips it. A file that
 * vanished after the walk is left out. A shard that is missing, unparseable, or written under
 * another schema version, another installed @dungeonmaster/shared, or for another package or folder
 * counts as empty. The shard is rewritten through indexCacheShardWriteBroker only when a file was
 * re-parsed or one dropped out.
 *
 * USAGE:
 * contractShardReadLayerBroker({ rootDir, shardPath, workspacePackage, filePaths, sharedVersion: '0.1.0' });
 * // Returns [{ filePath, read: ContractIndexFileRead | null }] in the order of `filePaths`
 */
import { readFileSyncIfExists } from '#gateway/node/fs';

import type { ContractIndexFileRead } from '../../../contracts/contract-index-file-read/contract-index-file-read-contract';
import type { ContractIndexPackage } from '../../../contracts/contract-index-package/contract-index-package-contract';
import { contractIndexShardContract } from '../../../contracts/contract-index-shard/contract-index-shard-contract';
import type { ContractIndexShard } from '../../../contracts/contract-index-shard/contract-index-shard-contract';
import { isContractSourceFileGuard } from '../../../guards/is-contract-source-file/is-contract-source-file-guard';
import { contractIndexStatics } from '../../../statics/contract-index/contract-index-statics';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { contractIndexFileReadTransformer } from '../../../transformers/contract-index-file-read/contract-index-file-read-transformer';
import { indexCacheShardReadBroker } from '../../index-cache/shard-read/index-cache-shard-read-broker';
import { indexCacheShardWriteBroker } from '../../index-cache/shard-write/index-cache-shard-write-broker';

export const contractShardReadLayerBroker = ({
  rootDir,
  shardPath,
  workspacePackage,
  filePaths,
  sharedVersion,
}: {
  rootDir: string;
  shardPath: string;
  workspacePackage: ContractIndexPackage;
  filePaths: string[];
  sharedVersion: ContractIndexShard['sharedVersion'];
}): { filePath: string; read: ContractIndexFileRead | null }[] => {
  const { name: packageName, dir: packageDir } = workspacePackage;
  const shard = indexCacheShardReadBroker({
    shardPath,
    parse: (value: unknown) => {
      const parsed = contractIndexShardContract.safeParse(value);
      return parsed.success ? parsed.data : null;
    },
  });
  const cached =
    shard !== null &&
    shard.schemaVersion === contractIndexStatics.cache.schemaVersion &&
    shard.sharedVersion === sharedVersion &&
    shard.packageName === packageName &&
    shard.packageDir === packageDir
      ? shard
      : null;

  const cachedByPath = new Map<string, ContractIndexShard['files'][number]>(
    (cached?.files ?? []).map((file) => [file.filePath, file]),
  );

  const entries = filePaths.flatMap((filePath) => {
    const text = readFileSyncIfExists(filePath);
    if (text === null) {
      return [];
    }
    const isContractFile = isContractSourceFileGuard({
      relativePath: filePath.slice(rootDir.length + 1),
    });
    const isRead = isContractFile || text.includes('ontract');
    const contentHash = isRead ? contentHashTransformer({ text }) : '';
    const hit = isRead ? cachedByPath.get(filePath) : undefined;
    const file = isRead
      ? hit !== undefined && hit.contentHash === contentHash
        ? hit
        : contractIndexShardContract.shape.files.element.parse({
            filePath,
            contentHash,
            read: contractIndexFileReadTransformer({ filePath, text, isContractFile }),
          })
      : null;
    return [{ filePath, file, isReparsed: file !== null && file !== hit }];
  });

  const shardFiles = entries.flatMap(({ file }) => (file === null ? [] : [file]));
  if (
    cached === null ||
    cached.files.length !== shardFiles.length ||
    entries.some(({ isReparsed }) => isReparsed)
  ) {
    indexCacheShardWriteBroker({
      shardPath,
      shard: contractIndexShardContract.parse({
        schemaVersion: contractIndexStatics.cache.schemaVersion,
        sharedVersion,
        packageName,
        packageDir,
        files: shardFiles,
      }),
    });
  }

  return entries.map(({ filePath, file }) => ({
    filePath,
    read: file === null ? null : file.read,
  }));
};
