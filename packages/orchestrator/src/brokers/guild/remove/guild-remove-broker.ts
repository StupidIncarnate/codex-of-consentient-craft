/**
 * PURPOSE: Removes a guild from the dungeonmaster config without deleting quest files
 *
 * USAGE:
 * await guildRemoveBroker({ guildId: GuildIdStub({ value: 'f47ac10b-...' }) });
 * // Removes guild from config; quest files on disk are preserved
 * // Throws if guild not found
 */

import type { GuildId } from '@dungeonmaster/shared/contracts';

import { guildConfigReadBroker } from '../../guild-config/read/guild-config-read-broker';
import { guildConfigWriteBroker } from '../../guild-config/write/guild-config-write-broker';

export const guildRemoveBroker = async ({ guildId }: { guildId: GuildId }): Promise<void> => {
  const config = await guildConfigReadBroker();

  const exists = config.guilds.some((g) => g.id === guildId);

  if (!exists) {
    throw new Error(`Guild not found: ${guildId}`);
  }

  const updatedGuilds = config.guilds.filter((g) => g.id !== guildId);

  await guildConfigWriteBroker({ config: { guilds: updatedGuilds } });
};
