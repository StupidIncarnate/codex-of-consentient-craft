/**
 * PURPOSE: Defines the branded string type for Guild names with length constraints
 *
 * USAGE:
 * guildNameContract.parse('My Guild');
 * // Returns: GuildName branded string
 */

import { z } from 'zod';

const MAX_GUILD_NAME_LENGTH = 100;

export const guildNameContract = z.string().min(1).max(MAX_GUILD_NAME_LENGTH).brand<'GuildName'>();

export type GuildName = z.infer<typeof guildNameContract>;
