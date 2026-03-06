/**
 * PURPOSE: Checks if an array of items with `id` contains any duplicate IDs, recursing into nested id-arrays
 *
 * USAGE:
 * hasDuplicateIdInArrayGuard({items: [{id: 'a'}, {id: 'a'}]});
 * // Returns true if duplicates found
 */

import type { ItemWithId } from '../../contracts/item-with-id/item-with-id-contract';

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
      const valueParams = { value: item[key] };
      if (isArrayOfItemsWithIdGuard(valueParams)) {
        if (hasDuplicateIdInArrayGuard({ items: valueParams.value })) {
          return true;
        }
      }
    }
  }

  return false;
};
