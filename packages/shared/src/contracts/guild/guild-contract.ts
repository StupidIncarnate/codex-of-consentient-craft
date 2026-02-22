/**
 * PURPOSE: Defines the main guild structure with identity, path, and creation metadata
 *
 * USAGE:
 * guildContract.parse({id: 'f47ac10b-...', name: 'My Guild', path: '/home/user/my-guild', createdAt: '2024-01-15T10:00:00.000Z'});
 * // Returns: Guild object
 */

import { z } from 'zod';

import { guildIdContract } from '../guild-id/guild-id-contract';
import { guildNameContract } from '../guild-name/guild-name-contract';
import { guildPathContract } from '../guild-path/guild-path-contract';
import { urlSlugContract } from '../url-slug/url-slug-contract';

export const guildContract = z.object({
  id: guildIdContract,
  name: guildNameContract,
  path: guildPathContract,
  urlSlug: urlSlugContract.optional(),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type Guild = z.infer<typeof guildContract>;
