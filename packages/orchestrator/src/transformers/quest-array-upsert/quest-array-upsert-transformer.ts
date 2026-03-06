/**
 * PURPOSE: Deep recursive upsert of items into an existing array based on ID matching
 *
 * USAGE:
 * questArrayUpsertTransformer({ existing: [{id: '1', name: 'A', nodes: [{id: 'n1'}]}], updates: [{id: '1', nodes: [{id: 'n2'}]}] });
 * // Returns: [{id: '1', name: 'A', nodes: [{id: 'n1'}, {id: 'n2'}]}]
 *
 * UPSERT SEMANTICS:
 * - Items with _delete: true => removed from result
 * - Items with existing ID => deep merge (scalar overwrite, id-arrays recurse, other arrays replace)
 * - Items with new ID => appended
 * - Items in existing but not in updates => unchanged
 */

import type { ItemWithId } from '../../contracts/item-with-id/item-with-id-contract';

import { questItemDeepMergeTransformer } from '../quest-item-deep-merge/quest-item-deep-merge-transformer';

export const questArrayUpsertTransformer = <T extends ItemWithId>({
  existing,
  updates,
}: {
  existing: T[];
  updates: T[];
}): T[] => {
  const result = [...existing];

  for (const update of updates) {
    if (update._delete === true) {
      const deleteIndex = result.findIndex((item) => item.id === update.id);
      if (deleteIndex >= 0) {
        result.splice(deleteIndex, 1);
      }
      continue;
    }

    const existingIndex = result.findIndex((item) => item.id === update.id);
    if (existingIndex >= 0) {
      result[existingIndex] = questItemDeepMergeTransformer({
        existing: result[existingIndex] as ItemWithId,
        update: update as ItemWithId,
      }) as T;
    } else {
      result.push(update);
    }
  }

  return result;
};
