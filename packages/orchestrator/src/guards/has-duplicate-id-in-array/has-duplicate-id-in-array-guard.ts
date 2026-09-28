/**
 * PURPOSE: Checks if an array of items with `id` contains any duplicate IDs, recursing into nested id-arrays
 *
 * USAGE:
 * hasDuplicateIdInArrayGuard({items: [{id: 'a'}, {id: 'a'}]});
 * // Returns true if duplicates found
 */

import type { ItemWithId } from '@dungeonmaster/shared/contracts';
import { itemWithIdContract } from '@dungeonmaster/shared/contracts';

import { isArrayOfItemsWithIdGuard } from '../is-array-of-items-with-id/is-array-of-items-with-id-guard';

export const hasDuplicateIdInArrayGuard = ({ items }: { items?: ItemWithId[] }): boolean => {
  if (!items) {
    return false;
  }

  const seen = new Set<unknown>();

  for (const item of items) {
    if (seen.has(item.id)) {
      return true;
    }
    seen.add(item.id);

    for (const key of Object.keys(item)) {
      const propertyValue = item[key];
      if (isArrayOfItemsWithIdGuard({ value: propertyValue }) && Array.isArray(propertyValue)) {
        const nestedItems = propertyValue.map((entry) => itemWithIdContract.parse(entry));
        if (hasDuplicateIdInArrayGuard({ items: nestedItems })) {
          return true;
        }
      }
    }
  }

  return false;
};
