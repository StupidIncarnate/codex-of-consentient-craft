/**
 * PURPOSE: Delegates guild removal to the guild-remove broker
 *
 * USAGE:
 * await GuildRemoveResponder({ guildId });
 * // Removes the guild from config; quest files are preserved on disk
 */

import type { AdapterResult, GuildId } from '@dungeonmaster/shared/contracts';

import { guildRemoveBroker } from '../../../brokers/guild/remove/guild-remove-broker';

export const GuildRemoveResponder = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<AdapterResult> => guildRemoveBroker({ guildId });
