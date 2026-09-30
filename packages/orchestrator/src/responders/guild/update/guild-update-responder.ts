/**
 * PURPOSE: Delegates guild update to the guild-update broker
 *
 * USAGE:
 * const updated = await GuildUpdateResponder({ guildId, name, path });
 * // Returns the updated Guild object
 */

import type { Guild } from '@dungeonmaster/shared/contracts';

import { guildUpdateBroker } from '../../../brokers/guild/update/guild-update-broker';

export const GuildUpdateResponder = async ({
  guildId,
  name,
  path,
}: {
  guildId: Guild['id'];
  name?: string;
  path?: string;
}): Promise<Guild> =>
  guildUpdateBroker({
    guildId,
    ...(name !== undefined && { name }),
    ...(path !== undefined && { path }),
  });
