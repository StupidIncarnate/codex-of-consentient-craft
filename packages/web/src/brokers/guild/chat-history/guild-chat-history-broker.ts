/**
 * PURPOSE: Fetches chat history entries for a guild session from the API
 *
 * USAGE:
 * const entries = await guildChatHistoryBroker({guildId, sessionId});
 * // Returns raw JSONL entries array (unknown[])
 */
import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildChatHistoryBroker = async ({
  guildId,
  sessionId,
}: {
  guildId: GuildId;
  sessionId: SessionId;
}): Promise<unknown[]> => {
  const basePath = webConfigStatics.api.routes.guildChatHistory.replace(':guildId', guildId);
  const url = `${basePath}?sessionId=${encodeURIComponent(sessionId)}`;

  return fetchGetAdapter<unknown[]>({ url });
};
