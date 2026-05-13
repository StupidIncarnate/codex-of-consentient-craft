/**
 * PURPOSE: Defines the input schema for the quest modify operation that upserts data into a quest
 *
 * USAGE:
 * const input: ModifyQuestInput = modifyQuestInputContract.parse({ questId: 'add-auth', contexts: [...] });
 * // Returns validated ModifyQuestInput with questId and optional arrays for upsert
 *
 * Each array-of-objects entry accepts THREE shapes (matched in order):
 *   1. Full shape — every required field present. Used to create a new entry.
 *   2. Partial-patch shape — { id, ...subset of fields }. Used to edit an existing entry; fields not sent are preserved.
 *   3. Delete marker — { id, _delete: true }. Removes the entry.
 * The server-side merge (questItemDeepMergeTransformer) only touches fields present in the update, so partial-patch
 * is the safe shape for editing entries another minion may have written.
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
import { planningBlightReportContract } from '../planning-blight-report/planning-blight-report-contract';
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

const fullFlowObservable = flowObservableContract.extend({ _delete: z.boolean().optional() });
const deletableObservableContract = z.union([
  fullFlowObservable,
  fullFlowObservable.partial().required({ id: true }),
  z.object({ id: observableIdContract, _delete: deleteMarker }),
]);

const fullFlowNode = flowNodeContract.extend({
  observables: z.array(deletableObservableContract).optional(),
  _delete: z.boolean().optional(),
});
const deletableNodeContract = z.union([
  fullFlowNode,
  fullFlowNode.partial().required({ id: true }),
  z.object({ id: flowNodeIdContract, _delete: deleteMarker }),
]);

const fullFlowEdge = flowEdgeContract.extend({ _delete: z.boolean().optional() });
const deletableEdgeContract = z.union([
  fullFlowEdge,
  fullFlowEdge.partial().required({ id: true }),
  z.object({ id: flowEdgeIdContract, _delete: deleteMarker }),
]);

const fullFlow = flowContract.extend({
  nodes: z.array(deletableNodeContract).optional(),
  edges: z.array(deletableEdgeContract).optional(),
  _delete: z.boolean().optional(),
});
const deletableFlowContract = z.union([
  fullFlow,
  fullFlow.partial().required({ id: true }),
  z.object({ id: flowIdContract, _delete: deleteMarker }),
]);

const fullDesignDecision = designDecisionContract.extend({ _delete: z.boolean().optional() });
const fullDependencyStep = dependencyStepContract.extend({ _delete: z.boolean().optional() });
const fullToolingRequirement = toolingRequirementContract.extend({
  _delete: z.boolean().optional(),
});
const fullQuestContractEntry = questContractEntryContract.extend({
  _delete: z.boolean().optional(),
});
const fullPlanningSurfaceReport = planningSurfaceReportContract.extend({
  _delete: z.boolean().optional(),
});
const fullPlanningBlightReport = planningBlightReportContract.extend({
  _delete: z.boolean().optional(),
});

export const modifyQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to modify').brand<'QuestId'>(),
    designDecisions: z
      .array(
        z.union([
          fullDesignDecision,
          fullDesignDecision.partial().required({ id: true }),
          z.object({ id: designDecisionIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe(
        'Design decisions to upsert. Send full shape for new entries; send { id, ...fields-you-changed } to patch an existing entry without clobbering other fields',
      )
      .optional(),
    steps: z
      .array(
        z.union([
          fullDependencyStep,
          fullDependencyStep.partial().required({ id: true }),
          z.object({ id: stepIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe(
        'Dependency steps to upsert. Send full shape for new entries; send { id, ...fields-you-changed } to patch an existing step without clobbering other fields (assertions, instructions, contracts left untouched)',
      )
      .optional(),
    toolingRequirements: z
      .array(
        z.union([
          fullToolingRequirement,
          fullToolingRequirement.partial().required({ id: true }),
          z.object({ id: toolingRequirementIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe(
        'Tooling requirements to upsert. Send full shape for new entries; send { id, ...fields-you-changed } to patch an existing entry without clobbering other fields',
      )
      .optional(),
    contracts: z
      .array(
        z.union([
          fullQuestContractEntry,
          fullQuestContractEntry.partial().required({ id: true }),
          z.object({ id: questContractEntryIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe(
        'Contracts to upsert. Send full shape for new entries; send { id, ...fields-you-changed } to patch (e.g. flip status from new to existing) without clobbering other fields',
      )
      .optional(),
    flows: z
      .array(deletableFlowContract)
      .describe(
        'Flows to upsert. Send full shape for new flows; send { id, nodes: [...] } or similar partial shapes to edit nested structure without restating the whole flow',
      )
      .optional(),
    status: questStatusContract.describe('Lifecycle gate transition status').optional(),
    pausedAtStatus: questStatusContract
      .nullable()
      .describe(
        'Orchestrator-only: snapshots the pre-pause status so resume can restore it. Stripped by the MCP layer so LLM callers cannot set it; set internally by the pause responder. Null is the clear marker written by the resume responder to remove the field from the persisted quest JSON.',
      )
      .optional(),
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
              fullPlanningSurfaceReport,
              fullPlanningSurfaceReport.partial().required({ id: true }),
              z.object({ id: planningSurfaceReportContract.shape.id, _delete: deleteMarker }),
            ]),
          )
          .optional(),
        blightReports: z
          .array(
            z.union([
              fullPlanningBlightReport,
              fullPlanningBlightReport.partial().required({ id: true }),
              z.object({ id: planningBlightReportContract.shape.id, _delete: deleteMarker }),
            ]),
          )
          .optional(),
        synthesis: planningSynthesisContract.optional(),
        walkFindings: planningWalkFindingsContract.optional(),
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
