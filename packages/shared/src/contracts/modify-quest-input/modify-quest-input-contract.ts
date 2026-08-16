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
 *
 * The package fields are threaded through the flow shapes DELIBERATELY, not by accident of reuse.
 * Only the top object is `.strict()`; the flow/node/observable unions are `.extend().partial()`
 * objects, which STRIP an unrecognised key instead of rejecting it — the behaviour
 * `questFlowAdditiveOnlyViolationsTransformer` relies on. A node's `packages` therefore has to reach
 * this contract through `flowNodeContract` itself, and an observable's `package` has to be declared
 * here, or the field is silently dropped on every write and the persisted quest never sees it.
 * Threading them makes the tags SURVIVE; it does not make them mandatory, because a node missing
 * `packages` is shape-identical to a patch that simply left them alone. That rule binds on the save
 * side.
 *
 * An observable's `package` is `.optional()` here while the persisted `flowObservableContract`
 * requires it: on a node tagged with exactly one package the save resolves it from the node, so the
 * author has nothing to state. `quest.packageGraph` is deliberately ABSENT — it is derived at Start
 * through `questOperationsUpdateBroker`, which bypasses this allowlist, and no agent writes it.
 *
 * EVERY TIMESTAMP IS `.optional()` HERE AND REQUIRED ON THE PERSISTED CONTRACT — a sign-off's `at`,
 * a blight-ledger entry's `createdAt`, a quest note's `at`, an operation plan's `at`. The same
 * asymmetry as `package` above, for a different reason: `questModifyBroker` stamps each one from the
 * server clock and DISCARDS whatever arrived, so requiring the field on input would only reject an
 * agent that correctly declined to invent a value. An LLM has no reliable clock; agent-supplied
 * timestamps have been observed identical across a whole quest and set in a future that never
 * happened.
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
import { operationPlanContract } from '../operation-plan/operation-plan-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { planningBlightReportContract } from '../planning-blight-report/planning-blight-report-contract';
import { questBlightLedgerEntryContract } from '../quest-blight-ledger-entry/quest-blight-ledger-entry-contract';
import { questCommentContract } from '../quest-comment/quest-comment-contract';
import { questCommentIdContract } from '../quest-comment-id/quest-comment-id-contract';
import { questContractEntryContract } from '../quest-contract-entry/quest-contract-entry-contract';
import { questContractEntryIdContract } from '../quest-contract-entry-id/quest-contract-entry-id-contract';
import { questNoteContract } from '../quest-note/quest-note-contract';
import { questPackageEntryContract } from '../quest-package-entry/quest-package-entry-contract';
import { questQaLedgerEntryContract } from '../quest-qa-ledger-entry/quest-qa-ledger-entry-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { signoffContract } from '../signoff/signoff-contract';
import { toolingRequirementContract } from '../tooling-requirement/tooling-requirement-contract';
import { toolingRequirementIdContract } from '../tooling-requirement-id/tooling-requirement-id-contract';
import { wardResultContract } from '../ward-result/ward-result-contract';
import { workItemForUpsertContract } from '../work-item-for-upsert/work-item-for-upsert-contract';

const deleteMarker = z.literal(true);

// One spelling of "the server owns this field", reused at every attachment point below so the
// instruction an agent reads is identical wherever it meets a timestamp.
const serverStampedTimestamp = z
  .string()
  .datetime()
  .brand<'IsoTimestamp'>()
  .optional()
  .describe(
    'OMIT THIS FIELD. Stamped server-side at write time from the server clock; any value you send ' +
      'is ignored and overwritten. An LLM has no reliable clock, so a value invented here is ' +
      'fabricated audit data — agent-written timestamps have been observed identical across a whole ' +
      'quest and dated into a future that never happened.',
  );

// `signoffContract` carries a `.superRefine`, which makes it a ZodEffects with no `.extend()`, so
// the input variant is rebuilt from its `.innerType()`. That is also why the unconfirmable-needs-a-
// question rule is restated here rather than inherited — each copy is pinned by its own contract
// test, and dropping it here would demote a form-level rejection to an opaque whole-quest re-parse
// failure at save time.
const signoffForUpsertContract = signoffContract
  .innerType()
  .extend({ at: serverStampedTimestamp })
  .superRefine((value, ctx) => {
    if (value.verdict === 'unconfirmable' && value.question === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['question'],
        message:
          'question is required when verdict is unconfirmable — say what was tried and why it could not be confirmed',
      });
    }
  });

const questBlightLedgerEntryForUpsertContract = questBlightLedgerEntryContract.extend({
  createdAt: serverStampedTimestamp,
});

const questNoteForUpsertContract = questNoteContract.extend({ at: serverStampedTimestamp });

const operationPlanForUpsertContract = operationPlanContract.extend({ at: serverStampedTimestamp });

const fullFlowObservable = flowObservableContract.extend({
  package: packageNameContract
    .optional()
    .describe(
      'The package this observable is read in. Omit it when the owning node tags exactly one package — the save resolves it from the node. On a node tagging more than one there is nothing to inherit and the omission is refused, so state which side of the seam this one sits on.',
    ),
  flowriderSignoff: signoffForUpsertContract.nullish(),
  siegemasterSignoff: signoffForUpsertContract.nullish(),
  _delete: z.boolean().optional(),
});
const deletableObservableContract = z.union([
  fullFlowObservable,
  fullFlowObservable.partial().required({ id: true }),
  z.object({ id: observableIdContract, _delete: deleteMarker }),
]);

// `packages` arrives on this shape from flowNodeContract itself, so a tag written on a node
// SURVIVES parsing instead of being stripped. It does not make the tag mandatory: an untagged node
// simply falls out of this branch into the `.partial()` one below, which is shape-identical to a
// legitimate patch. The coverage rule is enforced on the save side, where the merged node is parsed
// through flowNodeContract, and by the save-invariants tier that names the offending node.
const fullFlowNode = flowNodeContract.extend({
  observables: z.array(deletableObservableContract).optional(),
  flowriderSignoff: signoffForUpsertContract.nullish(),
  siegemasterSignoff: signoffForUpsertContract.nullish(),
  _delete: z.boolean().optional(),
});
const deletableNodeContract = z.union([
  fullFlowNode,
  fullFlowNode.partial().required({ id: true }),
  z.object({ id: flowNodeIdContract, _delete: deleteMarker }),
]);

const fullFlowEdge = flowEdgeContract.extend({
  flowriderSignoff: signoffForUpsertContract.nullish(),
  siegemasterSignoff: signoffForUpsertContract.nullish(),
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
        flowriderSignoff: signoffForUpsertContract.nullish(),
        siegemasterSignoff: signoffForUpsertContract.nullish(),
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
        "NOT WRITABLE BY ANY AGENT, at any quest status — `operations` is absent from every entry in questStatusInputAllowlistStatics, so a call carrying it is refused before any mutation runs. The implementation ledger is DERIVED at Start from the flow nodes' `packages` tags and the contracts' `source` paths, and mutated at runtime only by questOperationsUpdateBroker, which bypasses this input path entirely. Shape the ledger by tagging nodes and sourcing contracts accurately; execution agents signal outcomes rather than writing it",
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
      .array(questPackageEntryContract)
      .describe(
        'One entry per package the quest will touch. Replaces the whole list on write (not an id-keyed upsert), so send every package each time. This is the closed set the `packages` tag on each flow node must draw from — tag a node with a name absent here and the write is refused, so add the entry in the SAME modify-quest call as the tag.',
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
          .array(questBlightLedgerEntryForUpsertContract)
          .describe(
            'Blight checklist dispositions to merge into quest.planningNotes.blightLedger, keyed on itemId (changed file crossed with concern) — re-dispositioning a unit REPLACES its prior entry rather than appending a second one, so a continuation session can correct a predecessor. This is the only write path for the ledger the completion gate enforces.',
          )
          .optional(),
        questNotes: z
          .array(questNoteForUpsertContract)
          .describe(
            'Durable side-channel notes appended to quest.planningNotes.questNotes, keyed on id — re-stating a note UPSERTS its prior entry rather than appending a duplicate, so a continuation session can sharpen a note it already left. These NEVER close a verification unit: they carry open questions, tooling failures, out-of-scope observations, and walk resets. A flow unit is closed by its own `flowriderSignoff` / `siegemasterSignoff`, and a standards-review unit by its blightLedger disposition.',
          )
          .optional(),
        operationPlans: z
          .array(operationPlanForUpsertContract)
          .describe(
            "Planner sub-agent plans to merge into quest.planningNotes.operationPlans, keyed on the plan's own id — a plan re-stated under the same id REPLACES its prior entry, while a re-planned round carries a fresh id and its own `round`, so a rejected round's plan stays for audit alongside the round that superseded it. This is the write path the operation orchestrator reads back with get-quest-planning-notes instead of holding the plan body in its own context.",
          )
          .optional(),
      })
      .partial()
      .describe(
        'Blight reports, the per-unit standards-review ledger a reviewer-minion writes, the Siegemaster QA ledger dispositions, the durable side-channel quest notes, and the planner sub-agent plans to merge into quest.planningNotes',
      )
      .optional(),
  })
  .strict()
  .brand<'ModifyQuestInput'>();

export type ModifyQuestInput = z.infer<typeof modifyQuestInputContract>;
