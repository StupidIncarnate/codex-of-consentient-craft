/**
 * PURPOSE: Removes a guild from the dungeonmaster config without deleting quest files
 *
 * USAGE:
 * await guildRemoveBroker({ guildId: GuildIdStub({ value: 'f47ac10b-...' }) });
 * // Removes guild from config; quest files on disk are preserved
 * // Throws if guild not found
 */

import type { Guild } from '@dungeonmaster/shared/contracts';

import { GuildNotFoundError } from '../../../errors/guild-not-found/guild-not-found-error';
import { homeConfigReadBroker } from '../../home-config/read/home-config-read-broker';
import { homeConfigWriteBroker } from '../../home-config/write/home-config-write-broker';
import { homeConfigContract } from '@dungeonmaster/shared/contracts';

export const guildRemoveBroker = async ({ guildId }: { guildId: Guild['id'] }): Promise<void> => {
  const config = await homeConfigReadBroker();

  const exists = config.guilds.some((g) => g.id === guildId);

  if (!exists) {
    throw new GuildNotFoundError({ guildId });
  }

  const updatedGuilds = config.guilds.filter((g) => g.id !== guildId);

  await homeConfigWriteBroker({ config: homeConfigContract.parse({ guilds: updatedGuilds }) });
};
