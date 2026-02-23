/**
 * PURPOSE: Handles quest verification requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestVerifyResponder({ params: { questId: 'abc' } });
 * // Returns { status: 200, data: result } or { status: 400/500, data: { error } }
 */

import { orchestratorVerifyQuestAdapter } from '../../../adapters/orchestrator/verify-quest/orchestrator-verify-quest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestVerifyResponder = async ({
  params,
}: {
  params: unknown;
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
    const result = await orchestratorVerifyQuestAdapter({ questId: questIdRaw });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to verify quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
