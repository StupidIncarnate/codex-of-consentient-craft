/**
 * PURPOSE: Handles session clarification answer requests by validating input and delegating to orchestrator
 *
 * USAGE:
 * const result = await SessionClarifyResponder({ params: { sessionId: 'sess-123' }, body: { guildId, questId, answers, questions } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import {
  guildIdContract,
  questIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';
import { orchestratorClarifyAdapter } from '../../../adapters/orchestrator/clarify/orchestrator-clarify-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
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

    const sessionIdRaw: unknown = Reflect.get(params, 'sessionId');

    if (typeof sessionIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'sessionId is required' },
      });
    }

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const rawGuildId: unknown = Reflect.get(body, 'guildId');
    const rawQuestId: unknown = Reflect.get(body, 'questId');
    const rawAnswers: unknown = Reflect.get(body, 'answers');
    const rawQuestions: unknown = Reflect.get(body, 'questions');

    if (typeof rawGuildId !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    if (typeof rawQuestId !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }

    if (!Array.isArray(rawAnswers) || rawAnswers.length === 0) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'answers array is required and must not be empty' },
      });
    }

    if (!Array.isArray(rawQuestions)) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questions array is required' },
      });
    }

    const sessionId = sessionIdContract.parse(sessionIdRaw);
    const guildId = guildIdContract.parse(rawGuildId);
    const questId = questIdContract.parse(rawQuestId);

    const { chatProcessId } = await orchestratorClarifyAdapter({
      guildId,
      sessionId,
      questId,
      answers: rawAnswers as ClarifyAdapterParams['answers'],
      questions: rawQuestions as ClarifyAdapterParams['questions'],
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
