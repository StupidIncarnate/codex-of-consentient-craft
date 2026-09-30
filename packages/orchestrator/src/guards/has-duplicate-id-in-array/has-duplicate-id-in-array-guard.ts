/**
 * PURPOSE: Checks if an array of items with `id` contains any duplicate IDs, recursing into nested id-arrays
 *
 * USAGE:
 * hasDuplicateIdInArrayGuard({items: [{id: 'a'}, {id: 'a'}]});
 * // Returns true if duplicates found
 */

import type { ItemWithId } from '@dungeonmaster/shared/contracts';

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
      const candidate = { value: item[key] };
      if (isArrayOfItemsWithIdGuard(candidate)) {
        if (hasDuplicateIdInArrayGuard({ items: candidate.value })) {
          return true;
        }
      }
    }
  }

  return false;
};
