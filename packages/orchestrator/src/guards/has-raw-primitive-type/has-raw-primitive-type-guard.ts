/**
 * PURPOSE: Checks if any property in a list (including nested properties) uses a raw primitive type
 *
 * USAGE:
 * hasRawPrimitiveTypeGuard({properties});
 * // Returns true if any property has a raw primitive type (string, number, any, object, unknown), false otherwise
 */
import type { QuestContractPropertyStub } from '@dungeonmaster/shared/contracts';

type QuestContractProperty = ReturnType<typeof QuestContractPropertyStub>;

const rawPrimitiveBlocklist = new Set(['string', 'number', 'any', 'object', 'unknown']);

export const hasRawPrimitiveTypeGuard = ({
  properties,
}: {
  properties?: QuestContractProperty[];
}): boolean => {
  if (!properties) {
    return false;
  }

  for (const property of properties) {
    if (property.type && rawPrimitiveBlocklist.has(String(property.type).toLowerCase())) {
      return true;
    }

    if (property.properties && hasRawPrimitiveTypeGuard({ properties: property.properties })) {
      return true;
    }
  }

  return false;
};
