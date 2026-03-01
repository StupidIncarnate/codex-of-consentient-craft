/**
 * PURPOSE: Delegates guild retrieval by ID to the guild-get broker
 *
 * USAGE:
 * const guild = await GuildGetResponder({ guildId });
 * // Returns the Guild matching the given ID
 */

import type { Guild, GuildId } from '@dungeonmaster/shared/contracts';

import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';

export const GuildGetResponder = async ({ guildId }: { guildId: GuildId }): Promise<Guild> =>
  guildGetBroker({ guildId });
