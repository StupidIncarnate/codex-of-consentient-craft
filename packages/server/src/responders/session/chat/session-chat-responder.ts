/**
 * PURPOSE: Handles session chat requests by validating input and delegating to orchestrator for CLI resumption
 *
 * USAGE:
 * const result = await SessionChatResponder({ params: { sessionId: 'sess-123' }, body: { message: 'hello', guildId: 'abc' } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { guildIdContract, sessionIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
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

    const rawMessage: unknown = Reflect.get(body, 'message');
    const rawGuildId: unknown = Reflect.get(body, 'guildId');

    if (typeof rawMessage !== 'string' || rawMessage.length === 0) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }

    if (typeof rawGuildId !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    const sessionId = sessionIdContract.parse(sessionIdRaw);
    const guildId = guildIdContract.parse(rawGuildId);

    const { chatProcessId } = await orchestratorStartChatAdapter({
      guildId,
      message: rawMessage,
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
