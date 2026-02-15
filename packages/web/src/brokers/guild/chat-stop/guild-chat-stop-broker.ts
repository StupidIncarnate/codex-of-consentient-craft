/**
 * PURPOSE: Stops a running Claude CLI chat process for a guild by posting to the stop endpoint
 *
 * USAGE:
 * await guildChatStopBroker({guildId, chatProcessId});
 * // Kills the running Claude process on the server
 */
import type { GuildId, ProcessId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildChatStopBroker = async ({
  guildId,
  chatProcessId,
}: {
  guildId: GuildId;
  chatProcessId: ProcessId;
}): Promise<{ stopped: boolean }> => {
  const url = webConfigStatics.api.routes.guildChatStop
    .replace(':guildId', guildId)
    .replace(':chatProcessId', chatProcessId);

  const result = await fetchPostAdapter<{ stopped: unknown }>({
    url,
    body: {},
  });

  return { stopped: result.stopped === true };
};
