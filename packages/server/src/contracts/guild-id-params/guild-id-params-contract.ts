/**
 * PURPOSE: Defines the validated shape for HTTP route params containing a guildId field
 *
 * USAGE:
 * const { guildId } = guildIdParamsContract.parse(params);
 * // Returns: GuildIdParams with branded GuildId
 */

import { z } from 'zod';
import { guildIdContract } from '@dungeonmaster/shared/contracts';

export const guildIdParamsContract = z.object({
  guildId: guildIdContract,
});

export type GuildIdParams = z.infer<typeof guildIdParamsContract>;
