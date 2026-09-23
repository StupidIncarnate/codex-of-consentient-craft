/**
 * PURPOSE: Handles GET requests for one quest's projected execution remainder — validates the
 * questId param and returns the orchestrator's computed QuestProjection (every MINTED scope's real
 * work items, continued forward through `agentFlowStatics`'s `routes.done` edge). Returns 404 when
 * the quest cannot be loaded.
 *
 * USAGE:
 * const result = await QuestProjectionResponder({ params: { questId } });
 * // Returns { status: 200, data: QuestProjection } or { status: 400/404, data: { error } }
 */

import { orchestratorGetQuestProjectionAdapter } from '../../../adapters/orchestrator/get-quest-projection/orchestrator-get-quest-projection-adapter';
import { questProjectionParamsContract } from '../../../contracts/quest-projection-params/quest-projection-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { errorFormatReasonTransformer } from '../../../transformers/error-format-reason/error-format-reason-transformer';

export const QuestProjectionResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  const parsedParams = questProjectionParamsContract.safeParse(params);
  if (!parsedParams.success) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.badRequest,
      data: { error: 'questId is required' },
    });
  }

  try {
    const projection = await orchestratorGetQuestProjectionAdapter({
      questId: parsedParams.data.questId,
    });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: projection,
    });
  } catch (error: unknown) {
    return responderResultContract.parse({
      status: httpStatusStatics.clientError.notFound,
      data: { error: errorFormatReasonTransformer({ error }) },
    });
  }
};
