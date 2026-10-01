/**
 * PURPOSE: Assembles the contract index for a repo root from per-package cache shards under
 * `<rootDir>/node_modules/.cache/dungeonmaster/contract-index/`, re-parsing only source files added
 * or changed since a shard was written. Every call walks each workspace package for production and
 * harness `.ts` then `.tsx` files (skipping `node_modules` and `dist`), reads and hashes them, and
 * resolves every imported name across files — the one step no shard can hold, since it depends on
 * other files. The result is the index an uncached build of the same tree gives. Reach for
 * contractIndexBuildBroker instead, which keeps the result for the life of the process; this one
 * goes to disk on every call.
 *
 * USAGE:
 * contractIndexAssembleBroker({ rootDir: '/repo' });
 * // Returns ContractIndexEntry[] — one per `-contract.ts` file
 */
import type { ContractIndexEntry } from '../../../contracts/contract-index-entry/contract-index-entry-contract';
import { contractIndexShardContract } from '../../../contracts/contract-index-shard/contract-index-shard-contract';
import { isContractParseSourceFileGuard } from '../../../guards/is-contract-parse-source-file/is-contract-parse-source-file-guard';
import { contractIndexStatics } from '../../../statics/contract-index/contract-index-statics';
import { contractIndexFromReadsTransformer } from '../../../transformers/contract-index-from-reads/contract-index-from-reads-transformer';
import { indexCacheShardPathTransformer } from '../../../transformers/index-cache-shard-path/index-cache-shard-path-transformer';
import { indexCacheSharedVersionBroker } from '../../index-cache/shared-version/index-cache-shared-version-broker';
import { sourceFileWalkBroker } from '../../source-file/walk/source-file-walk-broker';
import { workspacePackageListBroker } from '../../workspace-package/list/workspace-package-list-broker';
import { contractShardReadLayerBroker } from './contract-shard-read-layer-broker';

export const contractIndexAssembleBroker = ({
  rootDir,
}: {
  rootDir: string;
}): ContractIndexEntry[] => {
  const sharedVersion = contractIndexShardContract.shape.sharedVersion.parse(
    indexCacheSharedVersionBroker({ rootDir }),
  );
  const packages = workspacePackageListBroker({ rootDir });

  const files = packages.flatMap((workspacePackage) => {
    const walked = sourceFileWalkBroker({
      rootDir,
      dirPath: workspacePackage.dir,
      skipFolderNames: contractIndexStatics.walk.skipFolderNames,
      isWantedFile: isContractParseSourceFileGuard,
    });
    return contractShardReadLayerBroker({
      rootDir,
      shardPath: indexCacheShardPathTransformer({
        rootDir,
        folderName: contractIndexStatics.cache.folderName,
        packageName: workspacePackage.name,
      }),
      workspacePackage,
      filePaths: contractIndexStatics.scan.sourceSuffixes.flatMap((suffix) =>
        walked.filter((filePath) => filePath.endsWith(suffix)),
      ),
      sharedVersion,
    });
  });

  return contractIndexFromReadsTransformer({ rootDir, packages, files });
};
