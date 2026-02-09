/**
 * PURPOSE: Validates that every step's inputContracts and outputContracts reference existing contract names
 *
 * USAGE:
 * questStepHasValidContractRefsGuard({steps, contracts});
 * // Returns true if all contract references in steps exist in the contracts array, false otherwise
 */
import type { DependencyStepStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questStepHasValidContractRefsGuard = ({
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

  const contractNames = new Set(contracts.map((c) => c.name));

  for (const step of steps) {
    for (const inputName of step.inputContracts) {
      if (!contractNames.has(inputName)) {
        return false;
      }
    }

    for (const outputName of step.outputContracts) {
      if (!contractNames.has(outputName)) {
        return false;
      }
    }
  }

  return true;
};
