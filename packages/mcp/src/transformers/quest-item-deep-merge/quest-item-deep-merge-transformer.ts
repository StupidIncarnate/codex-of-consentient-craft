/**
 * PURPOSE: Deep merges two items with id fields, recursing into arrays of id-bearing objects
 *
 * USAGE:
 * questItemDeepMergeTransformer({ existing: {id: '1', nodes: [{id: 'n1'}]}, update: {id: '1', nodes: [{id: 'n2'}]} });
 * // Returns: {id: '1', nodes: [{id: 'n1'}, {id: 'n2'}]}
 *
 * MERGE SEMANTICS:
 * - Scalar fields: overwrite with update value
 * - Array fields containing items with `id`: recurse via questArrayUpsertTransformer
 * - Array fields without `id` items: replace entirely
 */

import type { ItemWithId } from '../../contracts/item-with-id/item-with-id-contract';

import { isArrayOfItemsWithIdGuard } from '../../guards/is-array-of-items-with-id/is-array-of-items-with-id-guard';
import { questArrayUpsertTransformer } from '../quest-array-upsert/quest-array-upsert-transformer';

export const questItemDeepMergeTransformer = ({
  existing,
  update,
}: {
  existing: ItemWithId;
  update: ItemWithId;
}): ItemWithId => {
  const merged: ItemWithId = { ...existing };

  for (const key of Object.keys(update)) {
    const updateParams = { value: update[key] };
    const existingParams = { value: existing[key] };

    if (isArrayOfItemsWithIdGuard(updateParams)) {
      const existingArray = isArrayOfItemsWithIdGuard(existingParams) ? existingParams.value : [];
      merged[key] = questArrayUpsertTransformer({
        existing: existingArray,
        updates: updateParams.value,
      });
    } else {
      merged[key] = updateParams.value;
    }
  }

  return merged;
};
