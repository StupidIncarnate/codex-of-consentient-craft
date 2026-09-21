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
 *   A TERMINAL WORK ITEM IS NOT ORPHANED — IT FINISHED, and nothing here touches it whatever its
 *   linked operation item reads. A scope stays `in_progress` across every step it runs, so a
 *   terminal item under a live scope is the ordinary state between a step RECORDING its outcome
 *   word (`questRunStepBroker` writes `declaredWord`; a session writes it through `quest-work`)
 *   and `questRouteScopeBroker` READING that word on the next scan — which runs after this one in
 *   `scan-once-layer-broker`. Reclaiming such an item re-runs finished work and the scope never
 *   moves: the same deterministic step re-runs every scan until the reset budget blocks the quest.
 *   Nor is there a lost signal to catch here: the signal handler writes work-item-terminal and
 *   operation-complete in ONE persist, so a half-applied signal leaves the item `in_progress` —
 *   the orphan case above — and a scope whose items have all gone terminal is the router's own
 *   candidate, which reads the recorded word instead of re-dispatching the session that wrote it.
 *
 * USAGE:
 * const { quest: recovered, blocked } = await recoverOrphanedWorkItemsLayerBroker({ quest });
 * // Returns: { quest, blocked } — `quest` is identical to the input when nothing needed recovery,
 * //   otherwise a copy whose recovered items read pending (persisted through questModifyBroker).
 * //   `blocked` is true when an exhausted orphan escalated and the quest is now `blocked`; the
 * //   caller must stop scanning, because the returned copy still shows items the block just
 * //   drained to `skipped` and dispatching from it would run agents against a halted quest.
 */

import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { isActiveWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const recoverOrphanedWorkItemsLayerBroker = async ({
  quest,
}: {
  quest: Quest;
}): Promise<{ quest: Quest; blocked: boolean }> => {
  const toRecover = quest.workItems.filter((item) =>
    isActiveWorkItemStatusGuard({ status: item.status }),
  );

  if (toRecover.length === 0) {
    return { quest, blocked: false };
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
    blocked: escalated !== undefined,
    quest: {
      ...quest,
      workItems: quest.workItems.map((item) => {
        if (resetIds.has(item.id)) {
          return {
            ...item,
            status: 'pending',
            ...(item.sessionId === undefined ? {} : { resume: true }),
          };
        }
        if (escalated !== undefined && item.id === escalated.id) {
          return { ...item, status: 'failed' };
        }
        return item;
      }),
    },
  };
};
