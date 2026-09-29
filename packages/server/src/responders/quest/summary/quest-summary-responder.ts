/**
 * PURPOSE: Handles GET requests for one quest's verification summary — validates the questId param
 * and returns the orchestrator's computed QuestSummary (per-flow/per-track mark counts, the
 * observables added after approval, every unit carrying debt — `cant-meet` or `unmet` — with its
 * evidence and next action, the `verifyByHuman` criteria no track can settle, and the side-channel
 * notes grouped by kind). Returns 404 when no guild holds the quest and 500 for any other load failure.
 *
 * USAGE:
 * const result = await QuestSummaryResponder({ params: { questId } });
 * // Returns { status: 200, data: QuestSummary } or { status: 400/404/500, data: { error } }
 */

import { QuestNotFoundError, StartOrchestrator } from '@dungeonmaster/orchestrator';
import { questSummaryParamsContract } from '../../../contracts/quest-summary-params/quest-summary-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { errorFormatReasonTransformer } from '../../../transformers/error-format-reason/error-format-reason-transformer';

export const QuestSummaryResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  const parsedParams = questSummaryParamsContract.safeParse(params);
  if (!parsedParams.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: { error: 'questId is required' },
    });
  }

  try {
    const summary = await StartOrchestrator.getQuestSummary({
      questId: parsedParams.data.questId,
    });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: summary });
  } catch (error: unknown) {
    // Every other failure (an unreadable or invalid quest file, a permission error) is a server
    // fault, not a missing quest.
    const isQuestGone = error instanceof QuestNotFoundError;
    return responderResultContract.parse({
      status: isQuestGone
        ? httpStatusStatics.clientError.notFound
        : httpStatusStatics.serverError.internal,
      data: { error: errorFormatReasonTransformer({ error }) },
    });
  }
};
