/**
 * PURPOSE: Halts a quest on a terminal failure — marks the failed work item `failed`, drains every
 *   still-pending work item to `skipped`, and sets the quest status to `blocked` so nothing further
 *   dispatches against the broken state. The returned flag reports whether the block actually
 *   landed, not just whether it was attempted — with merges now running on quests that started
 *   terminal (`complete`), the status write can be rejected by the transition guard, and a caller
 *   that trusted an unconditional `true` would leave a quest carrying a failed merge row while
 *   still looking finished.
 *
 * USAGE:
 * await questBlockOnFailureBroker({ questId, failedWorkItemId });
 * // Loads the quest, marks the failed item `failed` (if not already terminal), skips every pending
 * //   item, flips quest status to `blocked`, and persists via questModifyBroker. Returns { blocked }.
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

import type { ModifyQuestInput, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
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
}: {
  questId: QuestId;
  failedWorkItemId: QuestWorkItemId;
}): Promise<{ blocked: boolean }> => {
  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });
  if (!getResult.success || getResult.quest === undefined) {
    return { blocked: false };
  }

  const { quest } = getResult;
  const failedItem = quest.workItems.find((workItem) => workItem.id === failedWorkItemId);

  // IDEMPOTENCY: a double signal-back can't double-apply. If the failed item is already terminal
  // AND the quest is already blocked, the block has already happened — no-op.
  if (
    isQuestBlockedQuestStatusGuard({ status: quest.status }) &&
    failedItem !== undefined &&
    isTerminalWorkItemStatusGuard({ status: failedItem.status })
  ) {
    return { blocked: true };
  }

  const updatedWorkItems: { id: QuestWorkItemId; status: 'failed' | 'skipped' }[] = quest.workItems
    .filter(
      (workItem) =>
        (workItem.id === failedWorkItemId &&
          !isTerminalWorkItemStatusGuard({ status: workItem.status })) ||
        isPendingWorkItemStatusGuard({ status: workItem.status }),
    )
    .map((workItem) => ({
      id: workItem.id,
      status: workItem.id === failedWorkItemId ? ('failed' as const) : ('skipped' as const),
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
