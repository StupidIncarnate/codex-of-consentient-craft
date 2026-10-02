/**
 * PURPOSE: Updates an existing guild's name and/or path in the dungeonmaster config
 *
 * USAGE:
 * const updated = await guildUpdateBroker({ guildId: GuildIdStub(), name: 'New Name' });
 * // Returns: Updated Guild object
 * // Throws if guild not found or path already in use by another guild
 */

import { guildContract, homeConfigContract } from '@dungeonmaster/shared/contracts';
import type { Guild } from '@dungeonmaster/shared/contracts';

import { GuildNotFoundError } from '../../../errors/guild-not-found/guild-not-found-error';
import { GuildPathTakenError } from '../../../errors/guild-path-taken/guild-path-taken-error';
import { homeConfigReadBroker } from '../../home-config/read/home-config-read-broker';
import { homeConfigWriteBroker } from '../../home-config/write/home-config-write-broker';

export const guildUpdateBroker = async ({
  guildId,
  name,
  path,
}: {
  guildId: Guild['id'];
  name?: string;
  path?: string;
}): Promise<Guild> => {
  const config = await homeConfigReadBroker();

  const existing = config.guilds.find((g) => g.id === guildId);

  if (!existing) {
    throw new GuildNotFoundError({ guildId });
  }

  if (path !== undefined) {
    const duplicate = config.guilds.find((g) => g.path === path && g.id !== guildId);
    if (duplicate) {
      throw new GuildPathTakenError({ path });
    }
  }

  const updated = guildContract.parse({
    ...existing,
    ...(name !== undefined && { name }),
    ...(path !== undefined && { path }),
  });

  const updatedGuilds = config.guilds.map((g) => (g.id === guildId ? updated : g));

  await homeConfigWriteBroker({ config: homeConfigContract.parse({ guilds: updatedGuilds }) });

  return updated;
};
