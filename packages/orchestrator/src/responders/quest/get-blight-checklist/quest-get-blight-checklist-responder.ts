/**
 * PURPOSE: Returns the deterministic blight checklist for a quest's diff, rendered as text, by
 * delegating to questGetBlightChecklistBroker
 *
 * USAGE:
 * const result = await QuestGetBlightChecklistResponder({ questId: 'add-auth', scope: 'commit' });
 * // Returns { success: true, data: '<rendered checklist>' }
 *
 * A quest with no pinned `baseRef`, or a diff with zero changed files, returns a plain statement
 * of that rather than an error — both are real states a reviewer needs to be able to act on, and
 * turning either into a failure would push it toward inventing scope.
 *
 * `scope` is carried rather than fixed here because the caller decides which diff it is answering
 * for: a reviewer-minion is graded on ONE ROUND and passes `unpushed`, while a caller auditing a
 * landed commit wants `commit` and one auditing the whole branch wants `quest`.
 */

import {
  contentTextContract,
  errorMessageContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';
import type { ContentText, ErrorMessage } from '@dungeonmaster/shared/contracts';

import { questGetBlightChecklistBroker } from '../../../brokers/quest/get-blight-checklist/quest-get-blight-checklist-broker';
import { blightChecklistToTextTransformer } from '../../../transformers/blight-checklist-to-text/blight-checklist-to-text-transformer';

export type QuestGetBlightChecklistResponderResult =
  | { readonly success: true; readonly data: ContentText }
  | { readonly success: false; readonly error: ErrorMessage };

export const QuestGetBlightChecklistResponder = async ({
  questId,
  scope,
}: {
  questId: string;
  scope?: 'quest' | 'commit' | 'working-tree' | 'unpushed';
}): Promise<QuestGetBlightChecklistResponderResult> => {
  try {
    const parsedQuestId = questIdContract.parse(questId);
    const checklist = await questGetBlightChecklistBroker({
      questId: parsedQuestId,
      ...(scope !== undefined && { scope }),
    });

    if (checklist === null) {
      return {
        success: true,
        data: contentTextContract.parse(
          'This quest has no pinned review base (baseRef), so there is no diff to scope. That is a real state, not an error — a quest seeded before the base was pinned cannot have a review scope computed.',
        ),
      };
    }

    if (checklist.items.length === 0) {
      return {
        success: true,
        data: contentTextContract.parse(
          'There are no changed files to review against the pinned base, so there is nothing to disposition.',
        ),
      };
    }

    return {
      success: true,
      data: contentTextContract.parse(blightChecklistToTextTransformer({ checklist })),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessageContract.parse(errorMessage) };
  }
};
