/**
 * PURPOSE: Validates that every step creating entry files has an exportName set
 *
 * USAGE:
 * questStepHasExportNameGuard({steps, folderConfigs: folderConfigStatics});
 * // Returns true if all steps with entry files have exportName, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { isEntryFileGuard } from '../is-entry-file/is-entry-file-guard';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questStepHasExportNameGuard = ({
  steps,
  folderConfigs,
}: {
  steps?: DependencyStep[];
  folderConfigs?: typeof folderConfigStatics;
}): boolean => {
  if (!steps || !folderConfigs) {
    return false;
  }

  if (steps.length === 0) {
    return true;
  }

  for (const step of steps) {
    if (step.filesToCreate.length === 0) {
      continue;
    }

    const hasEntry = step.filesToCreate.some((filePath) =>
      isEntryFileGuard({ filePath: String(filePath), folderConfigs }),
    );

    if (!hasEntry) {
      continue;
    }

    if (!step.exportName || String(step.exportName).trim().length === 0) {
      return false;
    }
  }

  return true;
};
