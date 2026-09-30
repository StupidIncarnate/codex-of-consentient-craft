/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a guildId field
 *
 * USAGE:
 * const { guildId } = guildIdParamsContract.parse(params);
 * // Returns: GuildIdParams with branded GuildId
 */

import { z } from '#gateway/npm/zod';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const guildIdParamsContract = z.object({
  guildId: guildContract.shape.id,
}).brand<'GuildIdParams'>();

export type GuildIdParams = z.infer<typeof guildIdParamsContract>;
