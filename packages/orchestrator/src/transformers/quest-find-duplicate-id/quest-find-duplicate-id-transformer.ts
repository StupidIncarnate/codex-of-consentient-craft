/**
 * PURPOSE: Recursively searches an array of items with IDs and returns a descriptive error for the first duplicate found
 *
 * USAGE:
 * questFindDuplicateIdTransformer({items: [{id: 'a'}, {id: 'a'}], context: 'flows'});
 * // Returns: 'Duplicate ID "a" in flows — this ID already exists. Use a unique ID or omit to leave existing unchanged.'
 */

import type { ErrorMessage, ItemWithId } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import { isArrayOfItemsWithIdGuard } from '../../guards/is-array-of-items-with-id/is-array-of-items-with-id-guard';

export const questFindDuplicateIdTransformer = ({
  items,
  context,
}: {
  items: ItemWithId[];
  context: ErrorMessage;
}): ErrorMessage | undefined => {
  const seen = new Set<unknown>();

  for (const item of items) {
    if (seen.has(item.id)) {
      return errorMessageContract.parse(
        `Duplicate ID "${String(item.id)}" in ${context} — this ID already exists. Use a unique ID or omit to leave existing unchanged.`,
      );
    }
    seen.add(item.id);

    for (const key of Object.keys(item)) {
      const valueParams = { value: item[key] };
      if (isArrayOfItemsWithIdGuard(valueParams)) {
        const nestedContext = errorMessageContract.parse(`${context}[${String(item.id)}].${key}`);
        const nested = questFindDuplicateIdTransformer({
          items: valueParams.value,
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
