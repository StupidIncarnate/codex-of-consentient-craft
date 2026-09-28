/**
 * PURPOSE: Fetches the list of all guilds from the API
 *
 * USAGE:
 * const guilds = await guildListBroker();
 * // Returns GuildListItem[]
 */
import { guildListItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildListBroker = async (): Promise<GuildListItem[]> => {
  const response = await fetchJson({ url: webConfigStatics.api.routes.guilds });

  return guildListItemContract.array().parse(response);
};
