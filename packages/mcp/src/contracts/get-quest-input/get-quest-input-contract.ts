/**
 * PURPOSE: Defines the input schema for the quest-get-broker that retrieves a quest by ID
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId
 */
import { z } from 'zod';

export const getQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to retrieve').brand<'QuestId'>(),
  })
  .brand<'GetQuestInput'>();

export type GetQuestInput = z.infer<typeof getQuestInputContract>;
