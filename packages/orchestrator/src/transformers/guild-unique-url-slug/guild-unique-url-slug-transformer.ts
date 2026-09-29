/**
 * PURPOSE: Mints the url slug a NEW guild registers under — its name's slug, or that slug with the
 * first free `-<n>` suffix (from `-2`) when a registered guild already routes there. Reach for this
 * over `nameToUrlSlugTransformer` wherever a slug is minted for a guild joining a list: the web
 * routes every page by `/<urlSlug>/…`, so two guilds sharing one slug leaves the later one
 * unreachable. Names may repeat; the slug is the identity. A registered guild carrying no slug
 * yet is counted under the slug its name derives, since that is what the list backfills for it.
 *
 * USAGE:
 * guildUniqueUrlSlugTransformer({ name: GuildNameStub({ value: 'Guild 1' }), guilds: [guildOne] });
 * // Returns UrlSlug('guild-1-2') when guildOne already routes at 'guild-1', else UrlSlug('guild-1')
 */

import { urlSlugContract } from '@dungeonmaster/shared/contracts';
import type { Guild, GuildName, UrlSlug } from '@dungeonmaster/shared/contracts';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

export const guildUniqueUrlSlugTransformer = ({
  name,
  guilds,
  ordinal = 1,
}: {
  name: GuildName;
  guilds: readonly Guild[];
  ordinal?: number;
}): UrlSlug => {
  const base = nameToUrlSlugTransformer({ name });
  const candidate = ordinal === 1 ? base : urlSlugContract.parse(`${base}-${String(ordinal)}`);

  const taken = guilds.some(
    (guild) => (guild.urlSlug ?? nameToUrlSlugTransformer({ name: guild.name })) === candidate,
  );

  return taken ? guildUniqueUrlSlugTransformer({ name, guilds, ordinal: ordinal + 1 }) : candidate;
};
