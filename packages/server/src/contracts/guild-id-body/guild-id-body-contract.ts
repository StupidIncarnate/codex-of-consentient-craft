/**
 * PURPOSE: Defines the validated body shape for endpoints that accept just a guildId
 *
 * USAGE:
 * const { guildId } = guildIdBodyContract.parse(body);
 * // Returns: { guildId: GuildId }
 */

import { z } from 'zod';
import { guildIdContract } from '@dungeonmaster/shared/contracts';

export const guildIdBodyContract = z.object({
  guildId: guildIdContract,
});

export type GuildIdBody = z.infer<typeof guildIdBodyContract>;
