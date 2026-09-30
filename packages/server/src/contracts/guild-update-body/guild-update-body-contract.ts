/**
 * PURPOSE: Defines the validated body shape for the guild-update responder
 *
 * USAGE:
 * const { name, path } = guildUpdateBodyContract.parse(body);
 * // Returns: { name?: GuildName, path?: GuildPath }
 */

import { z } from '#gateway/npm/zod';

export const guildUpdateBodyContract = z
  .object({
    name: z.string().min(1).max(100).brand<'GuildUpdateBodyName'>().optional(),
    path: z.string().min(1).brand<'GuildUpdateBodyPath'>().optional(),
  })
  .brand<'GuildUpdateBody'>();

export type GuildUpdateBody = z.infer<typeof guildUpdateBodyContract>;
