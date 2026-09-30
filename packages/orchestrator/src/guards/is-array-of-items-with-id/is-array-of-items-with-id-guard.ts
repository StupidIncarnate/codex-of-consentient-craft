/**
 * PURPOSE: Checks if a value is a non-empty array of objects that each carry a string `id` and, when
 * present, a boolean `_delete`, narrowing the params so the caller reads `params.value` as `ItemWithId[]`
 *
 * USAGE:
 * const candidate = { value: [{id: 'node-1', label: 'X'}] };
 * if (isArrayOfItemsWithIdGuard(candidate)) { candidate.value; }
 * // Returns true if every item is an object with a string `id`
 */

import type { ItemWithId } from '@dungeonmaster/shared/contracts';

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

  return value.every(
    (item: unknown) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      typeof item.id === 'string' &&
      (!('_delete' in item) || item._delete === undefined || typeof item._delete === 'boolean'),
  );
};
