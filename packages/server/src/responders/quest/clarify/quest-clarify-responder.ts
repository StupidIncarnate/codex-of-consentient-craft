/**
 * PURPOSE: Handles per-quest clarification answers — loads quest, resolves chat sessionId, and delegates to orchestrator clarify adapter
 *
 * USAGE:
 * const result = await QuestClarifyResponder({ params: { questId }, body: { answers, questions } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/404/500, data: { error } }
 */

import { orchestratorClarifyAdapter } from '../../../adapters/orchestrator/clarify/orchestrator-clarify-adapter';
import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { questClarifyBodyContract } from '../../../contracts/quest-clarify-body/quest-clarify-body-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

type ClarifyAdapterParams = Parameters<typeof orchestratorClarifyAdapter>[0];

export const QuestClarifyResponder = async ({
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

    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }
    const { questId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = questClarifyBodyContract.safeParse(body);
    if (!parsedBody.success) {
      const { fieldErrors } = parsedBody.error.flatten();
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
    const { answers, questions } = parsedBody.data;

    const quest = await orchestratorLoadQuestAdapter({ questId });

    const chatItem = quest.workItems.find(
      (wi) => (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') && wi.sessionId,
    );
    const resolvedSessionId = chatItem?.sessionId;

    if (!resolvedSessionId) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.notFound,
        data: { error: 'No active chat session found for quest' },
      });
    }

    const { guildId } = await orchestratorFindQuestPathAdapter({ questId });

    const { chatProcessId } = await orchestratorClarifyAdapter({
      guildId,
      sessionId: resolvedSessionId,
      questId,
      answers: answers as ClarifyAdapterParams['answers'],
      questions: questions as ClarifyAdapterParams['questions'],
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process clarification answers';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: errorMessage },
    });
  }
};
