/**
 * PURPOSE: Validates that steps in folders requiring contract declarations have non-Void outputContracts
 *
 * USAGE:
 * questStepHasContractRefsGuard({steps, contracts});
 * // Returns true if all applicable steps have non-Void outputContracts, false if any use Void in contract-requiring folders
 */
import type { DependencyStep, QuestContractEntry } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { fileAnchoredStepsTransformer } from '../../transformers/file-anchored-steps/file-anchored-steps-transformer';
import { pathToFolderTypeTransformer } from '../../transformers/path-to-folder-type/path-to-folder-type-transformer';

export const questStepHasContractRefsGuard = ({
  steps,
  contracts,
}: {
  steps?: DependencyStep[];
  contracts?: QuestContractEntry[];
}): boolean => {
  if (!steps || !contracts) {
    return false;
  }

  if (contracts.length === 0) {
    return true;
  }

  if (steps.length === 0) {
    return true;
  }

  const fileSteps = fileAnchoredStepsTransformer({ steps });

  for (const step of fileSteps) {
    const focusPath = step.focusFile.path;

    const folderType = pathToFolderTypeTransformer({
      filePath: focusPath,
      folderConfigs: folderConfigStatics,
    });

    if (!folderType) {
      continue;
    }

    const needsContracts =
      folderConfigStatics[folderType as keyof typeof folderConfigStatics]
        .requireContractDeclarations;

    if (!needsContracts) {
      continue;
    }

    const isVoidOnly =
      step.outputContracts.length === 1 && String(step.outputContracts[0]) === 'Void';

    if (isVoidOnly) {
      return false;
    }
  }

  return true;
};
