/**
 * PURPOSE: Sends a chat message for a guild, returns a process ID for tracking the response
 *
 * USAGE:
 * const result = await guildChatBroker({guildId, message, sessionId});
 * // Returns {chatProcessId: ProcessId}
 */
import { processIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, SessionId, UserInput } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildChatBroker = async ({
  guildId,
  message,
  sessionId,
}: {
  guildId: GuildId;
  message: UserInput;
  sessionId?: SessionId;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.guildChat.replace(':guildId', guildId);

  const response = await fetchPostAdapter<{ chatProcessId: unknown }>({
    url,
    body: { message, sessionId },
  });

  return { chatProcessId: processIdContract.parse(response.chatProcessId) };
};
