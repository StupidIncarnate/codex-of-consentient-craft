/**
 * PURPOSE: Creates a new guild by posting name and path to the API
 *
 * USAGE:
 * const result = await guildCreateBroker({name: 'My Guild', path: '/home/user/my-guild'});
 * // Returns {id: GuildId}
 */
import { guildIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildCreateBroker = async ({
  name,
  path,
}: {
  name: string;
  path: string;
}): Promise<{ id: GuildId }> => {
  const response = await fetchPostAdapter<{ id: unknown }>({
    url: webConfigStatics.api.routes.projects,
    body: { name, path },
  });

  return { id: guildIdContract.parse(response.id) };
};
