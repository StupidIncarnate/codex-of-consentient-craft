/**
 * PURPOSE: Validates input for the verify-quest MCP tool
 *
 * USAGE:
 * verifyQuestInputContract.parse({questId: 'add-auth'});
 * // Returns: VerifyQuestInput branded object
 */

import { z } from 'zod';

export const verifyQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to verify').brand<'QuestId'>(),
  })
  .brand<'VerifyQuestInput'>();

export type VerifyQuestInput = z.infer<typeof verifyQuestInputContract>;
