/**
 * PURPOSE: Fetches chat history entries for a session from the API
 *
 * USAGE:
 * const entries = await sessionChatHistoryBroker({sessionId, guildId});
 * // Returns raw JSONL entries array (unknown[])
 */
import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const sessionChatHistoryBroker = async ({
  sessionId,
  guildId,
}: {
  sessionId: SessionId;
  guildId: GuildId;
}): Promise<unknown[]> => {
  const basePath = webConfigStatics.api.routes.sessionChatHistory.replace(':sessionId', sessionId);
  const url = `${basePath}?guildId=${encodeURIComponent(guildId)}`;

  return fetchGetAdapter<unknown[]>({ url });
};
