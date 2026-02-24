/**
 * PURPOSE: Sends a chat message for a session or creates a new session via guild endpoint
 *
 * USAGE:
 * const result = await sessionChatBroker({sessionId, guildId, message});
 * // Returns {chatProcessId: ProcessId}
 */
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, SessionId, UserInput } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const sessionChatBroker = async ({
  sessionId,
  guildId,
  message,
}: {
  sessionId?: SessionId;
  guildId: GuildId;
  message: UserInput;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = sessionId
    ? webConfigStatics.api.routes.sessionChat.replace(':sessionId', sessionId)
    : webConfigStatics.api.routes.sessionNew;

  const body = { message, guildId };

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body,
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
