/**
 * PURPOSE: Handles quest modification requests by validating params/body and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestModifyResponder({ params: { questId: 'abc' }, body: { status: 'approved' } });
 * // Returns { status: 200, data: result } or { status: 400/500, data: { error } }
 */

import { orchestratorModifyQuestAdapter } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestModifyResponder = async ({
  params,
  body,
}: {
  params: unknown;
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }
    const questIdRaw: unknown = Reflect.get(params, 'questId');
    if (typeof questIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const result = await orchestratorModifyQuestAdapter({
      questId: questIdRaw,
      input: body as never,
    });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to modify quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
