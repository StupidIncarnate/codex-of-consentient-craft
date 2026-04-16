/**
 * PURPOSE: Defines the input schema for the quest modify operation that upserts data into a quest
 *
 * USAGE:
 * const input: ModifyQuestInput = modifyQuestInputContract.parse({ questId: 'add-auth', contexts: [...] });
 * // Returns validated ModifyQuestInput with questId and optional arrays for upsert
 */
import { z } from 'zod';

import { dependencyStepContract } from '../dependency-step/dependency-step-contract';
import { designDecisionContract } from '../design-decision/design-decision-contract';
import { designDecisionIdContract } from '../design-decision-id/design-decision-id-contract';
import { flowContract } from '../flow/flow-contract';
import { flowEdgeContract } from '../flow-edge/flow-edge-contract';
import { flowEdgeIdContract } from '../flow-edge-id/flow-edge-id-contract';
import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowNodeContract } from '../flow-node/flow-node-contract';
import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { planningReviewReportContract } from '../planning-review-report/planning-review-report-contract';
import { planningScopeClassificationContract } from '../planning-scope-classification/planning-scope-classification-contract';
import { planningSurfaceReportContract } from '../planning-surface-report/planning-surface-report-contract';
import { planningSynthesisContract } from '../planning-synthesis/planning-synthesis-contract';
import { planningWalkFindingsContract } from '../planning-walk-findings/planning-walk-findings-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';
import { questContractEntryIdContract } from '../quest-contract-entry-id/quest-contract-entry-id-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { stepIdContract } from '../step-id/step-id-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';
import { toolingRequirementIdContract } from '../tooling-requirement-id/tooling-requirement-id-contract';
import { wardResultContract } from '../ward-result/ward-result-contract';
import { workItemForUpsertContract } from '../work-item-for-upsert/work-item-for-upsert-contract';

const deleteMarker = z.literal(true);

const deletableObservableContract = z.union([
  flowObservableContract.extend({ _delete: z.boolean().optional() }),
  z.object({ id: observableIdContract, _delete: deleteMarker }),
]);
const deletableNodeContract = z.union([
  flowNodeContract.extend({
    observables: z.array(deletableObservableContract).optional(),
    _delete: z.boolean().optional(),
  }),
  z.object({ id: flowNodeIdContract, _delete: deleteMarker }),
]);
const deletableEdgeContract = z.union([
  flowEdgeContract.extend({ _delete: z.boolean().optional() }),
  z.object({ id: flowEdgeIdContract, _delete: deleteMarker }),
]);
const deletableFlowContract = z.union([
  flowContract.extend({
    nodes: z.array(deletableNodeContract).optional(),
    edges: z.array(deletableEdgeContract).optional(),
    _delete: z.boolean().optional(),
  }),
  z.object({ id: flowIdContract, _delete: deleteMarker }),
]);

export const modifyQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to modify').brand<'QuestId'>(),
    designDecisions: z
      .array(
        z.union([
          designDecisionContract.extend({ _delete: z.boolean().optional() }),
          z.object({ id: designDecisionIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe('Design decisions to upsert (existing ID updates, new ID adds)')
      .optional(),
    steps: z
      .array(
        z.union([
          dependencyStepContract.extend({ _delete: z.boolean().optional() }),
          z.object({ id: stepIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe('Dependency steps to upsert (existing ID updates, new ID adds)')
      .optional(),
    toolingRequirements: z
      .array(
        z.union([
          toolingRequirementContract.extend({ _delete: z.boolean().optional() }),
          z.object({ id: toolingRequirementIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe('Tooling requirements to upsert (existing ID updates, new ID adds)')
      .optional(),
    contracts: z
      .array(
        z.union([
          questContractEntryContract.extend({ _delete: z.boolean().optional() }),
          z.object({ id: questContractEntryIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe('Contracts to upsert (existing ID updates, new ID adds)')
      .optional(),
    flows: z
      .array(deletableFlowContract)
      .describe('Flows to upsert (existing ID updates, new ID adds)')
      .optional(),
    status: questStatusContract.describe('Lifecycle gate transition status').optional(),
    title: z.string().min(1).describe('New title for the quest').optional(),
    designPort: z
      .number()
      .int()
      .positive()
      .brand<'DesignPort'>()
      .describe('Port of per-quest Vite design sandbox')
      .optional(),
    workItems: z
      .array(workItemForUpsertContract)
      .describe('Work items to upsert (existing ID updates, new ID adds)')
      .optional(),
    wardResults: z
      .array(wardResultContract)
      .describe('Ward result entries to upsert (existing ID updates, new ID adds)')
      .optional(),
    planningNotes: z
      .object({
        scopeClassification: planningScopeClassificationContract.optional(),
        surfaceReports: z
          .array(
            z.union([
              planningSurfaceReportContract.extend({ _delete: z.boolean().optional() }),
              z.object({ id: planningSurfaceReportContract.shape.id, _delete: deleteMarker }),
            ]),
          )
          .optional(),
        synthesis: planningSynthesisContract.optional(),
        walkFindings: planningWalkFindingsContract.optional(),
        reviewReport: planningReviewReportContract.optional(),
      })
      .partial()
      .describe(
        'PathSeeker planning artifacts to merge into quest.planningNotes (any subset of sub-fields per call)',
      )
      .optional(),
  })
  .strict()
  .brand<'ModifyQuestInput'>();

export type ModifyQuestInput = z.infer<typeof modifyQuestInputContract>;
