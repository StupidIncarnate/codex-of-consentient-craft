/**
 * PURPOSE: Layer helper for questGetNextStepBroker — recovers a stalled quest's orphaned
 *   in_progress work items and returns the quest with those items locally resolved so the caller
 *   can recompute the next step in the same scan without a re-read.
 *
 *   Under the dispatch-loop invariant, get-next-step only runs when the loop has no dispatch in
 *   flight, so an in_progress work item observed during a scan is necessarily orphaned: its agent
 *   terminated without signalling back (the server restarted, the user killed it, or it crashed).
 *   Left alone, the orphan satisfies no dependency and get-next-step returns idle forever.
 *
 *   RESUME, DON'T RESTART: each orphan flips back to `pending` (so compute-ready selects it) but
 *   KEEPS `sessionId`/`agentId` and gains the `resume` marker — Node dispatch resumes the retained
 *   Claude session (`claude --resume`) so work in the orphaned session is preserved instead of
 *   re-running from scratch. An early-crash orphan with NO captured sessionId falls back to a
 *   fresh spawn (no marker). Budget: each recovery bumps `retryCount`; once it reaches
 *   `slotManagerStatics.orphanRecovery.maxResets` the crash loop is terminal and the quest blocks
 *   via questBlockOnFailureBroker.
 *
 *   RECONCILE SAFETY-NET: a work item terminal while its linked operation item is still
 *   pending/in_progress means a session finished but its signal never processed. Under the atomic
 *   signal handler this is unreachable (work-item-terminal + operation-complete are one persist) —
 *   kept as a defensive net only: the item flips back to pending (identity + resume marker kept)
 *   so it re-dispatches and re-signals.
 *
 * USAGE:
 * const recovered = await recoverOrphanedWorkItemsLayerBroker({ quest });
 * // Returns: Quest — identical to the input when nothing needed recovery; otherwise a copy whose
 * //   recovered items read pending (persisted through questModifyBroker).
 */

import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const recoverOrphanedWorkItemsLayerBroker = async ({
  quest,
}: {
  quest: Quest;
}): Promise<Quest> => {
  const orphanedItems = quest.workItems.filter((item) =>
    isActiveWorkItemStatusGuard({ status: item.status }),
  );

  // Reconcile net: terminal work item + linked operation item still pending/in_progress =
  // a finished session whose signal never applied. Re-dispatch it to re-signal.
  const unappliedSignalItems = quest.workItems.filter((item) => {
    if (!isTerminalWorkItemStatusGuard({ status: item.status })) {
      return false;
    }
    const linkedRef = item.relatedDataItems
      .map((ref) => String(ref))
      .find((ref) => ref.startsWith('operations/'));
    if (linkedRef === undefined) {
      return false;
    }
    const linkedOperation = quest.operations.find(
      (operation) => String(operation.id) === linkedRef.split('/')[1],
    );
    return linkedOperation !== undefined && linkedOperation.status === 'in_progress';
  });

  const toRecover: WorkItem[] = [...orphanedItems, ...unappliedSignalItems];
  if (toRecover.length === 0) {
    return quest;
  }

  // A persistently-crashing session (retryCount at the budget) will not converge by resuming
  // again — the quest blocks so a human can look. Only the first exhausted orphan escalates.
  const escalated = toRecover.find(
    (item) => item.retryCount >= slotManagerStatics.orphanRecovery.maxResets,
  );
  const toReset = toRecover.filter((item) => item.id !== escalated?.id);

  // Flip back to pending KEEPING sessionId/agentId, and mark for resume when a session was
  // captured — dispatch resumes that Claude session instead of fresh-spawning. An item with no
  // sessionId (child died before its init line) resets without the marker → fresh spawn.
  if (toReset.length > 0) {
    const resetInput = modifyQuestInputContract.parse({
      questId: quest.id,
      workItems: toReset.map((item) => ({
        id: item.id,
        status: 'pending' as const,
        retryCount: item.retryCount + 1,
        ...(item.sessionId === undefined ? {} : { resume: true }),
      })),
    });
    await questModifyBroker({ input: resetInput });
  }

  if (escalated !== undefined) {
    await questBlockOnFailureBroker({ questId: quest.id, failedWorkItemId: escalated.id });
  }

  const resetIds = new Set(toReset.map((item) => item.id));
  return {
    ...quest,
    workItems: quest.workItems.map((item) => {
      if (resetIds.has(item.id)) {
        return { ...item, status: 'pending', ...(item.sessionId === undefined ? {} : { resume: true }) };
      }
      if (escalated !== undefined && item.id === escalated.id) {
        return { ...item, status: 'failed' };
      }
      return item;
    }),
  };
};
