/**
 * PURPOSE: Defines the input schema for adding a quest via the orchestrator
 *
 * USAGE:
 * const input: AddQuestInput = addQuestInputContract.parse({ title: 'Add Auth', userRequest: 'User wants...' });
 * // Returns validated AddQuestInput with title and userRequest
 */
import { z } from 'zod';

import { questSourceContract } from '../quest-source/quest-source-contract';
import { questTypeContract } from '../quest-type/quest-type-contract';

export const addQuestInputContract = z
  .object({
    title: z.string().min(1).describe('The title of the quest').brand<'QuestTitle'>(),
    userRequest: z
      .string()
      .min(1)
      .describe('The original user request that initiated this quest')
      .brand<'UserRequest'>(),
    questSource: questSourceContract
      .optional()
      .describe(
        'Optional tag for how this quest was created (real user vs smoketest suite). Persisted onto the quest.',
      ),
    questType: questTypeContract
      .optional()
      .describe(
        'Which pipeline this quest follows. Omitted defaults to feature on the quest contract. Set to bug-hunt by the /dumpster-hunt intake.',
      ),
  })
  .brand<'AddQuestInput'>();

export type AddQuestInput = z.infer<typeof addQuestInputContract>;
