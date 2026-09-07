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

  const packagePairs: TsconfigSyncPair[] = [];

  for (const ws of workspaces) {
    if (!ws.isCompositeEligible) {
      continue;
    }
    const tsconfigPath = absoluteFilePathContract.parse(`${String(ws.projectPath)}/tsconfig.json`);
    const currentRead = readTsconfigSafeLayerBroker({
      tsconfigPath: filePathContract.parse(String(tsconfigPath)),
    });
    if (currentRead.status !== 'parsed') {
      continue;
    }
    const expectedRefs = deriveResult.perPackage.get(ws.projectPath) ?? [];
    packagePairs.push({
      tsconfigPath,
      currentData: currentRead.data,
      expectedRefs,
      ensureComposite: true,
    });
  }

  // THE ROOT CONFIG HAS NO ELIGIBILITY TEST, and that is what made it the dangerous one. A package
  // whose tsconfig failed to parse was already skipped as ineligible; the root fell through to an
  // empty object and was then written from it, so a reader's `strict`, `target` and `paths` were
  // replaced by a bare `references` array — data loss, in a published tool, announced as one line
  // on stderr. Comments are not an exotic input either: `tsc --init` emits them.
  //
  // Absent is a separate answer from unreadable, and both refuse the write. Creating a root
  // tsconfig a repo never had belongs to `dungeonmaster init`, not to a quality checker.
  const rootTsconfigPath = absoluteFilePathContract.parse(`${String(rootPath)}/tsconfig.json`);
  const rootRead = readTsconfigSafeLayerBroker({
    tsconfigPath: filePathContract.parse(String(rootTsconfigPath)),
  });

  if (rootRead.status === 'unparseable') {
    process.stderr.write(
      `ward: ${String(rootTsconfigPath)} is not valid JSON, so its project references were left alone\n`,
    );
  }

  const pairs: TsconfigSyncPair[] =
    rootRead.status === 'parsed'
      ? [
          ...packagePairs,
          {
            tsconfigPath: rootTsconfigPath,
            currentData: rootRead.data,
            expectedRefs: deriveResult.root,
            ensureComposite: false,
          },
        ]
      : packagePairs;

  const eligibleCount = fileCountContract.parse(eligibleProjectPaths.length);

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
