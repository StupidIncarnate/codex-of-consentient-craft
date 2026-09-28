/**
 * PURPOSE: Creates a new guild by posting name and path to the API
 *
 * USAGE:
 * const result = await guildCreateBroker({name: 'My Guild', path: '/home/user/my-guild'});
 * // Returns {id: GuildId}
 */

import { fetchJson } from '#gateway/browser/fetch';

import { guildCreateResultContract } from '../../../contracts/guild-create-result/guild-create-result-contract';
import type { GuildCreateResult } from '../../../contracts/guild-create-result/guild-create-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildCreateBroker = async ({
  name,
  path,
}: {
  name: string;
  path: string;
}): Promise<GuildCreateResult> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.guilds,
    method: 'POST',
    body: { name, path },
  });

  return guildCreateResultContract.parse(response);
};
