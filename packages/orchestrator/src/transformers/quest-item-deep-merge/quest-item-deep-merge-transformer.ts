/**
 * PURPOSE: Deep merges two items with id fields, recursing into arrays of id-bearing objects
 *
 * This is the single implementation of the modify-quest merge; `packages/mcp` reaches it through
 * `StartOrchestrator.modifyQuest` rather than holding its own copy.
 *
 * USAGE:
 * questItemDeepMergeTransformer({ existing: {id: '1', nodes: [{id: 'n1'}]}, update: {id: '1', nodes: [{id: 'n2'}]} });
 * // Returns: {id: '1', nodes: [{id: 'n1'}, {id: 'n2'}]}
 *
 * MERGE SEMANTICS:
 * - Scalar fields: overwrite with update value
 * - Fields explicitly set to null: the key is REMOVED, so the whole-quest re-parse sees it absent
 *   rather than null. An optional field's clear marker has to survive `questContract.parse`, and
 *   `.optional()` rejects `null`, so removal is the only spelling that round-trips.
 * - Array fields containing items with `id`: recurse via questArrayUpsertTransformer
 * - Array fields without `id` items: replace entirely
 */

import type { ItemWithId } from '@dungeonmaster/shared/contracts';

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
    if (
      update[key] === undefined ||
      (Array.isArray(update[key]) && (update[key] as unknown[]).length === 0)
    ) {
      continue;
    }

    if (update[key] === null) {
      Reflect.deleteProperty(merged, key);
      continue;
    }

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
