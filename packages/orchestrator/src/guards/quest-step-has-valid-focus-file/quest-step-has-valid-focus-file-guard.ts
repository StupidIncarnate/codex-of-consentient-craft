/**
 * PURPOSE: Validates that each step's focusFile.path matches a known folder type
 *
 * USAGE:
 * questStepHasValidFocusFileGuard({steps});
 * // Returns true if all focusFile paths match known folder types, false otherwise
 */
import type { DependencyStep } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { fileAnchoredStepsTransformer } from '../../transformers/file-anchored-steps/file-anchored-steps-transformer';
import { pathToFolderTypeTransformer } from '../../transformers/path-to-folder-type/path-to-folder-type-transformer';

export const questStepHasValidFocusFileGuard = ({
  steps,
}: {
  steps?: DependencyStep[];
}): boolean => {
  if (!steps) {
    return false;
  }

  const fileSteps = fileAnchoredStepsTransformer({ steps });

  for (const step of fileSteps) {
    const folderType = pathToFolderTypeTransformer({
      filePath: step.focusFile.path,
      folderConfigs: folderConfigStatics,
    });

    if (!folderType) {
      return false;
    }
  }

  return true;
};
