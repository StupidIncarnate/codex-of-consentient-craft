/**
 * PURPOSE: Narrows a quest's operations ledger to the items no work item has claimed — the plan
 * entries nothing has been dispatched for yet. Reach for this over reading `quest.operations`
 * wherever a surface already draws one row per work item: every claimed item is already on screen
 * under the row working it, and this is the remainder that would otherwise never appear.
 *
 * USAGE:
 * unclaimedOperationsTransformer({ operations: quest.operations, workItems: quest.workItems });
 * // Returns the subset of `operations`, in the input's own order, that no `operations/<id>` entry
 * // in any work item's relatedDataItems points at
 *
 * Pass EVERY work item, never a status-filtered subset: an operation whose work item was skipped
 * has been dealt with, and handing this only the visible items would resurrect it as still waiting.
 */

import type { OperationItem, WorkItem } from '@dungeonmaster/shared/contracts';

const OPERATIONS_PREFIX = 'operations/';
const OPERATIONS_PREFIX_LENGTH = OPERATIONS_PREFIX.length;

export const unclaimedOperationsTransformer = ({
  operations,
  workItems,
}: {
  operations: readonly OperationItem[];
  workItems: readonly WorkItem[];
}): OperationItem[] => {
  // The prefix test is what scopes this to the operations collection: relatedDataItems also carries
  // `wardResults/`, `riftcarverResults/` and `flows/` refs, and an id sliced off one of those must
  // never claim an operation that happens to share it.
  const claimedOperationIds = new Set<OperationItem['id']>();
  for (const workItem of workItems) {
    for (const ref of workItem.relatedDataItems) {
      if (ref.startsWith(OPERATIONS_PREFIX)) {
        claimedOperationIds.add(ref.slice(OPERATIONS_PREFIX_LENGTH) as OperationItem['id']);
      }
    }
  }

  return operations.filter((operation) => !claimedOperationIds.has(operation.id));
};
