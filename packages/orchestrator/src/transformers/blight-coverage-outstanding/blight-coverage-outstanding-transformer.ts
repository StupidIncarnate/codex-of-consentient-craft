/**
 * PURPOSE: Returns the blight checklist units still carrying no disposition for a blightscout
 * operation item — the list the signal-back completion gate refuses `done` on
 *
 * USAGE:
 * blightCoverageOutstandingTransformer({ operationItem, checklist });
 * // Returns BlightChecklistItemId[] — empty means every unit in this scout's commit is dealt with
 *
 * This exists so completion is COMPUTED. A review role that re-derives its scope from scratch each
 * session re-slices its diff differently every pass and can report `done` having covered only part
 * of it — that is the exact failure this closes. Recomputing from the diff and the persisted ledger
 * takes the claim out of the agent's hands entirely.
 *
 * Scope comes from the caller-supplied `checklist` (the questGetBlightChecklistBroker result), not
 * from anything on the operation item itself. The caller is what decides how wide that checklist
 * is: a scout is measured over its own COMMIT RANGE, which is what makes this gate small and
 * satisfiable per session rather than a whole-quest audit deferred to the end.
 *
 * A `checklist: null` (the quest's `baseRef` was never pinned, so no diff can be measured) is NOT
 * gated: silently wedging a quest that structurally cannot compute a review scope would be a worse
 * failure than the one being prevented. The gate only ever binds against a real, measured checklist.
 *
 * Every disposition clears a unit, including `gap` and `recorded`. What the gate refuses is the
 * absence of any entry at all, so it can always be satisfied honestly.
 */

import type {
  BlightChecklist,
  BlightChecklistItemId,
  OperationItem,
} from '@dungeonmaster/shared/contracts';

export const blightCoverageOutstandingTransformer = ({
  operationItem,
  checklist,
}: {
  operationItem: OperationItem;
  checklist: BlightChecklist | null;
}): BlightChecklistItemId[] => {
  if (operationItem.role !== 'blightscout') {
    return [];
  }

  if (checklist === null) {
    return [];
  }

  return checklist.remainingItemIds;
};
