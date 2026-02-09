/**
 * PURPOSE: Defines the input schema for the quest modify operation that upserts data into a quest
 *
 * USAGE:
 * const input: ModifyQuestInput = modifyQuestInputContract.parse({ questId: 'add-auth', contexts: [...] });
 * // Returns validated ModifyQuestInput with questId and optional arrays for upsert
 */
import { z } from 'zod';

import {
  contextContract,
  dependencyStepContract,
  designDecisionContract,
  observableContract,
  requirementContract,
  toolingRequirementContract,
} from '@dungeonmaster/shared/contracts';

export const modifyQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to modify').brand<'QuestId'>(),
    requirements: z
      .array(requirementContract)
      .describe('Requirements to upsert (existing ID updates, new ID adds)')
      .optional(),
    designDecisions: z
      .array(designDecisionContract)
      .describe('Design decisions to upsert (existing ID updates, new ID adds)')
      .optional(),
    contexts: z
      .array(contextContract)
      .describe('Contexts to upsert (existing ID updates, new ID adds)')
      .optional(),
    observables: z
      .array(observableContract)
      .describe('Observables to upsert (existing ID updates, new ID adds)')
      .optional(),
    steps: z
      .array(dependencyStepContract)
      .describe('Dependency steps to upsert (existing ID updates, new ID adds)')
      .optional(),
    toolingRequirements: z
      .array(toolingRequirementContract)
      .describe('Tooling requirements to upsert (existing ID updates, new ID adds)')
      .optional(),
  })
  .brand<'ModifyQuestInput'>();

export type ModifyQuestInput = z.infer<typeof modifyQuestInputContract>;
