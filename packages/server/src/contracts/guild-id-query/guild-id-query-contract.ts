/**
 * PURPOSE: Defines the validated shape for HTTP query string carrying a guildId
 *
 * USAGE:
 * const { guildId } = guildIdQueryContract.parse(query);
 * // Returns { guildId: GuildId }
 */

import { z } from '#gateway/npm/zod';
import { guildIdContract } from '@dungeonmaster/shared/contracts';

export const guildIdQueryContract = z.object({
  guildId: guildIdContract,
});

export type GuildIdQuery = z.infer<typeof guildIdQueryContract>;
