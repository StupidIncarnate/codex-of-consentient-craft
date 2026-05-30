/**
 * PURPOSE: Halts a quest on a terminal failure — marks the failed work item `failed`, drains every
 *   still-pending work item to `skipped`, and sets the quest status to `blocked` so nothing further
 *   dispatches against the broken state.
 *
 * USAGE:
 * await questBlockOnFailureBroker({ questId, failedWorkItemId });
 * // Loads the quest, marks the failed item `failed` (if not already terminal), skips every pending
 * //   item, flips quest status to `blocked`, and persists via questModifyBroker. Returns { blocked }.
 *
 * WHEN-TO-USE: From the signal-back handler / run-ward broker when a failure routes to BLOCK
 *   (pathseeker-replan-class failures, exhausted ward retries, agent gave-up signals).
 * WHEN-NOT-TO-USE: For recoverable failures (ward retry budget remains, lawbringer) — those splice
 *   fixers via questSpliceFixerBroker and keep the quest `in_progress`.
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

  await questModifyBroker({
    input: {
      questId,
      status: 'blocked',
      ...(updatedWorkItems.length > 0 ? { workItems: updatedWorkItems } : {}),
    } as ModifyQuestInput,
  });

  return { blocked: true };
};
