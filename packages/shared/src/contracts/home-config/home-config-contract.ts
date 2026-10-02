/**
 * PURPOSE: Defines the structure of the dungeonmaster home's config file
 *
 * USAGE:
 * homeConfigContract.parse({guilds: [{id: 'f47ac10b-...', name: 'My Guild', path: '/home/user/my-guild', createdAt: '2024-01-15T10:00:00.000Z'}]});
 * // Returns: HomeConfig object
 */

import { z } from '#gateway/npm/zod';

import { guildContract } from '../guild/guild-contract';

export const homeConfigContract = z
  .object({
    guilds: z.array(guildContract).default([]),
  })
  .brand<'HomeConfig'>();

export type HomeConfig = z.infer<typeof homeConfigContract>;
