/**
 * PURPOSE: Narrows a review checklist to the units still carrying no disposition, treating an
 * UNMEASURABLE surface as nothing outstanding. Reach for this over reading
 * `checklist.remainingItemIds` directly whenever the caller has to act on the remainder of a
 * checklist it did not compute itself and therefore cannot know was measurable at all.
 *
 * USAGE:
 * blightCoverageOutstandingTransformer({ checklist });
 * // Returns BlightChecklistItemId[] — empty means every unit on that surface is dealt with
 *
 * The `checklist: null` case is the whole reason this is a transformer rather than a field read: a
 * quest whose `baseRef` was never pinned has no diff to measure, and treating that structural
 * absence as "everything is outstanding" would wedge a session that could never satisfy it. A
 * remainder is only ever computed against a real, measured checklist.
 *
 * Every disposition clears a unit, including `gap` and `recorded` — a remainder names the units
 * with NO entry at all, so it can always be driven to empty honestly.
 */

import type { BlightChecklist, BlightChecklistItemId } from '@dungeonmaster/shared/contracts';

export const blightCoverageOutstandingTransformer = ({
  checklist,
}: {
  checklist: BlightChecklist | null;
}): BlightChecklistItemId[] => {
  if (checklist === null) {
    return [];
  }

  return checklist.remainingItemIds;
};
