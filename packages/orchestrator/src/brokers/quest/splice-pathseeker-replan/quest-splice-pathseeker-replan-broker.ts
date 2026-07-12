/**
 * PURPOSE: The single place a PLAN-HOLE failure funnels to. Splices a `pathseeker` replan
 *   (`dependsOn: []`, `insertedBy: <failed item>`, carrying the failure brief as its `summary`),
 *   marks the failed item `failed` (superseded by the replan, so it is not an unresolved failure),
 *   and drains every still-`pending` item to `skipped`. On the replan's completion the post-walk hook
 *   regenerates the downstream chain (its dedup keeps already-built work from duplicating). The quest
 *   stays `in_progress`.
 *
 *   This is reached two ways: a `failed-replan` signal (a role reporting a plan hole it cannot
 *   reconcile), and any code-recovery role / ward / orphaned agent EXHAUSTING its retry budget (the
 *   repeated failure is re-interpreted as a plan hole). It is the SOLE owner of the block path: when
 *   the quest has already accumulated `slotManagerStatics.pathseeker.replanMaxCycles` replans, the
 *   PathSeeker loop is spent, so a further replan request BLOCKs (questBlockOnFailureBroker) instead of
 *   looping forever. No individual role ever blocks the quest directly.
 *
 * USAGE:
 * const { replanned, blocked } = await questSplicePathseekerReplanBroker({
 *   questId, failedWorkItemId, brief, actualSignal: 'failed-replan',
 * });
 * // replanned: a pathseeker replan was spliced (or already present); blocked: replan budget spent.
 *
 * WHEN-TO-USE: From the signal-back handler on a `failed-replan`, and from questRecoverRoleBroker /
 *   run-ward / orphan-recovery when a retry budget is exhausted.
 * WHEN-NOT-TO-USE: For a first code failure with retry budget remaining — that splices a spiritmender
 *   + a re-run of the role via questRecoverRoleBroker.
 */

import type {
  ModifyQuestInput,
  QuestId,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import {
  errorMessageContract,
  getQuestInputContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { isPendingWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyOrThrowBroker } from '../modify-or-throw/quest-modify-or-throw-broker';

const PATHSEEKER_REPLAN_MAX_ATTEMPTS = 3;
const DEFAULT_REPLAN_BRIEF = 'plan_hole_replan_requested';

export const questSplicePathseekerReplanBroker = async ({
  questId,
  failedWorkItemId,
  brief,
  actualSignal,
}: {
  questId: QuestId;
  failedWorkItemId: QuestWorkItemId;
  brief?: WorkItem['summary'];
  actualSignal?: WorkItem['actualSignal'];
}): Promise<{ replanned: boolean; blocked: boolean }> => {
  const result = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!result.success || result.quest === undefined) {
    return { replanned: false, blocked: false };
  }
  const { quest } = result;

  // Idempotency: a double signal-back can't double-splice. If this item already inserted a pathseeker
  // replan, the escalation has already happened.
  if (
    quest.workItems.some((wi) => wi.role === 'pathseeker' && wi.insertedBy === failedWorkItemId)
  ) {
    return { replanned: true, blocked: false };
  }

  const failedItem = quest.workItems.find((wi) => wi.id === failedWorkItemId);
  if (failedItem === undefined) {
    return { replanned: false, blocked: false };
  }

  // The PathSeeker replan loop is the sole block path. Count every replan the quest has accumulated
  // (a `pathseeker` work item carrying `insertedBy`); once the budget is spent the loop cannot make
  // progress, so this escalation BLOCKs instead of splicing yet another replan.
  const priorReplanCount = quest.workItems.filter(
    (wi) => wi.role === 'pathseeker' && wi.insertedBy !== undefined,
  ).length;
  if (priorReplanCount >= slotManagerStatics.pathseeker.replanMaxCycles) {
    await questBlockOnFailureBroker({ questId, failedWorkItemId });
    return { replanned: false, blocked: true };
  }

  const completedAt = new Date().toISOString();
  const replanBrief = brief !== undefined && String(brief).length > 0 ? String(brief) : undefined;
  const errorMessage =
    replanBrief === undefined
      ? errorMessageContract.parse(DEFAULT_REPLAN_BRIEF)
      : errorMessageContract.parse(replanBrief);

  const pendingSkips = quest.workItems
    .filter(
      (wi) => isPendingWorkItemStatusGuard({ status: wi.status }) && wi.id !== failedWorkItemId,
    )
    .map((wi) => ({ id: wi.id, status: 'skipped' as const, completedAt }));

  const replanItem = workItemContract.parse({
    id: crypto.randomUUID(),
    role: 'pathseeker',
    status: 'pending',
    spawnerType: 'agent',
    dependsOn: [],
    maxAttempts: PATHSEEKER_REPLAN_MAX_ATTEMPTS,
    createdAt: completedAt,
    insertedBy: failedWorkItemId,
    ...(replanBrief === undefined ? {} : { summary: replanBrief }),
  });

  await questModifyOrThrowBroker({
    input: {
      questId,
      workItems: [
        {
          id: failedWorkItemId,
          status: 'failed',
          completedAt,
          errorMessage,
          ...(actualSignal === undefined ? {} : { actualSignal }),
        },
        ...pendingSkips,
        replanItem,
      ],
    } as ModifyQuestInput,
  });

  return { replanned: true, blocked: false };
};
