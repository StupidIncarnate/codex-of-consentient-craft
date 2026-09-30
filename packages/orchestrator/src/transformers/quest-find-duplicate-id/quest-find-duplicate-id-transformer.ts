/**
 * PURPOSE: Recursively searches an array of items with IDs and returns a descriptive error for the first duplicate found
 *
 * USAGE:
 * questFindDuplicateIdTransformer({items: [{id: 'a'}, {id: 'a'}], context: 'flows'});
 * // Returns: 'Duplicate ID "a" in flows — this ID already exists. Use a unique ID or omit to leave existing unchanged.'
 */

import type { ItemWithId } from '@dungeonmaster/shared/contracts';

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
      return `Duplicate ID "${item.id}" in ${context} — this ID already exists. Use a unique ID or omit to leave existing unchanged.`;
    }
    seen.add(item.id);

    for (const key of Object.keys(item)) {
      const candidate = { value: item[key] };
      if (isArrayOfItemsWithIdGuard(candidate)) {
        const nestedContext = `${context}[${item.id}].${key}`;
        const nested = questFindDuplicateIdTransformer({
          items: candidate.value,
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
