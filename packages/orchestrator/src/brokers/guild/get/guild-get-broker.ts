/**
 * PURPOSE: Retrieves a single guild by ID from the dungeonmaster config
 *
 * USAGE:
 * const guild = await guildGetBroker({ guildId: GuildIdStub({ value: 'f47ac10b-...' }) });
 * // Returns: Guild object
 * // Throws if guild not found
 */

import type { Guild } from '@dungeonmaster/shared/contracts';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import { GuildNotFoundError } from '../../../errors/guild-not-found/guild-not-found-error';
import { homeConfigReadBroker } from '../../home-config/read/home-config-read-broker';
import { homeConfigWriteBroker } from '../../home-config/write/home-config-write-broker';

export const guildGetBroker = async ({ guildId }: { guildId: Guild['id'] }): Promise<Guild> => {
  const config = await homeConfigReadBroker();

  const guild = config.guilds.find((g) => g.id === guildId);

  if (!guild) {
    throw new GuildNotFoundError({ guildId });
  }

  if (!guild.urlSlug) {
    guild.urlSlug = nameToUrlSlugTransformer({ name: guild.name });
    await homeConfigWriteBroker({ config });
  }

  return guild;
};
