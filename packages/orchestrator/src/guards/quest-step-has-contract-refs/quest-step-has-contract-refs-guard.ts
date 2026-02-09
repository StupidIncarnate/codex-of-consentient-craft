/**
 * PURPOSE: Validates that steps in folders requiring contract declarations have non-empty outputContracts
 *
 * USAGE:
 * questStepHasContractRefsGuard({steps, contracts});
 * // Returns true if all applicable steps have non-empty outputContracts, false if any are missing
 */
import type {
  DependencyStepStub,
  FolderType,
  QuestContractEntryStub,
} from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

type DependencyStep = ReturnType<typeof DependencyStepStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

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

  for (const step of steps) {
    const allFiles = [...step.filesToCreate.map(String), ...step.filesToModify.map(String)];

    if (allFiles.length === 0) {
      continue;
    }

    const folderTypes = allFiles.reduce<FolderType[]>((acc, fp) => {
      const [, candidate] = /src\/([^/]+)\//u.exec(fp) ?? [];
      if (!candidate) {
        return acc;
      }
      if (candidate in folderConfigStatics) {
        acc.push(candidate as FolderType);
      }
      return acc;
    }, []);

    const needsContracts = folderTypes.some(
      (ft) =>
        folderConfigStatics[ft as keyof typeof folderConfigStatics].requireContractDeclarations,
    );

    if (needsContracts && step.outputContracts.length === 0) {
      return false;
    }
  }

  return true;
};
