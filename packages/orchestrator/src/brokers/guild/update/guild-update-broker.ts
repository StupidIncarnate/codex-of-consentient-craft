/**
 * PURPOSE: Updates an existing guild's name and/or path in the dungeonmaster config
 *
 * USAGE:
 * const updated = await guildUpdateBroker({ guildId: GuildIdStub(), name: GuildNameStub({ value: 'New Name' }) });
 * // Returns: Updated Guild object
 * // Throws if guild not found or path already in use by another guild
 */

import { guildContract } from '@dungeonmaster/shared/contracts';
import type { Guild, GuildId, GuildName, GuildPath } from '@dungeonmaster/shared/contracts';

import { guildConfigReadBroker } from '../../guild-config/read/guild-config-read-broker';
import { guildConfigWriteBroker } from '../../guild-config/write/guild-config-write-broker';

export const guildUpdateBroker = async ({
  guildId,
  name,
  path,
}: {
  guildId: GuildId;
  name?: GuildName;
  path?: GuildPath;
}): Promise<Guild> => {
  const config = await guildConfigReadBroker();

  const existing = config.guilds.find((g) => g.id === guildId);

  if (!existing) {
    throw new Error(`Guild not found: ${guildId}`);
  }

  if (path !== undefined) {
    const duplicate = config.guilds.find((g) => g.path === path && g.id !== guildId);
    if (duplicate) {
      throw new Error(`A guild with path ${path} already exists`);
    }
  }

  const updated = guildContract.parse({
    ...existing,
    ...(name !== undefined && { name }),
    ...(path !== undefined && { path }),
  });

  const updatedGuilds = config.guilds.map((g) => (g.id === guildId ? updated : g));

  await guildConfigWriteBroker({ config: { guilds: updatedGuilds } });

  return updated;
};
