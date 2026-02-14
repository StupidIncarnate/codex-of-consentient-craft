/**
 * PURPOSE: Fetches the list of all guilds from the API
 *
 * USAGE:
 * const guilds = await guildListBroker();
 * // Returns GuildListItem[]
 */
import { guildListItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildListBroker = async (): Promise<GuildListItem[]> => {
  const response = await fetchGetAdapter<unknown[]>({ url: webConfigStatics.api.routes.guilds });

  return guildListItemContract.array().parse(response);
};
