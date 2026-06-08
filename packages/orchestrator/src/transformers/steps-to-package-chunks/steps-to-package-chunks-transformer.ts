/**
 * PURPOSE: Groups codeweaver DependencyStep[] into per-package chunks, EXCLUDING flows/ and
 * startup/ folder-type steps (those are owned by the Flowrider role). Each package's steps form
 * one chunk, split when the package exceeds codeweaverMaxFilesPerChunkStatics.value implementation
 * files. Steps with no focusFile or no resolvable package land in their own solo chunk.
 *
 * USAGE:
 * stepsToPackageChunksTransformer({ steps });
 * // Returns DependencyStep[][] — one chunk per package (flow/startup steps removed), capped at 20.
 */

import type { DependencyStep, FolderType, PackageName } from '@dungeonmaster/shared/contracts';
import { folderTypeContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { codeweaverMaxFilesPerChunkStatics } from '../../statics/codeweaver-max-files-per-chunk/codeweaver-max-files-per-chunk-statics';
import { flowTestOwnedFolderTypesStatics } from '../../statics/flow-test-owned-folder-types/flow-test-owned-folder-types-statics';
import { pathToFolderTypeTransformer } from '../path-to-folder-type/path-to-folder-type-transformer';

export const stepsToPackageChunksTransformer = ({
  steps,
}: {
  steps: DependencyStep[];
}): DependencyStep[][] => {
  const maxFiles = codeweaverMaxFilesPerChunkStatics.value;
  const ownedFolderTypes = new Set<FolderType>(
    flowTestOwnedFolderTypesStatics.value.map((ft) => folderTypeContract.parse(ft)),
  );

  // First-seen-ordered buckets keyed by package name. Steps with no resolvable package emit solo,
  // matching the ungrouped behavior of the prior folder-type chunker.
  const packageBuckets = new Map<PackageName, DependencyStep[]>();
  const soloChunks: DependencyStep[][] = [];

  for (const step of steps) {
    const filePath = step.focusFile?.path;
    const folderType: FolderType | undefined =
      filePath === undefined
        ? undefined
        : pathToFolderTypeTransformer({ filePath, folderConfigs: folderConfigStatics });

    // flows/ + startup/ steps belong to Flowrider, not Codeweaver.
    if (folderType !== undefined && ownedFolderTypes.has(folderType)) {
      continue;
    }

    const packageMatch =
      filePath === undefined ? null : /packages\/([^/]+)\//u.exec(String(filePath));
    const packageSegment = packageMatch?.[1];

    if (packageSegment === undefined) {
      soloChunks.push([step]);
      continue;
    }

    const packageName = packageNameContract.parse(packageSegment);
    const existing = packageBuckets.get(packageName);
    if (existing) {
      existing.push(step);
    } else {
      packageBuckets.set(packageName, [step]);
    }
  }

  const result: DependencyStep[][] = [];
  for (const bucket of packageBuckets.values()) {
    for (let i = 0; i < bucket.length; i += maxFiles) {
      result.push(bucket.slice(i, i + maxFiles));
    }
  }
  result.push(...soloChunks);

  return result;
};
