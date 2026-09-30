/**
 * PURPOSE: Delegates guild creation to the guild-add broker
 *
 * USAGE:
 * const guild = await GuildAddResponder({ name, path });
 * // Returns the newly created Guild
 */

import type { Guild, GuildName } from '@dungeonmaster/shared/contracts';

import { guildAddBroker } from '../../../brokers/guild/add/guild-add-broker';

export const GuildAddResponder = async ({
  name,
  path,
}: {
  name: GuildName;
  path: string;
}): Promise<Guild> => guildAddBroker({ name, path });
