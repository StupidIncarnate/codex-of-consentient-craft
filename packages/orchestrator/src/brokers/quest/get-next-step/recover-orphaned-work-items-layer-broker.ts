/**
 * PURPOSE: Layer helper for questGetNextStepBroker — resets a stalled quest's orphaned
 *   in_progress work items back to pending so the next dispatch re-runs them, and returns the
 *   quest with those items locally flipped to pending so the caller can recompute the next step
 *   in the same scan without a re-read.
 *
 *   Under the /dumpster-launch dispatch-loop invariant, get-next-step is only called when the
 *   loop has no Task it dispatched in flight — it awaits each spawn-agents batch fully before
 *   asking for the next step. So an in_progress work item observed during a scan is necessarily
 *   orphaned: its agent terminated without signalling back (the user killed it, or it crashed).
 *   Left alone, the orphan satisfies no dependency, blocks every downstream dependent, and
 *   get-next-step returns idle forever. Flipping it back to pending lets
 *   computeReadyWorkItemsLayerBroker pick it up again.
 *
 * USAGE:
 * const recovered = await recoverOrphanedWorkItemsLayerBroker({ quest });
 * // Returns: Quest — identical to the input when no in_progress items exist; otherwise a copy
 * //   whose in_progress items are pending (persisted via questModifyBroker as a side effect).
 *
 * WHEN-TO-USE: From scanOnceLayerBroker, only when the selected quest has incomplete work but
 *   computeNextStepFromQuestLayerBroker yields nothing dispatchable (the stalled state).
 * WHEN-NOT-TO-USE: When a step is already dispatchable — leave in_progress items untouched.
 */

import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { isActiveWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { questModifyBroker } from '../modify/quest-modify-broker';

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

  // Persist the reset: flip in_progress → pending and clear stale per-run identity. The next
  // dispatch's get-agent-prompt re-stamps fresh sessionId/agentId/startedAt; `null` is the
  // documented clear marker on workItemForUpsertContract.
  const resetInput = modifyQuestInputContract.parse({
    questId: quest.id,
    workItems: orphanedItems.map((item) => ({
      id: item.id,
      status: 'pending' as const,
      sessionId: null,
      agentId: null,
      startedAt: null,
    })),
  });
  await questModifyBroker({ input: resetInput });

  const orphanedIds = new Set(orphanedItems.map((item) => item.id));
  return {
    ...quest,
    workItems: quest.workItems.map((item) =>
      orphanedIds.has(item.id) ? { ...item, status: 'pending' } : item,
    ),
  };
};
