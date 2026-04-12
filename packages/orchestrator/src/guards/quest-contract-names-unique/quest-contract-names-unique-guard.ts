/**
 * PURPOSE: Validates that all contract entry names are unique within a quest
 *
 * USAGE:
 * questContractNamesUniqueGuard({contracts});
 * // Returns true if no two contracts share the same name, false otherwise
 *
 * WHEN-TO-USE: validate-spec pipeline, to catch duplicate contract names that would collide when referenced by steps.
 */
import type { QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questContractNamesUniqueGuard = ({
  contracts,
}: {
  contracts?: QuestContractEntry[];
}): boolean => {
  if (!contracts) {
    return false;
  }

  const seen = new Set<unknown>();

  for (const contract of contracts) {
    const name = String(contract.name);
    if (seen.has(name)) {
      return false;
    }
    seen.add(name);
  }

  return true;
};
