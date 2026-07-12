/**
 * PURPOSE: True when a work item was spliced (directly or transitively via `insertedBy`) by a
 *   `failed` work item — i.e. it is a recovery/replan descendant. Walks the `insertedBy` chain
 *   iteratively and is cycle-safe (a repeated id stops the walk).
 *
 * USAGE:
 * hasFailedInsertedByAncestorGuard({ workItem: replanPathseeker, itemMap });
 * // Returns: true when the insertedBy chain reaches a status:'failed' item, false otherwise
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

export const hasFailedInsertedByAncestorGuard = ({
  workItem,
  itemMap,
}: {
  workItem?: WorkItem;
  itemMap?: Map<WorkItem['id'], WorkItem>;
}): boolean => {
  if (workItem === undefined || itemMap === undefined) {
    return false;
  }

  const seen = new Set<WorkItem['id']>();
  let currentId = workItem.insertedBy;

  while (currentId !== undefined && !seen.has(currentId)) {
    seen.add(currentId);
    const parent = itemMap.get(currentId);
    if (!parent) {
      return false;
    }
    if (parent.status === 'failed') {
      return true;
    }
    currentId = parent.insertedBy;
  }

  return false;
};
