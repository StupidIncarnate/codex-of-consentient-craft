/**
 * PURPOSE: Handles per-quest clarification answers — loads quest, resolves chat sessionId, persists
 * the images pasted into each answer (rewriting that answer's placeholders to file paths), and
 * delegates to orchestrator clarify adapter. The persist step runs here because it needs the guildId
 * and questId the orchestrator's clarify adapter does not resolve on its own.
 *
 * USAGE:
 * const result = await QuestClarifyResponder({ params: { questId }, body: { answers, questions } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/404/500, data: { error } }
 */

import {
  clarificationAnswerContract,
  questFindQuestPathBroker,
  StartOrchestrator,
} from '@dungeonmaster/orchestrator';
import type { ClarificationAnswer } from '@dungeonmaster/orchestrator';
import { isChatWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { pastedImagePersistBroker } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker';
import { zodFirstFieldErrorMessageTransformer } from '../../../transformers/zod-first-field-error-message/zod-first-field-error-message-transformer';
import { questClarifyBodyContract } from '../../../contracts/quest-clarify-body/quest-clarify-body-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { questClarifyResponseDataContract } from '../../../contracts/quest-clarify-response-data/quest-clarify-response-data-contract';

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
        data: responderErrorDataContract.parse({ error: 'Invalid params' }),
      });
    }

    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'questId is required' }),
      });
    }
    const { questId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Request body must be a JSON object' }),
      });
    }

    const parsedBody = questClarifyBodyContract.safeParse(body);
    if (!parsedBody.success) {
      // An answer's images sit at answers[n].images, so zod's own message (over-cap array,
      // disallowed mediaType, over-ceiling size) is surfaced verbatim as the chat route does,
      // rather than collapsed into the generic answers-required reply below.
      const imagesIssue = parsedBody.error.issues.find(
        (issue) => String(issue.path[0]) === 'answers' && String(issue.path[2]) === 'images',
      );
      if (imagesIssue !== undefined) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: responderErrorDataContract.parse({ error: imagesIssue.message }),
        });
      }
      const answersError = zodFirstFieldErrorMessageTransformer({
        error: parsedBody.error,
        field: 'answers',
      });
      if (answersError !== undefined) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: responderErrorDataContract.parse({
            error: 'answers array is required and must not be empty',
          }),
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'questions array is required' }),
      });
    }
    const { answers, questions } = parsedBody.data;

    const quest = await StartOrchestrator.loadQuest({ questId });

    const chatItem = quest.workItems.find(
      (wi) => isChatWorkItemRoleGuard({ role: wi.role }) && wi.sessionId,
    );
    const resolvedSessionId = chatItem?.sessionId;

    if (!resolvedSessionId) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.notFound,
        data: responderErrorDataContract.parse({ error: 'No active chat session found for quest' }),
      });
    }

    const { guildId } = await questFindQuestPathBroker({ questId });

    // One answer at a time: the broker mints its file ids inside its own images.map, so
    // concurrent answers would interleave uuid consumption. Each answer's own text and own images
    // go in, so its [Pasted Image 1] maps to a file written from that answer's image.
    const persistedAnswers = await answers.reduce<Promise<ClarificationAnswer[]>>(
      async (persistedSoFar, { images, ...answer }) => {
        const persisted = await persistedSoFar;
        const rewrittenText =
          answer.text === undefined
            ? undefined
            : await pastedImagePersistBroker({
                guildId,
                questId,
                message: answer.text,
                images: images ?? [],
              });
        return [
          ...persisted,
          clarificationAnswerContract.parse({
            header: answer.header,
            labels: answer.labels,
            ...(rewrittenText === undefined ? {} : { text: rewrittenText }),
          }),
        ];
      },
      Promise.resolve([]),
    );

    const { chatProcessId } = await StartOrchestrator.clarifyAnswer({
      guildId,
      sessionId: resolvedSessionId,
      questId,
      answers: persistedAnswers,
      questions,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: questClarifyResponseDataContract.parse({ chatProcessId }),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process clarification answers';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: errorMessage }),
    });
  }
};
