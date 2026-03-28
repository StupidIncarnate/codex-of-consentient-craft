/**
 * PURPOSE: Validates that each step's focusFile.path matches a known folder type and accompanyingFiles all have action create
 *
 * USAGE:
 * questStepHasValidFocusFileGuard({steps});
 * // Returns true if all focusFile paths match known folder types and accompanying files are create, false otherwise
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
    const folderType = pathToFolderTypeTransformer({
      filePath: step.focusFile.path,
      folderConfigs: folderConfigStatics,
    });

    if (!folderType) {
      return false;
    }

    for (const accompanying of step.accompanyingFiles) {
      if (step.focusFile.action === 'create' && accompanying.action !== 'create') {
        return false;
      }
    }
  }

  return true;
};
