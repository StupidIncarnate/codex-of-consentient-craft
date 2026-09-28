/**
 * PURPOSE: Validates that no duplicate IDs exist within any array in a modify-quest input
 *
 * USAGE:
 * questHasUniqueSiblingIdsGuard({updates: {flows: [FlowStub({id: 'a'}), FlowStub({id: 'b'})]}});
 * // Returns true if all sibling arrays contain unique IDs
 */

import { itemWithIdContract } from '@dungeonmaster/shared/contracts';

import { isArrayOfItemsWithIdGuard } from '../is-array-of-items-with-id/is-array-of-items-with-id-guard';
import { hasDuplicateIdInArrayGuard } from '../has-duplicate-id-in-array/has-duplicate-id-in-array-guard';

export const questHasUniqueSiblingIdsGuard = ({
  updates,
}: {
  updates?: Record<PropertyKey, unknown>;
}): boolean => {
  if (!updates) {
    return true;
  }

  for (const key of Object.keys(updates)) {
    const propertyValue = updates[key];
    if (isArrayOfItemsWithIdGuard({ value: propertyValue }) && Array.isArray(propertyValue)) {
      const items = propertyValue.map((entry) => itemWithIdContract.parse(entry));
      if (hasDuplicateIdInArrayGuard({ items })) {
        return false;
      }
    }
  }

  return true;
};
