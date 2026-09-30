/**
 * PURPOSE: Defines the main guild structure with identity, path, and creation metadata
 *
 * USAGE:
 * guildContract.parse({id: 'f47ac10b-...', name: 'My Guild', path: '/home/user/my-guild', createdAt: '2024-01-15T10:00:00.000Z'});
 * // Returns: Guild object
 */

import { z } from '#gateway/npm/zod';

import { guildNameContract } from '../guild-name/guild-name-contract';
import { guildPathContract } from '../guild-path/guild-path-contract';
import { urlSlugContract } from '../url-slug/url-slug-contract';

export const guildContract = z.object({
  id: z.uuid().brand<'GuildId'>(),
  name: guildNameContract,
  path: guildPathContract,
  urlSlug: urlSlugContract.optional(),
  createdAt: z.iso.datetime().brand<'IsoTimestamp'>(),
});

export type Guild = z.infer<typeof guildContract>;
