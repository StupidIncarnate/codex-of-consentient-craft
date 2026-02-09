/**
 * PURPOSE: Validates that no quest contract entry uses raw primitive types in its properties
 *
 * USAGE:
 * questContractHasNoRawPrimitivesGuard({contracts});
 * // Returns true if no property uses raw primitives (string, number, any, object, unknown), false otherwise
 */
import type { QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { hasRawPrimitiveTypeGuard } from '../has-raw-primitive-type/has-raw-primitive-type-guard';

type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;

export const questContractHasNoRawPrimitivesGuard = ({
  contracts,
}: {
  contracts?: QuestContractEntry[];
}): boolean => {
  if (!contracts) {
    return false;
  }

  if (contracts.length === 0) {
    return true;
  }

  return !contracts.some((contract) =>
    hasRawPrimitiveTypeGuard({ properties: contract.properties }),
  );
};
