/**
 * PURPOSE: Recursively searches an array of items with IDs and returns a descriptive error for the first duplicate found
 *
 * USAGE:
 * questFindDuplicateIdTransformer({items: [{id: 'a'}, {id: 'a'}], context: 'flows'});
 * // Returns: 'Duplicate ID "a" in flows — this ID already exists. Use a unique ID or omit to leave existing unchanged.'
 */

import type { ItemWithId } from '@dungeonmaster/shared/contracts';
import { itemWithIdContract } from '@dungeonmaster/shared/contracts';

import { isArrayOfItemsWithIdGuard } from '../../guards/is-array-of-items-with-id/is-array-of-items-with-id-guard';

export const questFindDuplicateIdTransformer = ({
  items,
  context,
}: {
  items: ItemWithId[];
  context: string;
}): string | undefined => {
  const seen = new Set<unknown>();

  for (const item of items) {
    if (seen.has(item.id)) {
      return `Duplicate ID "${String(item.id)}" in ${context} — this ID already exists. Use a unique ID or omit to leave existing unchanged.`;
    }
    seen.add(item.id);

    for (const key of Object.keys(item)) {
      const propertyValue = item[key];
      if (isArrayOfItemsWithIdGuard({ value: propertyValue }) && Array.isArray(propertyValue)) {
        const nestedItems = propertyValue.map((entry) => itemWithIdContract.parse(entry));
        const nestedContext = `${context}[${String(item.id)}].${key}`;
        const nested = questFindDuplicateIdTransformer({
          items: nestedItems,
          context: nestedContext,
        });
        if (nested) {
          return nested;
        }
      }
    }
  }

  return undefined;
};
