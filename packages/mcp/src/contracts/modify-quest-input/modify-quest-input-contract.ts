/**
 * PURPOSE: Defines the input schema for the quest-modify-broker that upserts data into a quest
 *
 * USAGE:
 * const input: ModifyQuestInput = modifyQuestInputContract.parse({ questId: 'add-auth', contexts: [...] });
 * // Returns validated ModifyQuestInput with questId and optional arrays for upsert
 */
import { z } from 'zod';

import {
  dependencyStepContract,
  designDecisionContract,
  designDecisionIdContract,
  flowContract,
  flowEdgeContract,
  flowEdgeIdContract,
  flowIdContract,
  flowNodeContract,
  flowNodeIdContract,
  flowObservableContract,
  observableIdContract,
  planningReviewReportContract,
  planningScopeClassificationContract,
  planningSurfaceReportContract,
  planningSynthesisContract,
  planningWalkFindingsContract,
  questContractEntryContract,
  questContractEntryIdContract,
  questStatusContract,
  stepIdContract,
  toolingRequirementContract,
  toolingRequirementIdContract,
} from '@dungeonmaster/shared/contracts';

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
        'PathSeeker planningNotes upserts: scoped per status (allowlist-gated). surfaceReports use UUID-based upsert; tombstones supported.',
      )
      .optional(),
    status: questStatusContract.describe('Lifecycle gate transition status').optional(),
    title: z.string().min(1).describe('New title for the quest').optional(),
  })
  .brand<'ModifyQuestInput'>();

export type ModifyQuestInput = z.infer<typeof modifyQuestInputContract>;
