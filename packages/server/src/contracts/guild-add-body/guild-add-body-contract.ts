/**
 * PURPOSE: Defines the validated body shape for the guild-add responder
 *
 * USAGE:
 * const { name, path } = guildAddBodyContract.parse(body);
 * // Returns: { name: GuildName, path: GuildPath }
 */

import { z } from '#gateway/npm/zod';

export const guildAddBodyContract = z.object({
  name: z.string().min(1).max(100).brand<'GuildAddBodyName'>(),
  path: z.string().min(1).brand<'GuildAddBodyPath'>(),
}).brand<'GuildAddBody'>();

export type GuildAddBody = z.infer<typeof guildAddBodyContract>;
