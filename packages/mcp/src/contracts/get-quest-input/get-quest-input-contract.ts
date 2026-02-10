/**
 * PURPOSE: Defines the input schema for the quest-get-broker that retrieves a quest by ID
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId
 *
 * const filtered: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth', stage: 'spec' });
 * // Returns only the sections mapped to the 'spec' stage; excluded sections come back as empty arrays
 */
import { questStageContract } from '@dungeonmaster/orchestrator';
import { z } from 'zod';

export const getQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to retrieve').brand<'QuestId'>(),
    stage: questStageContract
      .describe(
        'Optional pipeline stage to filter sections. Omit to return all sections. Excluded sections return as empty arrays.',
      )
      .optional(),
  })
  .brand<'GetQuestInput'>();

export type GetQuestInput = z.infer<typeof getQuestInputContract>;
