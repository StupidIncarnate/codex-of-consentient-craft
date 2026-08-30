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
 * const mine = await QuestGetQaChecklistResponder({ questId: 'add-auth', operationItemId });
 * // Returns { success: true, data: '<exactly the scope that item is measured over>' }
 *
 * `operationItemId` IS the scope — the track, the flows and the package slice all come off the item
 * through the same derivation every reader of this coverage shares, so the render and the quest
 * summary cannot drift. The track it resolved comes back with the checklists because the RENDER
 * needs it: the sign-off caption names the field, and the empty case reads differently per track.
 *
 * A quest with no flows, or a flowId not on the quest, returns a plain statement of that rather
 * than an error — "this flow has nothing to verify" is a real answer a verification session needs
 * to be able to act on, and turning it into a failure would push the session toward inventing
 * scope. An authoring track over a quest whose flows are all operational lands in that same empty
 * case, and says so in its own words rather than the generic no-flows one: those tracks are
 * measured over runtime flows alone, so "nothing to walk" there is a real, signable state and not a
 * hole. Which tracks those are is read off the same `flowTypes` list every denominator reader
 * shares, never from a role name here.
 */

import {
  contentTextContract,
  errorMessageContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, ErrorMessage } from '@dungeonmaster/shared/contracts';

import { questGetQaChecklistBroker } from '../../../brokers/quest/get-qa-checklist/quest-get-qa-checklist-broker';
import { signoffTrackEligibilityStatics } from '../../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaChecklistToTextTransformer } from '../../../transformers/qa-checklist-to-text/qa-checklist-to-text-transformer';

export type QuestGetQaChecklistResponderResult =
  | { readonly success: true; readonly data: ContentText }
  | { readonly success: false; readonly error: ErrorMessage };

export const QuestGetQaChecklistResponder = async ({
  questId,
  operationItemId,
  flowId,
}: {
  questId: string;
  operationItemId?: string;
  flowId?: string;
}): Promise<QuestGetQaChecklistResponderResult> => {
  try {
    const { checklists, track } = await questGetQaChecklistBroker({
      questId: questIdContract.parse(questId),
      ...(operationItemId !== undefined && { operationItemId: operationItemId as never }),
      ...(flowId !== undefined && { flowId: flowId as never }),
    });

    // A track whose `flowTypes` omit `operational` cannot be handed an operational flow at all, so
    // an empty result on such a track means "every flow here is one you are not measured over" —
    // a different fact from "this quest has no flows", and the one the session has to act on.
    const isRuntimeOnlyTrack =
      track !== undefined &&
      !signoffTrackEligibilityStatics.byTrack[track].flowTypes.some(
        (flowType) => flowType === 'operational',
      );

    // An item whose ROLE has no sign-off track resolves to no scope, which is not the same fact as
    // a quest with no flows: `spiritmender` and `warpgate` are measured on what their own prompt
    // hands them, so the honest answer names that rather than reading as "nothing to verify" —
    // which a session would act on by signalling done over unfinished scope.
    if (operationItemId !== undefined && track === undefined) {
      return {
        success: true,
        data: contentTextContract.parse(
          `That operation item's role has no sign-off track, so no checklist measures it. What it must do is stated in its own prompt and its Operation Context. There is no tool to hunt for.`,
        ),
      };
    }

    if (checklists.length === 0) {
      return {
        success: true,
        data: contentTextContract.parse(
          flowId === undefined
            ? isRuntimeOnlyTrack
              ? `This quest has no runtime flows, so the ${track} track has nothing to walk. That is a real state, not an error — operational flows are verified by Siegemaster checking their end state, never by an authored suite. Your denominator is zero units, so commit the record and signal done.`
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
