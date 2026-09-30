/**
 * PURPOSE: Handles user-initiated quest creation HTTP requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestUserAddResponder({ body: { title: 'My Quest', userRequest: 'Do X', guildId: 'abc' } });
 * // Returns { status: 201, data: result } or { status: 400/500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { zodFirstFieldErrorMessageTransformer } from '../../../transformers/zod-first-field-error-message/zod-first-field-error-message-transformer';
import { questUserAddBodyContract } from '../../../contracts/quest-user-add-body/quest-user-add-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { addQuestResultContract } from '@dungeonmaster/shared/contracts';

export const QuestUserAddResponder = async ({
  body,
}: {
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Request body must be a JSON object' }),
      });
    }

    const parsedBody = questUserAddBodyContract.safeParse(body);
    if (!parsedBody.success) {
      const titleError = zodFirstFieldErrorMessageTransformer({
        error: parsedBody.error,
        field: 'title',
      });
      const userRequestError = zodFirstFieldErrorMessageTransformer({
        error: parsedBody.error,
        field: 'userRequest',
      });
      if (titleError !== undefined || userRequestError !== undefined) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: responderErrorDataContract.parse({ error: 'title and userRequest are required strings' }),
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'guildId is required' }),
      });
    }
    const { title, userRequest, guildId } = parsedBody.data;
    const result = await StartOrchestrator.addQuest({ title, userRequest, guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.created,
      data: addQuestResultContract.parse(result),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
