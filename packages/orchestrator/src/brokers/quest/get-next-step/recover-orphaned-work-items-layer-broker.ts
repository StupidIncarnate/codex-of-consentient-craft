/**
 * PURPOSE: Layer helper for questGetNextStepBroker — recovers a stalled quest's orphaned
 *   in_progress work items and returns the quest with those items locally resolved so the caller can
 *   recompute the next step in the same scan without a re-read.
 *
 *   Under the /dumpster-launch dispatch-loop invariant, get-next-step is only called when the loop has
 *   no Task it dispatched in flight, so an in_progress work item observed during a scan is necessarily
 *   orphaned: its agent terminated without signalling back (the user killed it, or it crashed). Left
 *   alone, the orphan satisfies no dependency and get-next-step returns idle forever.
 *
 *   RECOVERY-FIRST with a give-up budget: each orphan is reset to pending (retryCount + 1, per-run
 *   identity cleared) so the next dispatch re-runs it — UNTIL `retryCount` reaches
 *   `slotManagerStatics.orphanRecovery.maxResets`. A deterministically-crashing agent (same input →
 *   same crash) would otherwise re-dispatch forever, so once the budget is spent the repeated crash is
 *   re-interpreted as a plan hole and escalates to a PathSeeker replan (which itself only blocks once
 *   the replan loop is exhausted). One replan re-plans the whole quest, so only the first
 *   budget-exhausted orphan escalates; any others reset to pending and the replan drains them.
 *
 * USAGE:
 * const recovered = await recoverOrphanedWorkItemsLayerBroker({ quest });
 * // Returns: Quest — identical to the input when no in_progress items exist; otherwise a copy whose
 * //   reset orphans read pending and whose escalated orphan reads failed (both persisted).
 *
 * WHEN-TO-USE: From scanOnceLayerBroker, only when the selected quest has incomplete work but
 *   computeNextStepFromQuestLayerBroker yields nothing dispatchable (the stalled state).
 */

import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { isActiveWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questSplicePathseekerReplanBroker } from '../splice-pathseeker-replan/quest-splice-pathseeker-replan-broker';

export const recoverOrphanedWorkItemsLayerBroker = async ({
  quest,
}: {
  quest: Quest;
}): Promise<Quest> => {
  const orphanedItems = quest.workItems.filter((item) =>
    isActiveWorkItemStatusGuard({ status: item.status }),
  );
  if (orphanedItems.length === 0) {
    return quest;
  }

  // A persistently-crashing agent (retryCount at the budget) is a plan hole. One PathSeeker replan
  // re-plans the whole quest, so only the FIRST budget-exhausted orphan escalates; every other orphan
  // resets to pending (and the replan drains it on completion).
  const escalated = orphanedItems.find(
    (item) => item.retryCount >= slotManagerStatics.orphanRecovery.maxResets,
  );
  const toReset = orphanedItems.filter((item) => item.id !== escalated?.id);

  // Reset: flip in_progress → pending, bump the reset counter, and clear stale per-run identity. The
  // next dispatch's get-agent-prompt re-stamps fresh sessionId/agentId/startedAt; `null` is the
  // documented clear marker on workItemForUpsertContract.
  if (toReset.length > 0) {
    const resetInput = modifyQuestInputContract.parse({
      questId: quest.id,
      workItems: toReset.map((item) => ({
        id: item.id,
        status: 'pending' as const,
        retryCount: item.retryCount + 1,
        sessionId: null,
        agentId: null,
        startedAt: null,
      })),
    });
    await questModifyBroker({ input: resetInput });
  }

  // Escalate the budget-exhausted orphan: mark it failed, drain pending, splice a PathSeeker replan
  // (or block once the replan loop is spent). The replan dispatches on the next scan (re-read).
  if (escalated !== undefined) {
    await questSplicePathseekerReplanBroker({ questId: quest.id, failedWorkItemId: escalated.id });
  }

  const resetIds = new Set(toReset.map((item) => item.id));
  return {
    ...quest,
    workItems: quest.workItems.map((item) => {
      if (resetIds.has(item.id)) {
        return { ...item, status: 'pending' };
      }
      if (escalated !== undefined && item.id === escalated.id) {
        return { ...item, status: 'failed' };
      }
      return item;
    }),
  };
};
