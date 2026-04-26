/**
 * PURPOSE: Handles session chat requests by validating input and delegating to orchestrator for CLI resumption
 *
 * USAGE:
 * const result = await SessionChatResponder({ params: { sessionId: 'sess-123' }, body: { message: 'hello', guildId: 'abc' } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { guildMessageBodyContract } from '../../../contracts/guild-message-body/guild-message-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { sessionIdParamsContract } from '../../../contracts/session-id-params/session-id-params-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const SessionChatResponder = async ({
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

    const parsedBody = guildMessageBodyContract.safeParse(body);
    if (!parsedBody.success) {
      const { fieldErrors } = parsedBody.error.flatten();
      if (fieldErrors.message) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: 'message is required' },
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }
    const { guildId, message } = parsedBody.data;

    const { chatProcessId } = await orchestratorStartChatAdapter({
      guildId,
      message,
      sessionId,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start session chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
