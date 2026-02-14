/**
 * PURPOSE: Retrieves a single guild by ID from the dungeonmaster config
 *
 * USAGE:
 * const guild = await guildGetBroker({ guildId: GuildIdStub({ value: 'f47ac10b-...' }) });
 * // Returns: Guild object
 * // Throws if guild not found
 */

import type { Guild, GuildId } from '@dungeonmaster/shared/contracts';

import { guildConfigReadBroker } from '../../guild-config/read/guild-config-read-broker';

export const guildGetBroker = async ({ guildId }: { guildId: GuildId }): Promise<Guild> => {
  const config = await guildConfigReadBroker();

  const guild = config.guilds.find((g) => g.id === guildId);

  if (!guild) {
    throw new Error(`Guild not found: ${guildId}`);
  }

  return guild;
};
