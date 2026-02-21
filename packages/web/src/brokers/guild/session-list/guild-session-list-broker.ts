/**
 * PURPOSE: Fetches the list of sessions for a guild from the API
 *
 * USAGE:
 * const sessions = await guildSessionListBroker({guildId});
 * // Returns SessionListItem[]
 */
import { sessionListItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, SessionListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildSessionListBroker = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<SessionListItem[]> => {
  const url = webConfigStatics.api.routes.guildSessions.replace(':guildId', guildId);

  const response = await fetchGetAdapter<unknown[]>({ url });

  return response.map((item) => sessionListItemContract.parse(item));
};
