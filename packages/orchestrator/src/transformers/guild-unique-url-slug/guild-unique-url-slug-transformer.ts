/**
 * PURPOSE: Mints the url slug a NEW guild registers under — its name's slug, or that slug with the
 * first free `-<n>` suffix (from `-2`) when a registered guild already routes there. Reach for this
 * over `nameToUrlSlugTransformer` wherever a slug is minted for a guild joining a list: the web
 * routes every page by `/<urlSlug>/…`, so two guilds sharing one slug leaves the later one
 * unreachable. Names may repeat; the slug is the identity. A registered guild carrying no slug
 * yet is counted under the slug its name derives, since that is what the list backfills for it.
 *
 * USAGE:
 * guildUniqueUrlSlugTransformer({ name: GuildStub({ name: 'Guild 1' }).name, guilds: [guildOne] });
 * // Returns 'guild-1-2' when guildOne already routes at 'guild-1', else 'guild-1'
 */

import { guildContract } from '@dungeonmaster/shared/contracts';
import type { Guild } from '@dungeonmaster/shared/contracts';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

export const guildUniqueUrlSlugTransformer = ({
  name,
  guilds,
  ordinal = 1,
}: {
  name: Guild['name'];
  guilds: readonly Guild[];
  ordinal?: number;
}): NonNullable<Guild['urlSlug']> => {
  const base = nameToUrlSlugTransformer({ name });
  const candidate =
    ordinal === 1 ? base : guildContract.shape.urlSlug.unwrap().parse(`${base}-${String(ordinal)}`);

  const taken = guilds.some(
    (guild) => (guild.urlSlug ?? nameToUrlSlugTransformer({ name: guild.name })) === candidate,
  );

  return taken ? guildUniqueUrlSlugTransformer({ name, guilds, ordinal: ordinal + 1 }) : candidate;
};
