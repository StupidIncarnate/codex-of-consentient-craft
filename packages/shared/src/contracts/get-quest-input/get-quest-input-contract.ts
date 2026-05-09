/**
 * PURPOSE: Defines the input schema for the quest get operation that retrieves a quest by ID
 *
 * USAGE:
 * const input: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated GetQuestInput with questId
 *
 * const filtered: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth', stage: 'spec' });
 * // Returns only the sections mapped to the 'spec' stage; excluded sections come back as empty arrays
 *
 * const sliced: GetQuestInput = getQuestInputContract.parse({ questId: 'add-auth', stage: 'planning', slice: ['backend'] });
 * // Returns only steps[] entries whose step.slice is in the slice array; other sections are unaffected
 */
import { z } from 'zod';

import { questStageContract } from '../quest-stage/quest-stage-contract';
import { sliceNameContract } from '../slice-name/slice-name-contract';

export const getQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to retrieve').brand<'QuestId'>(),
    stage: questStageContract
      .describe(
        [
          'Optional pipeline stage to filter sections. Omit to return all sections. Excluded array sections return as empty arrays; excluded planningNotes returns as its default empty shape.',
          'Stage values:',
          '- "spec": flows, designDecisions, contracts, toolingRequirements',
          '- "spec-flows": flows, designDecisions, contracts, toolingRequirements',
          '- "spec-obs": flows, designDecisions, contracts, toolingRequirements',
          '- "planning": planningNotes, steps, contracts',
          '- "implementation": planningNotes, steps, contracts, toolingRequirements',
        ].join(' '),
      )
      .optional(),
    slice: z
      .array(sliceNameContract)
      .describe(
        'Optional slice-name filter for steps[]. When set, only steps whose step.slice is in this array are returned; other quest sections (flows, contracts, planningNotes, tooling) are unaffected. Omit to return steps from every slice.',
      )
      .optional(),
  })
  .strict()
  .brand<'GetQuestInput'>();

export type GetQuestInput = z.infer<typeof getQuestInputContract>;
