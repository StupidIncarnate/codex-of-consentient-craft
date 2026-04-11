/**
 * PURPOSE: Validates that every step creating entry files has an exportName set
 *
 * USAGE:
 * questStepHasExportNameGuard({steps, folderConfigs: folderConfigStatics});
 * // Returns true if all steps with entry files have exportName, false otherwise
 */
import type { DependencyStep } from '@dungeonmaster/shared/contracts';
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { fileAnchoredStepsTransformer } from '../../transformers/file-anchored-steps/file-anchored-steps-transformer';
import { isEntryFileGuard } from '../is-entry-file/is-entry-file-guard';

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

  const fileSteps = fileAnchoredStepsTransformer({ steps });

  for (const step of fileSteps) {
    const isEntry = isEntryFileGuard({ filePath: String(step.focusFile.path), folderConfigs });

    if (!isEntry) {
      continue;
    }

    if (!step.exportName || String(step.exportName).trim().length === 0) {
      return false;
    }
  }

  return true;
};
