/**
 * PURPOSE: Returns the deterministic QA checklist for a quest's flows, rendered as text, by
 * delegating to questGetQaChecklistBroker
 *
 * USAGE:
 * const result = await QuestGetQaChecklistResponder({ questId: 'add-auth' });
 * // Returns { success: true, data: '<one rendered checklist per flow>' }
 *
 * const one = await QuestGetQaChecklistResponder({ questId: 'add-auth', flowId: 'login-flow' });
 * // Returns { success: true, data: '<just that flow>' }
 *
 * const mine = await QuestGetQaChecklistResponder({ questId: 'add-auth', track: 'flowrider' });
 * // Returns { success: true, data: '<the runtime flows, measured against flowriderSignoff>' }
 *
 * A quest with no flows, or a flowId not on the quest, returns a plain statement of that rather
 * than an error — "this flow has nothing to verify" is a real answer a verification session needs
 * to be able to act on, and turning it into a failure would push the session toward inventing
 * scope. A `flowrider` track over a quest whose flows are all operational lands in that same empty
 * case, and says so in its own words rather than the generic no-flows one: Flowrider is measured
 * over runtime flows alone, so "nothing to walk" there is a real, signable state and not a hole.
 */

import {
  contentTextContract,
  errorMessageContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, ErrorMessage, SignoffTrack } from '@dungeonmaster/shared/contracts';

import { questGetQaChecklistBroker } from '../../../brokers/quest/get-qa-checklist/quest-get-qa-checklist-broker';
import { qaChecklistToTextTransformer } from '../../../transformers/qa-checklist-to-text/qa-checklist-to-text-transformer';

export type QuestGetQaChecklistResponderResult =
  | { readonly success: true; readonly data: ContentText }
  | { readonly success: false; readonly error: ErrorMessage };

export const QuestGetQaChecklistResponder = async ({
  questId,
  flowId,
  track,
}: {
  questId: string;
  flowId?: string;
  track?: SignoffTrack;
}): Promise<QuestGetQaChecklistResponderResult> => {
  try {
    const parsedQuestId = questIdContract.parse(questId);
    const checklists = await questGetQaChecklistBroker({
      questId: parsedQuestId,
      ...(flowId !== undefined && { flowId: flowId as never }),
      ...(track !== undefined && { track }),
    });

    if (checklists.length === 0) {
      return {
        success: true,
        data: contentTextContract.parse(
          flowId === undefined
            ? track === 'flowrider'
              ? 'This quest has no runtime flows, so the flowrider track has nothing to walk. That is a real state, not an error — operational flows are verified by Siegemaster checking their end state, never by a flow-perspective suite. Your gate still binds and it yields zero units, so commit the record and signal done.'
              : 'This quest has no flows, so there is nothing to verify. That is a real state, not an error — your track has zero units to sign, so commit the record and signal done.'
            : `No flow \`${flowId}\` on this quest. Call get-qa-checklist with no flowId to list every flow that does exist.`,
        ),
      };
    }

    return {
      success: true,
      data: contentTextContract.parse(
        checklists
          .map((checklist) =>
            qaChecklistToTextTransformer({ checklist, ...(track !== undefined && { track }) }),
          )
          .join('\n\n---\n\n'),
      ),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessageContract.parse(errorMessage) };
  }
};
