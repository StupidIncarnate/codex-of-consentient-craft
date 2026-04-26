/**
 * PURPOSE: Defines the validated body shape for the guild-update responder
 *
 * USAGE:
 * const { name, path } = guildUpdateBodyContract.parse(body);
 * // Returns: { name?: GuildName, path?: GuildPath }
 */

import { z } from 'zod';
import { guildNameContract, guildPathContract } from '@dungeonmaster/shared/contracts';

export const guildUpdateBodyContract = z.object({
  name: guildNameContract.optional(),
  path: guildPathContract.optional(),
});

export type GuildUpdateBody = z.infer<typeof guildUpdateBodyContract>;
