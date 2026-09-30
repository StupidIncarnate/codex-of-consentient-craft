/**
 * PURPOSE: Fetches the list of sessions for a guild from the API
 *
 * USAGE:
 * const sessions = await guildSessionListBroker({guildId});
 * // Returns SessionListItem[]
 */
import { sessionListItemContract } from '@dungeonmaster/shared/contracts';
import type { SessionListItem, Guild } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildSessionListBroker = async ({
  guildId,
}: {
  guildId: Guild['id'];
}): Promise<SessionListItem[]> => {
  const url = webConfigStatics.api.routes.guildSessions.replace(':guildId', guildId);

  const response = await fetchJson({ url });

  return sessionListItemContract.array().parse(response);
};
