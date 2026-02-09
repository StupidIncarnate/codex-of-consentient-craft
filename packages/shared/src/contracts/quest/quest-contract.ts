/**
 * PURPOSE: Defines the main quest structure with phases, tasks, and metadata
 *
 * USAGE:
 * questContract.parse({id: 'add-auth', folder: '001-add-auth', title: 'Add Auth', ...});
 * // Returns: Quest object
 */

import { z } from 'zod';

import { contextContract } from '../context/context-contract';
import { dependencyStepContract } from '../dependency-step/dependency-step-contract';
import { designDecisionContract } from '../design-decision/design-decision-contract';
import { executionLogEntryContract } from '../execution-log-entry/execution-log-entry-contract';
import { observableContract } from '../observable/observable-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { requirementContract } from '../requirement/requirement-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';

export const questContract = z.object({
  id: z.string().min(1).brand<'QuestId'>(),
  folder: z.string().min(1).brand<'QuestFolder'>(),
  title: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  executionLog: z.array(executionLogEntryContract),
  requirements: z.array(requirementContract).default([]),
  designDecisions: z.array(designDecisionContract).default([]),
  contexts: z.array(contextContract),
  observables: z.array(observableContract),
  steps: z.array(dependencyStepContract),
  toolingRequirements: z.array(toolingRequirementContract),
  contracts: z
    .array(questContractEntryContract)
    .default([])
    .describe(
      'Shared type dictionary for the quest. Defines all data types, API endpoints, and event schemas that steps reference. Agents receive this section regardless of which step they work on',
    ),
  userRequest: z.string().brand<'UserRequest'>().optional(),
  abandonReason: z.string().brand<'AbandonReason'>().optional(),
});

export type Quest = z.infer<typeof questContract>;
