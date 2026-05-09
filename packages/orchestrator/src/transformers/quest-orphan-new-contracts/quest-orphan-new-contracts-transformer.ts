/**
 * PURPOSE: Returns descriptions of contracts marked status:'new' that are not produced by any step's outputContracts
 *
 * USAGE:
 * questOrphanNewContractsTransformer({contracts, steps});
 * // Returns ErrorMessage[] — e.g. ["contract 'LoginCredentials' (source 'packages/.../login-credentials-contract.ts') has status 'new' but is not produced by any step's outputContracts"].
 */
import type { DependencyStepStub, QuestContractEntryStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questOrphanNewContractsTransformer = ({
  contracts,
  steps,
}: {
  contracts?: QuestContractEntry[];
  steps?: DependencyStep[];
}): ErrorMessage[] => {
  if (!contracts || contracts.length === 0) {
    return [];
  }

  const producedContractNames = new Set<unknown>();
  if (steps) {
    for (const step of steps) {
      for (const outputContract of step.outputContracts) {
        producedContractNames.add(String(outputContract));
      }
    }
  }

  const offenders: ErrorMessage[] = [];

  for (const contract of contracts) {
    if (contract.status !== 'new') {
      continue;
    }
    const name = String(contract.name);
    if (!producedContractNames.has(name)) {
      offenders.push(
        errorMessageContract.parse(
          `contract '${name}' (source '${String(contract.source)}') has status 'new' but is not produced by any step's outputContracts`,
        ),
      );
    }
  }

  return offenders;
};
