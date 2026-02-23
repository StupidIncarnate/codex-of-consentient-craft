/**
 * PURPOSE: Handles quest retrieval requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestGetResponder({ params: { questId: 'abc' }, query: { stage: 'spec' } });
 * // Returns { status: 200, data: quest } or { status: 400/500, data: { error } }
 */

import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestGetResponder = async ({
  params,
  query,
}: {
  params: unknown;
  query: unknown;
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
    const stage: unknown =
      typeof query === 'object' && query !== null ? Reflect.get(query, 'stage') : undefined;
    const quest = await orchestratorGetQuestAdapter({
      questId: questIdRaw,
      ...(typeof stage === 'string' && { stage }),
    });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: quest });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
