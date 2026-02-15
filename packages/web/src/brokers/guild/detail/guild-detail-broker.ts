/**
 * PURPOSE: Fetches a single guild by its ID from the API
 *
 * USAGE:
 * const guild = await guildDetailBroker({guildId});
 * // Returns Guild object
 */
import { guildContract } from '@dungeonmaster/shared/contracts';
import type { Guild, GuildId } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildDetailBroker = async ({ guildId }: { guildId: GuildId }): Promise<Guild> => {
  const response = await fetchGetAdapter<unknown>({
    url: webConfigStatics.api.routes.guildById.replace(':guildId', guildId),
  });

  return guildContract.parse(response);
};
