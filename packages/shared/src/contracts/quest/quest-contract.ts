/**
 * PURPOSE: Defines the main quest structure with phases, tasks, and metadata
 *
 * USAGE:
 * questContract.parse({id: 'add-auth', folder: '001-add-auth', title: 'Add Auth', ...});
 * // Returns: Quest object
 */

import { z } from 'zod';

import { dependencyStepContract } from '../dependency-step/dependency-step-contract';
import { designDecisionContract } from '../design-decision/design-decision-contract';
import { flowContract } from '../flow/flow-contract';
import { executionLogEntryContract } from '../execution-log-entry/execution-log-entry-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';

export const questContract = z.object({
  id: z.string().min(1).brand<'QuestId'>(),
  folder: z.string().min(1).brand<'QuestFolder'>(),
  title: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  executionLog: z
    .array(executionLogEntryContract)
    .default([])
    .describe(
      'Operational log of quest execution events. Not included in any stage filter - only available via full quest retrieval',
    ),
  designDecisions: z
    .array(designDecisionContract)
    .default([])
    .describe('Architectural choices and rationale that emerged during requirements capture'),
  steps: z
    .array(dependencyStepContract)
    .default([])
    .describe(
      'Dependency-ordered execution plan created by PathSeeker. Each step maps observables to concrete files',
    ),
  toolingRequirements: z
    .array(toolingRequirementContract)
    .default([])
    .describe('NPM packages needed for implementation that are not already in the project'),
  contracts: z
    .array(questContractEntryContract)
    .default([])
    .describe(
      'Shared type dictionary defining all data types, API endpoints, and event schemas. Included in every stage filter as the common reference for all agents',
    ),
  flows: z
    .array(flowContract)
    .default([])
    .describe('User journey sequences with nodes, edges, and embedded observables'),
  needsDesign: z
    .boolean()
    .default(false)
    .describe('Whether quest requires UI design phase before implementation'),
  designPort: z
    .number()
    .int()
    .positive()
    .brand<'DesignPort'>()
    .optional()
    .describe('Port of per-quest Vite design sandbox'),
  designSessionBy: z
    .string()
    .brand<'SessionId'>()
    .optional()
    .describe('Session ID of the Glyphsmith design session'),
  questCreatedSessionBy: z.string().brand<'SessionId'>().optional(),
  userRequest: z.string().brand<'UserRequest'>().optional(),
  abandonReason: z.string().brand<'AbandonReason'>().optional(),
});

export type Quest = z.infer<typeof questContract>;
