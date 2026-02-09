/**
 * PURPOSE: Defines the input schema for the quest get operation that retrieves a quest by ID
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId
 *
 * const filtered: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth', sections: ['requirements', 'observables'] });
 * // Returns only the specified sections; excluded sections come back as empty arrays
 */
import { z } from 'zod';

import { questSectionContract } from '../quest-section/quest-section-contract';

export const getQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to retrieve').brand<'QuestId'>(),
    sections: z
      .array(questSectionContract)
      .describe(
        'Optional list of sections to include. Omit to return all sections. Excluded sections return as empty arrays.',
      )
      .optional(),
  })
  .brand<'GetQuestInput'>();

export type GetQuestInput = z.infer<typeof getQuestInputContract>;
