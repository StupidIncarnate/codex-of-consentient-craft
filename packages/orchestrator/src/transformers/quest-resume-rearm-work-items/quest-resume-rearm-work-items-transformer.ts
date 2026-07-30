/**
 * PURPOSE: Builds the work-item patches that make a resume actually resume. A quest halts with
 *   wreckage: the item that blocked it reads `failed` with its orphan-recovery `retryCount` at the
 *   budget, and every item that was merely queued behind it was drained to `skipped`. Flipping the
 *   quest status back to `in_progress` alone re-enters the scan with all of that intact, so the
 *   very next recovery pass re-escalates the same exhausted item and blocks again — the user
 *   presses RESUME and nothing moves.
 *
 *   Rearming means, for every work item whose linked operation item is still unfinished: back to
 *   `pending`, `retryCount` cleared to 0, and — when a `sessionId` was retained — the `resume`
 *   marker set, so Node dispatch resumes that Claude session (`claude --resume`) instead of
 *   throwing away the work it already did. An item whose operation item is `complete` is genuinely
 *   done and is left alone, which is what keeps a red ward's `failed` work item (already
 *   superseded by a spliced spiritmender + fresh ward) from being resurrected.
 *
 * USAGE:
 * const patches = questResumeRearmWorkItemsTransformer({ workItems, operations });
 * // Returns: WorkItemForUpsert[] — feed straight into modifyQuestInputContract's `workItems`.
 * //   Empty when nothing needs rearming.
 */

import type { OperationItem, WorkItem, WorkItemForUpsert } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isCompleteWorkItemStatusGuard,
  isFailureWorkItemStatusGuard,
  isPendingWorkItemStatusGuard,
  isSkippedWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

export const questResumeRearmWorkItemsTransformer = ({
  workItems,
  operations,
}: {
  workItems: readonly WorkItem[];
  operations: readonly OperationItem[];
}): WorkItemForUpsert[] => {
  const unfinishedOperationIds = new Set(
    operations
      .filter((operation) => operation.status !== 'complete')
      .map((operation) => String(operation.id)),
  );

  return workItems.flatMap((item): WorkItemForUpsert[] => {
    if (isCompleteWorkItemStatusGuard({ status: item.status })) {
      return [];
    }

    const linkedOperationId = item.relatedDataItems
      .map((ref) => String(ref))
      .find((ref) => ref.startsWith('operations/'))
      ?.split('/')[1];
    const ownsUnfinishedScope =
      linkedOperationId !== undefined && unfinishedOperationIds.has(linkedOperationId);

    // The halt wreckage: `failed` (the item that blocked, or one that reported an environment
    // wall) and `skipped` (drained from pending by the block) both still own their scope when the
    // operation item never completed. Those are the ones a resume has to put back in play.
    const isWreckage =
      isFailureWorkItemStatusGuard({ status: item.status }) ||
      isSkippedWorkItemStatusGuard({ status: item.status });
    if (isWreckage && !ownsUnfinishedScope) {
      return [];
    }

    // An `in_progress`/`queued` item is an orphan whose agent is long gone (the server that ran it
    // is the one that halted), so it resets exactly like the wreckage does.
    if (isWreckage || isActiveWorkItemStatusGuard({ status: item.status })) {
      return [
        {
          id: item.id,
          status: 'pending',
          retryCount: 0,
          ...(item.sessionId === undefined ? {} : { resume: true }),
        } as WorkItemForUpsert,
      ];
    }

    // Already dispatchable — it only needs its recovery budget back, and only if it spent any.
    if (isPendingWorkItemStatusGuard({ status: item.status }) && item.retryCount > 0) {
      return [{ id: item.id, retryCount: 0 } as WorkItemForUpsert];
    }

    return [];
  });
};
