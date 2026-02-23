/**
 * PURPOSE: Handles session chat requests by validating input, spawning Claude CLI with --resume, and managing process lifecycle
 *
 * USAGE:
 * const result = await SessionChatResponder({ params: { sessionId: 'sess-123' }, body: { message: 'hello', guildId: 'abc' }, clients });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import {
  guildIdContract,
  sessionIdContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { cryptoRandomUuidAdapter } from '../../../adapters/crypto/random-uuid/crypto-random-uuid-adapter';
import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { wsEventRelayBroadcastBroker } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import { chatProcessState } from '../../../state/chat-process/chat-process-state';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';

export const SessionChatResponder = async ({
  params,
  body,
  clients,
}: {
  params: unknown;
  body: unknown;
  clients: Set<WsClient>;
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
    const guild = await orchestratorGetGuildAdapter({ guildId });
    const workingDir = guild.path;

    const chatProcessId = cryptoRandomUuidAdapter();

    const args = ['--resume', sessionId, '-p', rawMessage];

    const { kill } = chatSpawnBroker({
      args,
      workingDir,
      clients,
      chatProcessId,
      logPrefix: 'Session',
      onExit: ({ exitCode }) => {
        chatProcessState.remove({ processId: chatProcessId });

        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'chat-complete',
            payload: {
              chatProcessId,
              exitCode,
              sessionId,
            },
            timestamp: new Date().toISOString(),
          }),
        });
      },
    });

    chatProcessState.register({ processId: chatProcessId, kill });

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
