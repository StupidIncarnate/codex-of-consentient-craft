/**
 * PURPOSE: Handles user-initiated quest creation HTTP requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestUserAddResponder({ body: { title: 'My Quest', userRequest: 'Do X', guildId: 'abc' } });
 * // Returns { status: 201, data: result } or { status: 400/500, data: { error } }
 */

import { orchestratorAddQuestAdapter } from '../../../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter';
import { questUserAddBodyContract } from '../../../contracts/quest-user-add-body/quest-user-add-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestUserAddResponder = async ({
  body,
}: {
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = questUserAddBodyContract.safeParse(body);
    if (!parsedBody.success) {
      const { fieldErrors } = parsedBody.error.flatten();
      if (fieldErrors.title || fieldErrors.userRequest) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: 'title and userRequest are required strings' },
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }
    const { title, userRequest, guildId } = parsedBody.data;
    const result = await orchestratorAddQuestAdapter({ title, userRequest, guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.created,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
