/**
 * PURPOSE: Handles new session creation by validating input and delegating to orchestrator for CLI spawning
 *
 * USAGE:
 * const result = await SessionNewResponder({ body: { guildId: 'abc-123', message: 'hello' } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { guildIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const SessionNewResponder = async ({
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

    const rawGuildId: unknown = Reflect.get(body, 'guildId');
    const rawMessage: unknown = Reflect.get(body, 'message');

    if (typeof rawGuildId !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    if (typeof rawMessage !== 'string' || rawMessage.length === 0) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }

    const guildId = guildIdContract.parse(rawGuildId);
    const { chatProcessId } = await orchestratorStartChatAdapter({ guildId, message: rawMessage });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start new session';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
