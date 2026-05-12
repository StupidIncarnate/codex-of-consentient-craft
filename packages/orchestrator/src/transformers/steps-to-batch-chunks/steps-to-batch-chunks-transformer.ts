/**
 * PURPOSE: Groups DependencyStep[] into batch chunks by folder type according to `agents.batchGroups`, capping each chunk at `defaultMaxStepsPerChunkStatics.value` so a single codeweaver/lawbringer never owns more than that many steps
 *
 * USAGE:
 * stepsToBatchChunksTransformer({ steps, batchGroups: [['contracts', 'statics']] });
 * // Returns DependencyStep[][] — each inner array is one batch: same-group steps collapse, capped at the static; ungrouped stay solo
 */

import {
  arrayIndexContract,
  type ArrayIndex,
  type DependencyStep,
  type FolderType,
  type FolderTypeGroups,
} from '@dungeonmaster/shared/contracts';
import { defaultMaxStepsPerChunkStatics, folderConfigStatics } from '@dungeonmaster/shared/statics';

import { pathToFolderTypeTransformer } from '../path-to-folder-type/path-to-folder-type-transformer';

export const stepsToBatchChunksTransformer = ({
  steps,
  batchGroups,
}: {
  steps: DependencyStep[];
  batchGroups: FolderTypeGroups;
}): DependencyStep[][] => {
  const maxStepsPerChunk = defaultMaxStepsPerChunkStatics.value;

  const groupOf = new Map<FolderType, ArrayIndex>();
  batchGroups.forEach((group, index) => {
    const brandedIndex = arrayIndexContract.parse(index);
    for (const folderType of group) {
      groupOf.set(folderType, brandedIndex);
    }
  });

  const result: DependencyStep[][] = [];
  const accumulators = new Map<ArrayIndex, DependencyStep[]>();

  for (const step of steps) {
    const filePath = step.focusFile?.path;
    const folderType =
      filePath === undefined
        ? undefined
        : pathToFolderTypeTransformer({ filePath, folderConfigs: folderConfigStatics });

    const groupIndex = folderType === undefined ? undefined : groupOf.get(folderType);

    if (groupIndex === undefined) {
      result.push([step]);
      continue;
    }

    const existing = accumulators.get(groupIndex);
    if (existing) {
      existing.push(step);
    } else {
      accumulators.set(groupIndex, [step]);
    }
  }

  batchGroups.forEach((_group, index) => {
    const brandedIndex = arrayIndexContract.parse(index);
    const accumulated = accumulators.get(brandedIndex);
    if (accumulated) {
      for (let i = 0; i < accumulated.length; i += maxStepsPerChunk) {
        result.push(accumulated.slice(i, i + maxStepsPerChunk));
      }
    }
  });

  return result;
};
