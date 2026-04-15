/**
 * PURPOSE: Returns the list of duplicated contract names in a quest (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateContractNamesTransformer({contracts});
 * // Returns ErrorMessage[] — each entry is a duplicated contract name, e.g. ["LoginCredentials"].
 */
import type { QuestContractEntryStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questDuplicateContractNamesTransformer = ({
  contracts,
}: {
  contracts?: QuestContractEntry[];
}): ErrorMessage[] => {
  if (!contracts) {
    return [];
  }

  const seen = new Set<unknown>();
  const duplicates = new Set<unknown>();

  for (const contract of contracts) {
    const name = String(contract.name);
    if (seen.has(name)) {
      duplicates.add(name);
    } else {
      seen.add(name);
    }
  }

  return Array.from(duplicates).map((name) => errorMessageContract.parse(String(name)));
};
