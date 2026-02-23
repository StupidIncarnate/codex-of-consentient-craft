/**
 * PURPOSE: Handles session chat history requests by reading and returning filtered JSONL entries
 *
 * USAGE:
 * const result = await SessionChatHistoryResponder({ params: { sessionId: 'sess-123' }, query: { guildId: 'abc' } });
 * // Returns { status: 200, data: entries } or { status: 400/500, data: { error } }
 */

import {
  guildIdContract,
  sessionIdContract,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';
import { osUserHomedirAdapter } from '../../../adapters/os/user-homedir/os-user-homedir-adapter';
import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { sessionChatHistoryBroker } from '../../../brokers/session/chat-history/session-chat-history-broker';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const SessionChatHistoryResponder = async ({
  params,
  query,
}: {
  params: unknown;
  query: unknown;
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

    if (typeof query !== 'object' || query === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid query' },
      });
    }

    const rawGuildId: unknown = Reflect.get(query, 'guildId');

    if (typeof rawGuildId !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId query parameter is required' },
      });
    }

    const sessionId = sessionIdContract.parse(sessionIdRaw);
    const guildId = guildIdContract.parse(rawGuildId);
    const guild = await orchestratorGetGuildAdapter({ guildId });
    const projectPath = absoluteFilePathContract.parse(guild.path);

    const homeDir = osUserHomedirAdapter();
    const entries = await sessionChatHistoryBroker({
      sessionId,
      projectPath,
      homeDir,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: entries,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to read session chat history';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
