/**
 * PURPOSE: Handles guild chat requests by validating input and delegating to orchestrator for CLI spawning
 *
 * USAGE:
 * const result = await GuildChatResponder({ params: { guildId: 'abc-123' }, body: { message: 'hello' } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { guildIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const GuildChatResponder = async ({
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

    const guildIdRaw: unknown = Reflect.get(params, 'guildId');

    if (typeof guildIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const rawMessage: unknown = Reflect.get(body, 'message');

    if (typeof rawMessage !== 'string' || rawMessage.length === 0) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }

    const guildId = guildIdContract.parse(guildIdRaw);
    const { chatProcessId } = await orchestratorStartChatAdapter({ guildId, message: rawMessage });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start guild chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
