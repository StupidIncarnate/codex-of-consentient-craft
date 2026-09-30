/**
 * PURPOSE: Handles GET /api/quests/by-session/:sessionId — returns 200 { questId } when found, 404 when not found
 *
 * USAGE:
 * const result = await QuestFindBySessionResponder({ params: { sessionId: 'abc-123' } });
 * // Returns { status: 200, data: { questId } } or { status: 404, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { sessionIdParamsContract } from '../../../contracts/session-id-params/session-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { questFindBySessionResponseDataContract } from '../../../contracts/quest-find-by-session-response-data/quest-find-by-session-response-data-contract';

export const QuestFindBySessionResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Invalid params' }),
      });
    }
    const parsedParams = sessionIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'sessionId is required' }),
      });
    }
    const { sessionId } = parsedParams.data;
    const questId = await StartOrchestrator.findQuestBySessionId({ sessionId });
    if (questId === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.notFound,
        data: responderErrorDataContract.parse({ error: 'No quest found for session' }),
      });
    }
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: questFindBySessionResponseDataContract.parse({ questId }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to find quest by session';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
