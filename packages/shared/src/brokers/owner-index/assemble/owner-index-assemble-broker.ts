/**
 * PURPOSE: Assembles the owner index for a repo root from per-package cache shards under
 * `<rootDir>/node_modules/.cache/dungeonmaster/owner-index/`, re-parsing only the contract files
 * added or changed since a shard was written and dropping deleted ones. Every call walks each
 * workspace package's contract files, reads and hashes them (a read and a sha256 cost little; the
 * parse is what the cache skips), reads each package's package.json for its dependencies and the
 * installed @dungeonmaster/shared's for the version every shard is keyed on (empty when none is
 * installed under the root). The merge across packages runs every call, since a brand-ref can
 * cross packages. The result is the index an uncached build of the same tree gives. Reach for
 * ownerIndexBuildBroker instead, which keeps the result for the life of the process; this one
 * goes to disk on every call.
 *
 * USAGE:
 * ownerIndexAssembleBroker({ rootDir: '/repo' });
 * // Returns OwnerIndex — owners, standaloneBrands, enums and packages
 */
import { readJsonFileSyncIfExists } from '#gateway/node/fs';

import { ownerIndexPackageContract } from '../../../contracts/owner-index-package/owner-index-package-contract';
import type { OwnerIndex } from '../../../contracts/owner-index/owner-index-contract';
import { ownerIndexShardContract } from '../../../contracts/owner-index-shard/owner-index-shard-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { isContractSourceFileGuard } from '../../../guards/is-contract-source-file/is-contract-source-file-guard';
import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';
import { indexCacheShardPathTransformer } from '../../../transformers/index-cache-shard-path/index-cache-shard-path-transformer';
import { ownerIndexFromReadsTransformer } from '../../../transformers/owner-index-from-reads/owner-index-from-reads-transformer';
import { indexCacheSharedVersionBroker } from '../../index-cache/shared-version/index-cache-shared-version-broker';
import { sourceFileWalkBroker } from '../../source-file/walk/source-file-walk-broker';
import { workspacePackageListBroker } from '../../workspace-package/list/workspace-package-list-broker';
import { packageShardReadLayerBroker } from './package-shard-read-layer-broker';

export const ownerIndexAssembleBroker = ({ rootDir }: { rootDir: string }): OwnerIndex => {
  const sharedVersion = ownerIndexShardContract.shape.sharedVersion.parse(
    indexCacheSharedVersionBroker({ rootDir }),
  );

  const walked = workspacePackageListBroker({ rootDir })
    .map((workspacePackage) => ({
      workspacePackage,
      files: sourceFileWalkBroker({
        rootDir,
        dirPath: workspacePackage.dir,
        skipFolderNames: ownerIndexStatics.walk.skipFolderNames,
        isWantedFile: isContractSourceFileGuard,
      }),
    }))
    .filter(({ files }) => files.length > 0);

  const indexedNames = new Set<string>(walked.map(({ workspacePackage }) => workspacePackage.name));

  const shards = walked.map(({ workspacePackage, files }) => {
    const parsed = packageJsonContract.safeParse(
      readJsonFileSyncIfExists(`${workspacePackage.dir}/package.json`),
    );
    const dependencies = parsed.success
      ? Object.keys(parsed.data.dependencies ?? {}).filter((dependency) =>
          indexedNames.has(dependency),
        )
      : [];
    return {
      ownerPackage: ownerIndexPackageContract.parse({
        name: workspacePackage.name,
        dir: workspacePackage.dir,
        dependencies,
      }),
      filePaths: files.filter((path) => !path.endsWith(ownerIndexStatics.layerContractSuffix)),
    };
  });

  const reads = shards.flatMap(({ ownerPackage, filePaths }) =>
    packageShardReadLayerBroker({
      shardPath: indexCacheShardPathTransformer({
        rootDir,
        folderName: ownerIndexStatics.cache.folderName,
        packageName: ownerPackage.name,
      }),
      ownerPackage,
      filePaths,
      sharedVersion,
    }),
  );

  return ownerIndexFromReadsTransformer({
    packages: shards.map(({ ownerPackage }) => ownerPackage),
    reads,
  });
};
