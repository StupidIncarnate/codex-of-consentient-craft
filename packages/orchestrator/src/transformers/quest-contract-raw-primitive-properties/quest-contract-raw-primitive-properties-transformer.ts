/**
 * PURPOSE: Returns descriptions of contract properties that use raw primitive types
 *
 * USAGE:
 * questContractRawPrimitivePropertiesTransformer({contracts});
 * // Returns ErrorMessage[] — e.g. ["contract 'LoginCredentials' property 'email' uses raw primitive 'string'"].
 */
import type {
  QuestContractEntryStub,
  QuestContractPropertyStub,
} from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;
type QuestContractProperty = ReturnType<typeof QuestContractPropertyStub>;

const rawPrimitiveBlocklist = new Set(['string', 'number', 'any', 'object', 'unknown']);

export const questContractRawPrimitivePropertiesTransformer = ({
  contracts,
}: {
  contracts?: QuestContractEntry[];
}): ErrorMessage[] => {
  if (!contracts) {
    return [];
  }

  const offenders: ErrorMessage[] = [];

  for (const contract of contracts) {
    const contractName = String(contract.name);

    // Parallel stacks — avoid declaring ad-hoc frame types inside transformer.
    const propertyStack: QuestContractProperty[] = [];
    const prefixStack: unknown[] = [];

    for (const property of contract.properties) {
      propertyStack.push(property);
      prefixStack.push('');
    }

    while (propertyStack.length > 0) {
      const property = propertyStack.pop();
      const pathPrefix = prefixStack.pop();
      if (!property) {
        continue;
      }
      const fieldPath =
        String(pathPrefix).length === 0
          ? String(property.name)
          : `${String(pathPrefix)}.${String(property.name)}`;

      if (property.type && rawPrimitiveBlocklist.has(String(property.type).toLowerCase())) {
        offenders.push(
          errorMessageContract.parse(
            `contract '${contractName}' property '${fieldPath}' uses raw primitive '${String(property.type)}'`,
          ),
        );
      }

      if (property.properties) {
        for (const child of property.properties) {
          propertyStack.push(child);
          prefixStack.push(fieldPath);
        }
      }
    }
  }

  return offenders;
};
