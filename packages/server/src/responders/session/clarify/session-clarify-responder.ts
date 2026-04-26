/**
 * PURPOSE: Handles session clarification answer requests by validating input and delegating to orchestrator
 *
 * USAGE:
 * const result = await SessionClarifyResponder({ params: { sessionId: 'sess-123' }, body: { guildId, questId, answers, questions } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { orchestratorClarifyAdapter } from '../../../adapters/orchestrator/clarify/orchestrator-clarify-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { sessionClarifyBodyContract } from '../../../contracts/session-clarify-body/session-clarify-body-contract';
import { sessionIdParamsContract } from '../../../contracts/session-id-params/session-id-params-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

type ClarifyAdapterParams = Parameters<typeof orchestratorClarifyAdapter>[0];

export const SessionClarifyResponder = async ({
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

    const parsedParams = sessionIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'sessionId is required' },
      });
    }
    const { sessionId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = sessionClarifyBodyContract.safeParse(body);
    if (!parsedBody.success) {
      const { fieldErrors } = parsedBody.error.flatten();
      if (fieldErrors.guildId) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: 'guildId is required' },
        });
      }
      if (fieldErrors.questId) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: 'questId is required' },
        });
      }
      if (fieldErrors.answers) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: 'answers array is required and must not be empty' },
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questions array is required' },
      });
    }
    const { guildId, questId, answers, questions } = parsedBody.data;

    const { chatProcessId } = await orchestratorClarifyAdapter({
      guildId,
      sessionId,
      questId,
      answers: answers as ClarifyAdapterParams['answers'],
      questions: questions as ClarifyAdapterParams['questions'],
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to process clarification answers';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
