/**
 * PURPOSE: Defines the data `dungeonmasterHomeEnsureBroker` returns
 *
 * USAGE:
 * dungeonmasterHomeEnsureResultContract.parse(value);
 * // Returns validated DungeonmasterHomeEnsureResult
 */
import { z } from '#gateway/npm/zod';

export const dungeonmasterHomeEnsureResultContract = z
  .object({
    homePath: z.string().brand<'DungeonmasterHomeEnsureResultHomePath'>(),
    guildsPath: z.string().brand<'DungeonmasterHomeEnsureResultGuildsPath'>(),
  })
  .brand<'DungeonmasterHomeEnsureResult'>();

export type DungeonmasterHomeEnsureResult = z.infer<typeof dungeonmasterHomeEnsureResultContract>;
