/**
 * PURPOSE: Validates that each step's focusFile.path matches a known folder type
 *
 * USAGE:
 * questStepHasValidFocusFileGuard({steps});
 * // Returns true if all focusFile paths match known folder types, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { pathToFolderTypeTransformer } from '../../transformers/path-to-folder-type/path-to-folder-type-transformer';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

export const questStepHasValidFocusFileGuard = ({
  steps,
}: {
  steps?: DependencyStep[];
}): boolean => {
  if (!steps) {
    return false;
  }

  for (const step of steps) {
    if (step.focusFile === undefined) {
      continue;
    }
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
