/**
 * PURPOSE: Defines the branded UUID type for Guild identifiers
 *
 * USAGE:
 * guildIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: GuildId branded string
 */

import { z } from 'zod';

export const guildIdContract = z.string().uuid().brand<'GuildId'>();

export type GuildId = z.infer<typeof guildIdContract>;
