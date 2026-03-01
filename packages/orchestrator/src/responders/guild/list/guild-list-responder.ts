/**
 * PURPOSE: Delegates guild listing to the guild-list broker
 *
 * USAGE:
 * const items = await GuildListResponder();
 * // Returns GuildListItem[] for all registered guilds
 */

import type { GuildListItem } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../../brokers/guild/list/guild-list-broker';

export const GuildListResponder = async (): Promise<GuildListItem[]> => guildListBroker();
