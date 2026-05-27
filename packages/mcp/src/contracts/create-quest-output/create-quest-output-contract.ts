/**
 * PURPOSE: Defines the output schema returned by the MCP create-quest tool
 *
 * USAGE:
 * createQuestOutputContract.parse({ questId, guildSlug });
 * // Returns: validated CreateQuestOutput with the newly-created quest id + guild slug for URL routing
 */
import { z } from 'zod';

import { questIdContract, urlSlugContract } from '@dungeonmaster/shared/contracts';

export const createQuestOutputContract = z
  .object({
    questId: questIdContract.describe('The id of the newly-created quest'),
    guildSlug: urlSlugContract.describe('URL-safe slug of the guild the quest was created in'),
  })
  .strict();

export type CreateQuestOutput = z.infer<typeof createQuestOutputContract>;
