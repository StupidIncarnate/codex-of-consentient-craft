/**
 * PURPOSE: Defines the branded string type for Guild filesystem paths
 *
 * USAGE:
 * guildPathContract.parse('/home/user/my-guild');
 * // Returns: GuildPath branded string
 */

import { z } from 'zod';

export const guildPathContract = z.string().min(1).brand<'GuildPath'>();

export type GuildPath = z.infer<typeof guildPathContract>;
