/**
 * PURPOSE: Defines the input schema for the verify-quest tool that runs integrity checks on a quest
 *
 * USAGE:
 * const input: VerifyQuestInput = verifyQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated VerifyQuestInput with questId
 */
import { z } from 'zod';

export const verifyQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to verify').brand<'QuestId'>(),
  })
  .brand<'VerifyQuestInput'>();

export type VerifyQuestInput = z.infer<typeof verifyQuestInputContract>;
