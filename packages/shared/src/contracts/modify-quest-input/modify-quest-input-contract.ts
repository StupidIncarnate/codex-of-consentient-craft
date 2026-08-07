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
 *
 * The two sign-off fields on the flow shapes — `flowriderSignoff` and `siegemasterSignoff` on an observable, a node,
 * an edge, and on each `offMapSignoffs` entry — are `.nullish()` HERE while the persisted contracts keep them
 * `.optional()`. `null` is the clear marker a reset writes: `{ id, siegemasterSignoff: null }` says "take this track's
 * sign-off off this unit", which `.optional()` alone cannot express, because omitting the key is how a patch says
 * "leave it alone". questItemDeepMergeTransformer reads an update value of `null` as "remove this key" rather than
 * storing it, so the persisted quest only ever sees the key present or absent. Making the persisted contracts nullable
 * too would invent a third state — a stored `null` — that no reader distinguishes from absent.
 */
import { z } from 'zod';

import { designDecisionContract } from '../design-decision/design-decision-contract';
import { designDecisionIdContract } from '../design-decision-id/design-decision-id-contract';
import { flowContract } from '../flow/flow-contract';
import { flowEdgeContract } from '../flow-edge/flow-edge-contract';
import { flowEdgeIdContract } from '../flow-edge-id/flow-edge-id-contract';
import { flowIdContract } from '../flow-id/flow-id-contract';
import { flowNodeContract } from '../flow-node/flow-node-contract';
import { flowNodeIdContract } from '../flow-node-id/flow-node-id-contract';
import { flowObservableContract } from '../flow-observable/flow-observable-contract';
import { flowOffMapSignoffContract } from '../flow-off-map-signoff/flow-off-map-signoff-contract';
import { observableIdContract } from '../observable-id/observable-id-contract';
import { operationItemContract } from '../operation-item/operation-item-contract';
import { operationItemIdContract } from '../operation-item-id/operation-item-id-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { planningBlightReportContract } from '../planning-blight-report/planning-blight-report-contract';
import { questBlightLedgerEntryContract } from '../quest-blight-ledger-entry/quest-blight-ledger-entry-contract';
import { questCommentContract } from '../quest-comment/quest-comment-contract';
import { questCommentIdContract } from '../quest-comment-id/quest-comment-id-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';
import { questContractEntryIdContract } from '../quest-contract-entry-id/quest-contract-entry-id-contract';
import { questNoteContract } from '../quest-note/quest-note-contract';
import { questQaLedgerEntryContract } from '../quest-qa-ledger-entry/quest-qa-ledger-entry-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { signoffContract } from '../signoff/signoff-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';
import { toolingRequirementIdContract } from '../tooling-requirement-id/tooling-requirement-id-contract';
import { wardResultContract } from '../ward-result/ward-result-contract';
import { workItemForUpsertContract } from '../work-item-for-upsert/work-item-for-upsert-contract';

const deleteMarker = z.literal(true);

const fullFlowObservable = flowObservableContract.extend({
  flowriderSignoff: signoffContract.nullish(),
  siegemasterSignoff: signoffContract.nullish(),
  _delete: z.boolean().optional(),
});
const deletableObservableContract = z.union([
  fullFlowObservable,
  fullFlowObservable.partial().required({ id: true }),
  z.object({ id: observableIdContract, _delete: deleteMarker }),
]);

const fullFlowNode = flowNodeContract.extend({
  observables: z.array(deletableObservableContract).optional(),
  flowriderSignoff: signoffContract.nullish(),
  siegemasterSignoff: signoffContract.nullish(),
  _delete: z.boolean().optional(),
});
const deletableNodeContract = z.union([
  fullFlowNode,
  fullFlowNode.partial().required({ id: true }),
  z.object({ id: flowNodeIdContract, _delete: deleteMarker }),
]);

const fullFlowEdge = flowEdgeContract.extend({
  flowriderSignoff: signoffContract.nullish(),
  siegemasterSignoff: signoffContract.nullish(),
  _delete: z.boolean().optional(),
});
const deletableEdgeContract = z.union([
  fullFlowEdge,
  fullFlowEdge.partial().required({ id: true }),
  z.object({ id: flowEdgeIdContract, _delete: deleteMarker }),
]);

const fullFlow = flowContract.extend({
  nodes: z.array(deletableNodeContract).optional(),
  edges: z.array(deletableEdgeContract).optional(),
  offMapSignoffs: z
    .array(
      flowOffMapSignoffContract.extend({
        flowriderSignoff: signoffContract.nullish(),
        siegemasterSignoff: signoffContract.nullish(),
      }),
    )
    .optional(),
  _delete: z.boolean().optional(),
});
const deletableFlowContract = z.union([
  fullFlow,
  fullFlow.partial().required({ id: true }),
  z.object({ id: flowIdContract, _delete: deleteMarker }),
]);

const fullDesignDecision = designDecisionContract.extend({ _delete: z.boolean().optional() });
const fullOperationItem = operationItemContract.extend({ _delete: z.boolean().optional() });
const fullToolingRequirement = toolingRequirementContract.extend({
  _delete: z.boolean().optional(),
});
const fullQuestContractEntry = questContractEntryContract.extend({
  _delete: z.boolean().optional(),
});
const fullPlanningBlightReport = planningBlightReportContract.extend({
  _delete: z.boolean().optional(),
});
// This field exists even though agents rarely write comments directly: the comment-batch route's
// own server-side write persists queued comments by going through this contract. The MCP layer
// (not this contract) is what blocks agent writes, by stripping `comments` from the modify-quest
// payload before validation. Removing this field would break the route's own persist.
const fullQuestComment = questCommentContract.extend({ _delete: z.boolean().optional() });

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
    operations: z
      .array(
        z.union([
          fullOperationItem,
          fullOperationItem.partial().required({ id: true }),
          z.object({ id: operationItemIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe(
        'Operation items to upsert onto the quest operations ledger. Send full shape for new entries; send { id, ...fields-you-changed } to patch an existing item; { id, _delete: true } to remove one (locked items cannot be deleted). Writable only by ChaosWhisperer at explore_observables — execution agents signal outcomes instead of writing the ledger',
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
    packagesAffected: z
      .array(packageNameContract)
      .describe(
        'Monorepo packages the quest will touch. Replaces the whole list on write (not an id-keyed upsert). ChaosWhisperer sets it during explore_observables.',
      )
      .optional(),
    flows: z
      .array(deletableFlowContract)
      .describe(
        'Flows to upsert. Send full shape for new flows; send { id, nodes: [...] } or similar partial shapes to edit nested structure without restating the whole flow',
      )
      .optional(),
    comments: z
      .array(
        z.union([
          fullQuestComment,
          fullQuestComment.partial().required({ id: true }),
          z.object({ id: questCommentIdContract, _delete: deleteMarker }),
        ]),
      )
      .describe(
        'Comments to upsert onto quest.comments. Send full shape for new entries; send { id, ...fields-you-changed } to patch an existing entry; { id, _delete: true } to remove one. The comment-batch route writes through this contract to persist queued comments; the MCP layer strips this field before validation to block agent writes, not this contract, so keep this field even though agents rarely populate it directly',
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
        blightReports: z
          .array(
            z.union([
              fullPlanningBlightReport,
              fullPlanningBlightReport.partial().required({ id: true }),
              z.object({ id: planningBlightReportContract.shape.id, _delete: deleteMarker }),
            ]),
          )
          .optional(),
        qaLedger: z
          .array(questQaLedgerEntryContract)
          .describe(
            'QA checklist dispositions to merge into quest.planningNotes.qaLedger, keyed on itemId — re-dispositioning a unit REPLACES its prior entry rather than appending a second one, so a pt-N session can correct a predecessor. This is the only write path for the ledger a track-less get-qa-checklist measures its flow-wide remainder against. The signal-back completion gate enforces the per-unit `flowriderSignoff` / `siegemasterSignoff`, which are written through `flows` on the element that carries them — an entry here settles no verification unit for either track.',
          )
          .optional(),
        blightLedger: z
          .array(questBlightLedgerEntryContract)
          .describe(
            'Blight checklist dispositions to merge into quest.planningNotes.blightLedger, keyed on itemId (changed file crossed with concern) — re-dispositioning a unit REPLACES its prior entry rather than appending a second one, so a continuation session can correct a predecessor. This is the only write path for the ledger the completion gate enforces.',
          )
          .optional(),
        questNotes: z
          .array(questNoteContract)
          .describe(
            'Durable side-channel notes appended to quest.planningNotes.questNotes, keyed on id — re-stating a note UPSERTS its prior entry rather than appending a duplicate, so a continuation session can sharpen a note it already left. These NEVER close a verification unit: they carry open questions, tooling failures, out-of-scope observations, and walk resets. A flow unit is closed by its own `flowriderSignoff` / `siegemasterSignoff`, and a blightwarden review unit by its blightLedger disposition.',
          )
          .optional(),
      })
      .partial()
      .describe(
        'Blightwarden blight reports, the blightwarden per-unit review ledger, the Siegemaster QA ledger dispositions, and the durable side-channel quest notes to merge into quest.planningNotes',
      )
      .optional(),
  })
  .strict()
  .brand<'ModifyQuestInput'>();

export type ModifyQuestInput = z.infer<typeof modifyQuestInputContract>;
