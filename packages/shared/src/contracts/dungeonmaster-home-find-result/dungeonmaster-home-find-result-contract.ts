/**
 * PURPOSE: Defines the data `dungeonmasterHomeFindBroker` returns
 *
 * USAGE:
 * dungeonmasterHomeFindResultContract.parse(value);
 * // Returns validated DungeonmasterHomeFindResult
 */
import { z } from '#gateway/npm/zod';

export const dungeonmasterHomeFindResultContract = z
  .object({ homePath: z.string().brand<'DungeonmasterHomeFindResultHomePath'>() })
  .brand<'DungeonmasterHomeFindResult'>();

export type DungeonmasterHomeFindResult = z.infer<typeof dungeonmasterHomeFindResultContract>;
