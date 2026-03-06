/**
 * PURPOSE: Checks if a value is an array of objects that each contain an `id` property
 *
 * USAGE:
 * isArrayOfItemsWithIdGuard({value: [{id: 'node-1', label: 'X'}]});
 * // Returns true if all items are objects with an `id` property
 */

import type { ItemWithId } from '../../contracts/item-with-id/item-with-id-contract';

export const isArrayOfItemsWithIdGuard = (params: {
  value?: unknown;
}): params is { value: ItemWithId[] } => {
  const { value } = params;

  if (!value) {
    return false;
  }

  if (!Array.isArray(value)) {
    return false;
  }

  if (value.length === 0) {
    return false;
  }

  return value.every((item) => typeof item === 'object' && item !== null && 'id' in item);
};
