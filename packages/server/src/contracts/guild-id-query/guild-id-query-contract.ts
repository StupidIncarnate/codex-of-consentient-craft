/**
 * PURPOSE: Defines the validated shape for HTTP query string carrying a guildId
 *
 * USAGE:
 * const { guildId } = guildIdQueryContract.parse(query);
 * // Returns { guildId: GuildId }
 */

import { z } from '#gateway/npm/zod';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const guildIdQueryContract = z.object({
  guildId: guildContract.shape.id,
}).brand<'GuildIdQuery'>();

export type GuildIdQuery = z.infer<typeof guildIdQueryContract>;
