/**
 * PURPOSE: Halts a quest on a terminal failure — marks the failed work item `failed`, drains every
 *   still-pending work item to `skipped`, and sets the quest status to `blocked` so nothing further
 *   dispatches against the broken state. `reason` exists because `blocked` alone tells the user
 *   nothing actionable — a quest halted over a deleted worktree is a dead end unless the failed
 *   item's `errorMessage` names the absolute path that went missing, so the reason rides only on
 *   the item that failed, never on the pending items drained alongside it. The returned flag
 *   reports whether the block actually landed, not just whether it was attempted — with merges now
 *   running on quests that started terminal (`complete`), the status write can be rejected by the
 *   transition guard, and a caller that trusted an unconditional `true` would leave a quest
 *   carrying a failed merge row while still looking finished.
 *
 * USAGE:
 * await questBlockOnFailureBroker({ questId, failedWorkItemId, reason });
 * // Loads the quest, marks the failed item `failed` (carrying `reason` as its `errorMessage`)
 * //   unless it is already terminal AND already carries that exact reason, skips every pending
 * //   item, flips quest status to `blocked`, and persists via questModifyBroker. Returns
 * //   { blocked }.
 *
 * WHEN-TO-USE: From the three bounded-loop-exhaustion paths that route to BLOCK —
 *   quest-run-ward-broker (ward retry budget spent), quest-handle-signal-back-responder (a
 *   locked role's pt-N chain spent), and recover-orphaned-work-items-layer-broker
 *   (orphan-recovery reset budget spent). These are the ONLY routes to `blocked` — the
 *   orchestrator has no other failure signal.
 * WHEN-NOT-TO-USE: While any of those budgets still has room — the quest stays `in_progress`
 *   and the loop continues (a fresh ward retry, pt-N continuation, or orphan reset) instead of
 *   blocking.
 */

import type {
  ErrorMessage,
  ModifyQuestInput,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import {
  isPendingWorkItemStatusGuard,
  isQuestBlockedQuestStatusGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questBlockOnFailureBroker = async ({
  questId,
  failedWorkItemId,
  reason,
}: {
  questId: QuestId;
  failedWorkItemId: QuestWorkItemId;
  reason?: ErrorMessage;
}): Promise<{ blocked: boolean }> => {
  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });
  if (!getResult.success || getResult.quest === undefined) {
    return { blocked: false };
  }

  const { quest } = getResult;
  const failedItem = quest.workItems.find((workItem) => workItem.id === failedWorkItemId);

  // IDEMPOTENCY: a double signal-back for the SAME failure can't double-apply. The guard compares
  // `reason` too, not just quest+item status — a quest already blocked for one cause can still
  // receive a genuinely NEW reason on the same already-terminal carrier (e.g. the missing-worktree
  // halt routes re-blocking an already-blocked quest whose worktree also went missing). Treating
  // that as an already-applied no-op would silently drop the new reason forever.
  if (
    isQuestBlockedQuestStatusGuard({ status: quest.status }) &&
    failedItem !== undefined &&
    isTerminalWorkItemStatusGuard({ status: failedItem.status }) &&
    failedItem.errorMessage === reason
  ) {
    return { blocked: true };
  }

  // The failed item is included even when already terminal, as long as it still needs the new
  // reason attached — a caller's chosen carrier can already be terminal (the "closest thing to
  // what this quest was doing" fallback in the missing-worktree halt routes), and its
  // status/errorMessage must still update to carry a reason it has never recorded.
  const failedItemNeedsUpdate =
    failedItem !== undefined &&
    (!isTerminalWorkItemStatusGuard({ status: failedItem.status }) ||
      failedItem.errorMessage !== reason);

  const updatedWorkItems: {
    id: QuestWorkItemId;
    status: 'failed' | 'skipped';
    errorMessage?: ErrorMessage;
  }[] = quest.workItems
    .filter(
      (workItem) =>
        (workItem.id === failedWorkItemId && failedItemNeedsUpdate) ||
        isPendingWorkItemStatusGuard({ status: workItem.status }),
    )
    .map((workItem) => ({
      id: workItem.id,
      status: workItem.id === failedWorkItemId ? ('failed' as const) : ('skipped' as const),
      // errorMessage rides only on the failed item — the drained pending items are plain skips.
      ...(workItem.id === failedWorkItemId && reason !== undefined ? { errorMessage: reason } : {}),
    }));

  // A rejected status transition (e.g. the quest already moved to a status with no `-> blocked`
  // edge) must not report success, or a quest carrying a failed merge would keep looking finished.
  const result = await questModifyBroker({
    input: {
      questId,
      status: 'blocked',
      ...(updatedWorkItems.length > 0 ? { workItems: updatedWorkItems } : {}),
    } as ModifyQuestInput,
  });

  return { blocked: result.success };
};
