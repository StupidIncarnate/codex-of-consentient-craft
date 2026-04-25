/**
 * PURPOSE: Retrieves a single guild by ID from the dungeonmaster config
 *
 * USAGE:
 * const guild = await guildGetBroker({ guildId: GuildIdStub({ value: 'f47ac10b-...' }) });
 * // Returns: Guild object
 * // Throws if guild not found
 */

import type { Guild, GuildId } from '@dungeonmaster/shared/contracts';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import { GuildNotFoundError } from '../../../errors/guild-not-found/guild-not-found-error';
import { guildConfigReadBroker } from '../../guild-config/read/guild-config-read-broker';
import { guildConfigWriteBroker } from '../../guild-config/write/guild-config-write-broker';

export const guildGetBroker = async ({ guildId }: { guildId: GuildId }): Promise<Guild> => {
  const config = await guildConfigReadBroker();

  const guild = config.guilds.find((g) => g.id === guildId);

  if (!guild) {
    throw new GuildNotFoundError({ guildId });
  }

  if (!guild.urlSlug) {
    guild.urlSlug = nameToUrlSlugTransformer({ name: guild.name });
    await guildConfigWriteBroker({ config });
  }

  return guild;
};
