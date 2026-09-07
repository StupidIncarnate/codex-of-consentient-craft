/**
 * PURPOSE: Validates Dungeonmaster configuration data structure
 *
 * USAGE:
 * dungeonmasterConfigContract.parse({questFolder: 'quest', wardCommands: {}});
 * // Returns validated DungeonmasterConfig with branded types
 */

import { z } from 'zod';

export const dungeonmasterConfigContract = z
  .object({
    questFolder: z.string().brand<'QuestFolder'>(),
    wardCommands: z.record(z.unknown()),
  })
  .passthrough();

export type DungeonmasterConfig = z.infer<typeof dungeonmasterConfigContract>;
