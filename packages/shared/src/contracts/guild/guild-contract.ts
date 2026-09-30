/**
 * PURPOSE: Defines the main guild structure with identity, path, and creation metadata
 *
 * USAGE:
 * guildContract.parse({id: 'f47ac10b-...', name: 'My Guild', path: '/home/user/my-guild', createdAt: '2024-01-15T10:00:00.000Z'});
 * // Returns: Guild object
 */

import { z } from '#gateway/npm/zod';

import { guildNameContract } from '../guild-name/guild-name-contract';

export const guildContract = z.object({
  id: z.uuid().brand<'GuildId'>(),
  name: guildNameContract,
  path: z.string().min(1).brand<'GuildPath'>(),
  urlSlug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).brand<'GuildUrlSlug'>().optional(),
  createdAt: z.iso.datetime().brand<'GuildCreatedAt'>(),
}).brand<'Guild'>();

export type Guild = z.infer<typeof guildContract>;
