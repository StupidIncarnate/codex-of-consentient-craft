/**
 * PURPOSE: Defines the config file structure that stores registered guilds
 *
 * USAGE:
 * guildConfigContract.parse({guilds: [{id: 'f47ac10b-...', name: 'My Guild', path: '/home/user/my-guild', createdAt: '2024-01-15T10:00:00.000Z'}]});
 * // Returns: GuildConfig object
 */

import { z } from 'zod';

import { guildContract } from '../guild/guild-contract';

export const guildConfigContract = z.object({
  guilds: z.array(guildContract).default([]),
});

export type GuildConfig = z.infer<typeof guildConfigContract>;
