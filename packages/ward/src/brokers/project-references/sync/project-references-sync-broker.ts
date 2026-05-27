/**
 * PURPOSE: Syncs tsconfig.json project references for all eligible workspace packages and the root
 *
 * USAGE:
 * const result = await projectReferencesSyncBroker({ rootPath, projectFolders, checkOnly: false });
 * // Returns { status, writtenPaths, eligibleCount } — 'synced' if writes occurred, 'in-sync' if already correct
 */

import {
  absoluteFilePathContract,
  fileCountContract,
  filePathContract,
  type AbsoluteFilePath,
  type FileCount,
} from '@dungeonmaster/shared/contracts';

import type { PackageJson } from '../../../contracts/package-json/package-json-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { tsconfigJsonWritableContract } from '../../../contracts/tsconfig-json-writable/tsconfig-json-writable-contract';
import type { TsconfigSyncPair } from '../../../contracts/tsconfig-sync-pair/tsconfig-sync-pair-contract';
import { projectReferencesDeriveTransformer } from '../../../transformers/project-references-derive/project-references-derive-transformer';
import { isTsconfigPairDriftedGuard } from '../../../guards/is-tsconfig-pair-drifted/is-tsconfig-pair-drifted-guard';
import { readTsconfigSafeLayerBroker } from './read-tsconfig-safe-layer-broker';
import { tsconfigPairWriteLayerBroker } from './tsconfig-pair-write-layer-broker';
import { workspaceInputBuildLayerBroker } from './workspace-input-build-layer-broker';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const projectReferencesSyncBroker = async ({
  rootPath,
  projectFolders,
  checkOnly,
}: {
  rootPath: AbsoluteFilePath;
  projectFolders: readonly ProjectFolder[];
  checkOnly?: boolean;
}): Promise<{
  status: 'synced' | 'in-sync' | 'cycle' | 'drift';
  writtenPaths: AbsoluteFilePath[];
  eligibleCount: FileCount;
  eligibleProjectPaths: readonly ProjectFolder['path'][];
  cycle?: readonly PackageJsonName[];
  driftPaths?: readonly AbsoluteFilePath[];
}> => {
  const workspaces = await Promise.all(
    projectFolders.map(async (folder) => workspaceInputBuildLayerBroker({ folder })),
  );

  const deriveResult = projectReferencesDeriveTransformer({ workspaces, rootPath });

  const eligibleProjectPaths = workspaces
    .filter((ws) => ws.isCompositeEligible)
    .map((ws) => ws.projectPath);

  if (deriveResult.cycle !== null) {
    return {
      status: 'cycle',
      writtenPaths: [],
      eligibleCount: fileCountContract.parse(0),
      eligibleProjectPaths,
      cycle: deriveResult.cycle,
    };
  }

  const pairs: TsconfigSyncPair[] = [];

  for (const ws of workspaces) {
    if (!ws.isCompositeEligible) {
      continue;
    }
    const tsconfigPath = absoluteFilePathContract.parse(`${String(ws.projectPath)}/tsconfig.json`);
    const currentData =
      readTsconfigSafeLayerBroker({ tsconfigPath: filePathContract.parse(String(tsconfigPath)) }) ??
      tsconfigJsonWritableContract.parse({});
    const expectedRefs = deriveResult.perPackage.get(ws.projectPath) ?? [];
    pairs.push({ tsconfigPath, currentData, expectedRefs, ensureComposite: true });
  }

  const rootTsconfigPath = absoluteFilePathContract.parse(`${String(rootPath)}/tsconfig.json`);
  const rootCurrentData =
    readTsconfigSafeLayerBroker({
      tsconfigPath: filePathContract.parse(String(rootTsconfigPath)),
    }) ?? tsconfigJsonWritableContract.parse({});
  pairs.push({
    tsconfigPath: rootTsconfigPath,
    currentData: rootCurrentData,
    expectedRefs: deriveResult.root,
    ensureComposite: false,
  });

  const eligibleCount = fileCountContract.parse(pairs.length - 1);

  const driftedPairs = pairs.filter((pair) => isTsconfigPairDriftedGuard({ pair }));

  if (checkOnly === true) {
    if (driftedPairs.length > 0) {
      return {
        status: 'drift',
        writtenPaths: [],
        eligibleCount,
        eligibleProjectPaths,
        driftPaths: driftedPairs.map((p) => p.tsconfigPath),
      };
    }
    return { status: 'in-sync', writtenPaths: [], eligibleCount, eligibleProjectPaths };
  }

  if (driftedPairs.length === 0) {
    return { status: 'in-sync', writtenPaths: [], eligibleCount, eligibleProjectPaths };
  }

  const writtenPaths = await Promise.all(
    driftedPairs.map(async (pair) => tsconfigPairWriteLayerBroker({ pair })),
  );

  return { status: 'synced', writtenPaths, eligibleCount, eligibleProjectPaths };
};
