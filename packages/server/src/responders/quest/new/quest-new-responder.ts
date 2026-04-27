/**
 * PURPOSE: Handles new-quest-from-chat creation by validating input, delegating to orchestrator startChat, and returning questId + chatProcessId
 *
 * USAGE:
 * const result = await QuestNewResponder({ params: { guildId }, body: { message } });
 * // Returns { status: 200, data: { questId, chatProcessId } } or { status: 400/500, data: { error } }
 */

import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { guildIdParamsContract } from '../../../contracts/guild-id-params/guild-id-params-contract';
import { messageBodyContract } from '../../../contracts/message-body/message-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestNewResponder = async ({
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

    const parsedParams = guildIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }
    const { guildId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = messageBodyContract.safeParse(body);
    if (!parsedBody.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }
    const { message } = parsedBody.data;

    const { chatProcessId, questId } = await orchestratorStartChatAdapter({ guildId, message });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId, ...(questId === undefined ? {} : { questId }) },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create new quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: errorMessage },
    });
  }
};
