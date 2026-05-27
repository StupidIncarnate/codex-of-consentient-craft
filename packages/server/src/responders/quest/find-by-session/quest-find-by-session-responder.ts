/**
 * PURPOSE: Handles GET /api/quests/by-session/:sessionId — returns 200 { questId } when found, 404 when not found
 *
 * USAGE:
 * const result = await QuestFindBySessionResponder({ params: { sessionId: 'abc-123' } });
 * // Returns { status: 200, data: { questId } } or { status: 404, data: { error } }
 */

import { orchestratorFindQuestBySessionIdAdapter } from '../../../adapters/orchestrator/find-quest-by-session-id/orchestrator-find-quest-by-session-id-adapter';
import { sessionIdParamsContract } from '../../../contracts/session-id-params/session-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestFindBySessionResponder = async ({
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
    const parsedParams = sessionIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'sessionId is required' },
      });
    }
    const { sessionId } = parsedParams.data;
    const questId = await orchestratorFindQuestBySessionIdAdapter({ sessionId });
    if (questId === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.notFound,
        data: { error: 'No quest found for session' },
      });
    }
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { questId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to find quest by session';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
