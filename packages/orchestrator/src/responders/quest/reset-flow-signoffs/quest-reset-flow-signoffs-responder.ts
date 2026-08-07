/**
 * PURPOSE: Validates a walk-reset request and clears Siegemaster's sign-offs across ONE flow by
 * delegating to questResetFlowSignoffsBroker, returning what happened as text
 *
 * USAGE:
 * const result = await QuestResetFlowSignoffsResponder({ questId, workItemId, flowId, reason });
 * // Returns { success: true, data: '<what was cleared and where it was recorded>' }
 *
 * A refusal — an unknown work item, a non-siegemaster caller, a flow outside the caller's operation
 * item scope — comes back as `{ success: false, error }` carrying the broker's own message, so the
 * session is told which of those it hit rather than being handed a bare failure.
 */

import {
  contentTextContract,
  errorMessageContract,
  flowIdContract,
  questIdContract,
  questNoteContract,
  questWorkItemIdContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, ErrorMessage } from '@dungeonmaster/shared/contracts';

import { questResetFlowSignoffsBroker } from '../../../brokers/quest/reset-flow-signoffs/quest-reset-flow-signoffs-broker';

export type QuestResetFlowSignoffsResponderResult =
  | { readonly success: true; readonly data: ContentText }
  | { readonly success: false; readonly error: ErrorMessage };

export const QuestResetFlowSignoffsResponder = async ({
  questId,
  workItemId,
  flowId,
  reason,
}: {
  questId: string;
  workItemId: string;
  flowId: string;
  reason: string;
}): Promise<QuestResetFlowSignoffsResponderResult> => {
  try {
    const parsedQuestId = questIdContract.parse(questId);
    const parsedWorkItemId = questWorkItemIdContract.parse(workItemId);
    const parsedFlowId = flowIdContract.parse(flowId);
    // The reason IS the note's `detail`, so it is validated by the note's own field rather than a
    // parallel contract that could drift from what the note will accept at write time.
    const parsedReason = questNoteContract.shape.detail.parse(reason);

    const { clearedCount, noteId } = await questResetFlowSignoffsBroker({
      questId: parsedQuestId,
      workItemId: parsedWorkItemId,
      flowId: parsedFlowId,
      reason: parsedReason,
    });

    return {
      success: true,
      data: contentTextContract.parse(
        [
          `Siegemaster walk reset for flow ${String(parsedFlowId)}.`,
          `Cleared ${String(clearedCount)} siegemasterSignoff value(s) across this flow's observables, nodes, edges and off-map probe families. Flowrider's track was not touched.`,
          `Recorded as quest note ${String(noteId)} (kind: walk-reset).`,
          'Re-walk the flow from the reset state and sign each unit off again as you go.',
        ].join('\n'),
      ),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessageContract.parse(errorMessage) };
  }
};
