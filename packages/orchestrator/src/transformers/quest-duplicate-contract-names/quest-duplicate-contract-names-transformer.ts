/**
 * PURPOSE: Returns descriptive errors for duplicated contract names in a quest, citing the existing entry's source path so the conflicting writer can self-resolve (empty array = no duplicates)
 *
 * USAGE:
 * questDuplicateContractNamesTransformer({contracts});
 * // Returns ErrorMessage[] — each entry names the duplicate contract and the existing entry's source path,
 * // e.g. ["Contract `LoginCredentials` already declared with source `packages/shared/src/contracts/login-credentials/login-credentials-contract.ts`. Either remove your write, change source to a shared path, or rename your contract."].
 */
import type { QuestContractEntry } from '@dungeonmaster/shared/contracts';

export const questDuplicateContractNamesTransformer = ({
  contracts,
}: {
  contracts?: QuestContractEntry[];
}): string[] => {
  if (!contracts) {
    return [];
  }

  const firstSeenSourceByName = new Map<unknown, unknown>();
  const reportedNames = new Set<unknown>();
  const offenders: string[] = [];

  for (const contract of contracts) {
    const name = String(contract.name);
    const source = String(contract.source);

    if (!firstSeenSourceByName.has(name)) {
      firstSeenSourceByName.set(name, source);
      continue;
    }

    if (reportedNames.has(name)) {
      continue;
    }
    reportedNames.add(name);

    const existingSource = String(firstSeenSourceByName.get(name));
    offenders.push(
      `Contract \`${name}\` already declared with source \`${existingSource}\`. Either remove your write, change source to a shared path, or rename your contract.`,
    );
  }

  return offenders;
};
