/**
 * PURPOSE: Handles guild chat requests by validating input, building prompt, spawning Claude CLI, and managing process lifecycle
 *
 * USAGE:
 * const result = await GuildChatResponder({ params: { guildId: 'abc-123' }, body: { message: 'hello' }, clients });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import {
  guildIdContract,
  wsMessageContract,
  contentTextContract,
} from '@dungeonmaster/shared/contracts';
import { promptTemplateAssembleTransformer } from '@dungeonmaster/shared/transformers';
import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { cryptoRandomUuidAdapter } from '../../../adapters/crypto/random-uuid/crypto-random-uuid-adapter';
import { chaoswhispererPromptAdapter } from '../../../adapters/chaoswhisperer/prompt/chaoswhisperer-prompt-adapter';
import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { wsEventRelayBroadcastBroker } from '../../../brokers/ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import { chatProcessState } from '../../../state/chat-process/chat-process-state';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';

export const GuildChatResponder = async ({
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
    const guild = await orchestratorGetGuildAdapter({ guildId });
    const guildPath = guild.path;

    const chatProcessId = cryptoRandomUuidAdapter();

    const { template, argumentsPlaceholder } = chaoswhispererPromptAdapter();

    const promptForCli = promptTemplateAssembleTransformer({
      template,
      placeholder: argumentsPlaceholder,
      value: contentTextContract.parse(rawMessage),
    });

    const args = ['-p', promptForCli];

    const { kill } = chatSpawnBroker({
      args,
      workingDir: guildPath,
      clients,
      chatProcessId,
      logPrefix: 'Guild',
      extractSessionId: true,
      onExit: ({ exitCode, extractedSessionId }) => {
        chatProcessState.remove({ processId: chatProcessId });

        wsEventRelayBroadcastBroker({
          clients,
          message: wsMessageContract.parse({
            type: 'chat-complete',
            payload: {
              chatProcessId,
              exitCode,
              ...(extractedSessionId && { sessionId: extractedSessionId }),
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
    const message = error instanceof Error ? error.message : 'Failed to start guild chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
