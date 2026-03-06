/**
 * PURPOSE: Defines the input schema for the quest modify operation that upserts data into a quest
 *
 * USAGE:
 * const input: ModifyQuestInput = modifyQuestInputContract.parse({ questId: 'add-auth', contexts: [...] });
 * // Returns validated ModifyQuestInput with questId and optional arrays for upsert
 */
import { z } from 'zod';

import {
  dependencyStepContract,
  designDecisionContract,
  flowContract,
  flowEdgeContract,
  flowNodeContract,
  flowObservableContract,
  questContractEntryContract,
  questStatusContract,
  toolingRequirementContract,
} from '@dungeonmaster/shared/contracts';

const deletableContract = z.object({ _delete: z.boolean().optional() });

const deletableObservableContract = flowObservableContract.and(deletableContract);
const deletableNodeContract = flowNodeContract
  .extend({ observables: z.array(deletableObservableContract).optional() })
  .and(deletableContract);
const deletableEdgeContract = flowEdgeContract.and(deletableContract);
const deletableFlowContract = flowContract
  .extend({
    nodes: z.array(deletableNodeContract).optional(),
    edges: z.array(deletableEdgeContract).optional(),
  })
  .and(deletableContract);

export const modifyQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to modify').brand<'QuestId'>(),
    designDecisions: z
      .array(designDecisionContract.and(deletableContract))
      .describe('Design decisions to upsert (existing ID updates, new ID adds)')
      .optional(),
    steps: z
      .array(dependencyStepContract.and(deletableContract))
      .describe('Dependency steps to upsert (existing ID updates, new ID adds)')
      .optional(),
    toolingRequirements: z
      .array(toolingRequirementContract.and(deletableContract))
      .describe('Tooling requirements to upsert (existing ID updates, new ID adds)')
      .optional(),
    contracts: z
      .array(questContractEntryContract.and(deletableContract))
      .describe('Contracts to upsert (existing ID updates, new ID adds)')
      .optional(),
    flows: z
      .array(deletableFlowContract)
      .describe('Flows to upsert (existing ID updates, new ID adds)')
      .optional(),
    status: questStatusContract.describe('Lifecycle gate transition status').optional(),
  })
  .brand<'ModifyQuestInput'>();

export type ModifyQuestInput = z.infer<typeof modifyQuestInputContract>;
