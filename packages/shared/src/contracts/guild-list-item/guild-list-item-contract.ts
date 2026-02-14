/**
 * PURPOSE: Extends the guild contract with runtime information for list views
 *
 * USAGE:
 * guildListItemContract.parse({id: 'f47ac10b-...', name: 'My Guild', path: '/home/user/my-guild', createdAt: '2024-01-15T10:00:00.000Z', valid: true, questCount: 3});
 * // Returns: GuildListItem object
 */

import { z } from 'zod';

import { guildContract } from '../guild/guild-contract';

export const guildListItemContract = guildContract.extend({
  valid: z.boolean(),
  questCount: z.number().int().min(0).brand<'QuestCount'>(),
});

export type GuildListItem = z.infer<typeof guildListItemContract>;
