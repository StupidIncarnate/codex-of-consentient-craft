/**
 * PURPOSE: Defines the output schema returned by the MCP create-quest tool
 *
 * USAGE:
 * createQuestOutputContract.parse({ questId, guildSlug });
 * // Returns: validated CreateQuestOutput with the newly-created quest id + guild slug for URL routing
 */
import { z } from '#gateway/npm/zod';

import { questContract } from '@dungeonmaster/shared/contracts';

export const createQuestOutputContract = z
  .object({
    questId: questContract.shape.id.describe('The id of the newly-created quest'),
    guildSlug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
      .brand<'CreateQuestOutputGuildSlug'>()
      .describe('URL-safe slug of the guild the quest was created in'),
  })
  .strict()
  .brand<'CreateQuestOutput'>();

export type CreateQuestOutput = z.infer<typeof createQuestOutputContract>;
