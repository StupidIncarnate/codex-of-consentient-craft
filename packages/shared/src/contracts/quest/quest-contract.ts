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
  executionLog: z
    .array(executionLogEntryContract)
    .default([])
    .describe(
      'Operational log of quest execution events. Not included in any stage filter - only available via full quest retrieval',
    ),
  requirements: z
    .array(requirementContract)
    .default([])
    .describe(
      'High-level feature descriptions with approval status. Each decomposes into 2-10 observables',
    ),
  designDecisions: z
    .array(designDecisionContract)
    .default([])
    .describe('Architectural choices and rationale that emerged during requirements capture'),
  contexts: z
    .array(contextContract)
    .default([])
    .describe(
      'Reusable environments WHERE things happen - pages, sections, environments. Referenced by observables via contextId',
    ),
  observables: z
    .array(observableContract)
    .default([])
    .describe(
      'BDD acceptance criteria structured as GIVEN (contextId) / WHEN (trigger) / THEN (outcomes). Each links to a requirement via requirementId',
    ),
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
  userRequest: z.string().brand<'UserRequest'>().optional(),
  abandonReason: z.string().brand<'AbandonReason'>().optional(),
});

export type Quest = z.infer<typeof questContract>;
