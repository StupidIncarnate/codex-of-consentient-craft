/**
 * PURPOSE: Defines the main quest structure with phases, tasks, and metadata
 *
 * USAGE:
 * questContract.parse({id: 'add-auth', folder: '001-add-auth', title: 'Add Auth', ...});
 * // Returns: Quest object
 */

import { z } from 'zod';

import { designDecisionContract } from '../design-decision/design-decision-contract';
import { flowContract } from '../flow/flow-contract';
import { operationItemContract } from '../operation-item/operation-item-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { planningBlightReportContract } from '../planning-blight-report/planning-blight-report-contract';
import { questBlightLedgerEntryContract } from '../quest-blight-ledger-entry/quest-blight-ledger-entry-contract';
import { questCommentContract } from '../quest-comment/quest-comment-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';
import { questQaLedgerEntryContract } from '../quest-qa-ledger-entry/quest-qa-ledger-entry-contract';
import { questSourceContract } from '../quest-source/quest-source-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { questTypeContract } from '../quest-type/quest-type-contract';
import { smoketestCaseResultContract } from '../smoketest-case-result/smoketest-case-result-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';
import { wardResultContract } from '../ward-result/ward-result-contract';
import { workItemContract } from '../work-item/work-item-contract';

export const questContract = z.object({
  id: z.string().min(1).brand<'QuestId'>(),
  folder: z.string().min(1).brand<'QuestFolder'>(),
  title: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  questType: questTypeContract
    .default('feature')
    .describe(
      'Which pipeline this quest follows. Defaults to feature for back-compat with existing quest.json files written before quest types existed.',
    ),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  updatedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  designDecisions: z
    .array(designDecisionContract)
    .default([])
    .describe('Architectural choices and rationale that emerged during requirements capture'),
  operations: z
    .array(operationItemContract)
    .default([])
    .describe(
      'The durable, ordered plan/status ledger driving dispatch. ChaosWhisperer seeds the implementation items at spec time; the orchestrator appends the verify tail at Start and mutates statuses at runtime. Execution agents never write it',
    ),
  toolingRequirements: z
    .array(toolingRequirementContract)
    .default([])
    .describe('NPM packages needed for implementation that are not already in the project'),
  packagesAffected: z
    .array(packageNameContract)
    .default([])
    .describe(
      'Monorepo packages that this quest will touch. Declared by ChaosWhisperer during spec approval; context for codeweaver operation items.',
    ),
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
  comments: z
    .array(questCommentContract)
    .default([])
    .describe(
      'User comments queued against flow-diagram nodes and delivered to the LLM chat as a batch',
    ),
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
  pausedAtStatus: questStatusContract
    .nullable()
    .optional()
    .describe(
      'The quest status at the moment the quest was paused by the user. Used to restore the pre-pause status on resume. Set by the orchestrator during pause; cleared on resume. Undefined when quest is not paused. Null is the wire-level clear marker written by the resume responder before the field is stripped from the persisted JSON.',
    ),
  baseRef: z
    .string()
    .min(1)
    .brand<'GitBaseRef'>()
    .optional()
    .describe(
      "The commit the quest's review diff is measured from, stamped when the relay is seeded. It exists because `git diff <default-branch>...HEAD` silently returns the wrong file set once the default branch absorbs the quest's own implementation commits.",
    ),
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
      blightReports: z.array(planningBlightReportContract).default([]),
      qaLedger: z
        .array(questQaLedgerEntryContract)
        .default([])
        .describe(
          "Siegemaster's per-unit QA dispositions, keyed on the derived QaChecklistItemId so coverage is computed rather than remembered. The signal-back completion gate reads this: a siegemaster item cannot report `done` while any checklist unit on its flow has no entry here.",
        ),
      blightLedger: z
        .array(questBlightLedgerEntryContract)
        .default([])
        .describe(
          "Blightwarden's per-unit review dispositions, keyed on the derived BlightChecklistItemId (changed file crossed with concern) so coverage is computed rather than remembered. The signal-back completion gate reads this: a blightwarden item cannot report `done` while any changed-file/concern unit has no entry here.",
        ),
    })
    .default({ blightReports: [], qaLedger: [], blightLedger: [] })
    .describe(
      'Blightwarden blight reports (cross-cutting whole-diff findings written by the blightwarden-minion and blightwarden-crosscut-minion sub-agents, judged by the blightwarden operator), the per-unit blightwarden review ledger, and the Siegemaster QA coverage ledger',
    ),
  questSource: questSourceContract
    .optional()
    .describe(
      'Discriminates how the quest was created: real user vs which smoketest suite hydrated it. Used by smoketest bulk-clear to scope deletions.',
    ),
  smoketestResults: z
    .array(smoketestCaseResultContract)
    .optional()
    .describe(
      'Per-case smoketest assertion results written by smoketestAssertFinalStateBroker after the quest reaches a terminal status.',
    ),
});

export type Quest = z.infer<typeof questContract>;
