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
import { planningBlightReportContract } from '../planning-blight-report/planning-blight-report-contract';
import { planningReviewReportContract } from '../planning-review-report/planning-review-report-contract';
import { planningScopeClassificationContract } from '../planning-scope-classification/planning-scope-classification-contract';
import { planningSurfaceReportContract } from '../planning-surface-report/planning-surface-report-contract';
import { planningSynthesisContract } from '../planning-synthesis/planning-synthesis-contract';
import { planningWalkFindingsContract } from '../planning-walk-findings/planning-walk-findings-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';
import { wardResultContract } from '../ward-result/ward-result-contract';
import { workItemContract } from '../work-item/work-item-contract';

export const questContract = z.object({
  id: z.string().min(1).brand<'QuestId'>(),
  folder: z.string().min(1).brand<'QuestFolder'>(),
  title: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
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
  userRequest: z.string().min(1).brand<'UserRequest'>(),
  abandonReason: z.string().brand<'AbandonReason'>().optional(),
  workItems: z
    .array(workItemContract)
    .default([])
    .describe('Dependency-ordered queue of prompt executions and commands'),
  wardResults: z
    .array(wardResultContract)
    .default([])
    .describe('Ward failure outputs referenced by spiritmender work items via relatedDataItems'),
  planningNotes: z
    .object({
      scopeClassification: planningScopeClassificationContract.optional(),
      surfaceReports: z.array(planningSurfaceReportContract).default([]),
      blightReports: z.array(planningBlightReportContract).default([]),
      synthesis: planningSynthesisContract.optional(),
      walkFindings: planningWalkFindingsContract.optional(),
      reviewReport: planningReviewReportContract.optional(),
    })
    .default({ surfaceReports: [], blightReports: [] })
    .describe(
      'PathSeeker phase artifacts (scope classification, minion surface reports, synthesis, walk findings, review report) persisted between seek_* statuses. Also holds Blightwarden blight reports (cross-cutting whole-diff findings)',
    ),
});

export type Quest = z.infer<typeof questContract>;
