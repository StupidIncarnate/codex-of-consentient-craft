/**
 * PURPOSE: Deep recursive upsert of items into an existing array based on ID matching
 *
 * This is the single implementation of the modify-quest merge; `packages/mcp` reaches it through
 * `StartOrchestrator.modifyQuest` rather than holding its own copy.
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

import type { ItemWithId } from '@dungeonmaster/shared/contracts';

import { questItemDeepMergeTransformer } from '../quest-item-deep-merge/quest-item-deep-merge-transformer';

// `updates` is the structural shape, not `T`: a modify-quest patch is partial by design, and the
// caller re-parses the whole quest after the merge.
export const questArrayUpsertTransformer = <T extends ItemWithId>({
  existing,
  updates,
}: {
  existing: readonly T[];
  updates: readonly ItemWithId[];
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
    const current = result[existingIndex];
    const next = (
      current === undefined ? update : questItemDeepMergeTransformer({ existing: current, update })
    ) as T;
    if (existingIndex >= 0) {
      result[existingIndex] = next;
    } else {
      result.push(next);
    }
  }

  return result;
};
