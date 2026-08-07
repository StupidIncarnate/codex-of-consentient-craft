/**
 * PURPOSE: Handles GET requests for one quest's verification summary — validates the questId param
 * and returns the orchestrator's computed QuestSummary (per-flow/per-track sign-off coverage, the
 * observables added after approval, every `unconfirmable` verdict with its reason and question, and
 * the side-channel notes grouped by kind). Returns 404 when the quest cannot be loaded.
 *
 * USAGE:
 * const result = await QuestSummaryResponder({ params: { questId } });
 * // Returns { status: 200, data: QuestSummary } or { status: 400/404, data: { error } }
 */

import { orchestratorGetQuestSummaryAdapter } from '../../../adapters/orchestrator/get-quest-summary/orchestrator-get-quest-summary-adapter';
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
    const summary = await orchestratorGetQuestSummaryAdapter({
      questId: parsedParams.data.questId,
    });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: summary });
  } catch (error: unknown) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.notFound,
      data: { error: errorFormatReasonTransformer({ error }) },
    });
  }
};
