/**
 * PURPOSE: Finds the first duplicate ID in a modify-quest input and returns a descriptive error message
 *
 * USAGE:
 * questDuplicateIdMessageTransformer({updates: {flows: [FlowStub({id: 'a'}), FlowStub({id: 'a'})]}});
 * // Returns: 'Duplicate ID "a" in flows — this ID already exists. Use a unique ID or omit to leave existing unchanged.'
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { isArrayOfItemsWithIdGuard } from '../../guards/is-array-of-items-with-id/is-array-of-items-with-id-guard';
import { questFindDuplicateIdTransformer } from '../quest-find-duplicate-id/quest-find-duplicate-id-transformer';

export const questDuplicateIdMessageTransformer = ({
  updates,
}: {
  updates: Record<PropertyKey, unknown>;
}): ErrorMessage | undefined => {
  for (const key of Object.keys(updates)) {
    const valueParams = { value: updates[key] };
    if (isArrayOfItemsWithIdGuard(valueParams)) {
      const duplicate = questFindDuplicateIdTransformer({
        items: valueParams.value,
        context: errorMessageContract.parse(key),
      });
      if (duplicate) {
        return duplicate;
      }
    }
  }

  return undefined;
};
