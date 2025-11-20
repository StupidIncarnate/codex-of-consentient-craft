/**
 * PURPOSE: Validates Questmaestro configuration data structure
 *
 * USAGE:
 * questmaestroConfigContract.parse({questFolder: 'quest', wardCommands: {}});
 * // Returns validated QuestmaestroConfig with branded types
 */

import { z } from 'zod';

export const questmaestroConfigContract = z
  .object({
    questFolder: z.string().brand<'QuestFolder'>(),
    wardCommands: z.record(z.unknown()),
  })
  .passthrough();

export type QuestmaestroConfig = z.infer<typeof questmaestroConfigContract>;
