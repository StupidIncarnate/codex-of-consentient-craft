/**
 * PURPOSE: Defines the validated body shape for the guild-update responder
 *
 * USAGE:
 * const { name, path } = guildUpdateBodyContract.parse(body);
 * // Returns: { name?: GuildName, path?: GuildPath }
 */

import { z } from '#gateway/npm/zod';
import { guildNameContract } from '@dungeonmaster/shared/contracts';

export const guildUpdateBodyContract = z.object({
  name: guildNameContract.optional(),
  path: z.string().min(1).brand<'GuildUpdateBodyPath'>().optional(),
});

export type GuildUpdateBody = z.infer<typeof guildUpdateBodyContract>;
