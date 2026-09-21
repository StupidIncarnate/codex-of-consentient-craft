/**
 * PURPOSE: Generic persisted work item in quest.json. No role-specific data.
 *
 * USAGE:
 * workItemContract.parse({id: 'f47ac10b-...', role: 'codeweaver', status: 'pending', ...});
 * // Returns: WorkItem object
 */

import { z } from 'zod';

import { agentIdContract } from '../agent-id/agent-id-contract';
import { fileNameContract } from '../file-name/file-name-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { pieceIdContract } from '../piece-id/piece-id-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { relatedDataItemContract } from '../related-data-item/related-data-item-contract';
import { sessionIdContract } from '../session-id/session-id-contract';
import { spawnerTypeContract } from '../spawner-type/spawner-type-contract';
import { stepNameContract } from '../step-name/step-name-contract';
import { streamSignalKindContract } from '../stream-signal-kind/stream-signal-kind-contract';
import { unitIdContract } from '../unit-id/unit-id-contract';
import { unitObservationContract } from '../unit-observation/unit-observation-contract';
import { wardModeContract } from '../ward-mode/ward-mode-contract';
import { workItemRoleContract } from '../work-item-role/work-item-role-contract';
import { workItemStatusContract } from '../work-item-status/work-item-status-contract';

export const workItemContract = z.object({
  id: questWorkItemIdContract,
  role: workItemRoleContract,
  status: workItemStatusContract,
  spawnerType: spawnerTypeContract,
  sessionId: sessionIdContract.optional(),
  // Set when the work item is a Task-dispatched sub-agent under /dumpster-launch — value is
  // Claude CLI's realAgentId (the filename in `<sessionId>/subagents/agent-<agentId>.jsonl`).
  // Combined with `sessionId` (parent /dumpster-launch session) it locates the exact JSONL
  // file the replay should read. Absent for chat roles (chaoswhisperer, glyphsmith) whose
  // `sessionId` already points at a top-level `<sessionId>.jsonl`.
  agentId: agentIdContract.optional(),
  // INVARIANT (behavioral, enforced by every seeding path — quest-create, the relay graph
  // builder, and questAdvanceBroker): every work item carries exactly ONE `operations/<id>`
  // ref, linking it to the operation item on the ledger whose SCOPE it works. That link is
  // never re-pointed at a second operation item and a work item's status is never reverted.
  // One operation item carries MANY work items over its life — one per step the router mints
  // on that scope, and one per piece inside a parallel step — so the ref is many-to-one and
  // `step` is what separates them. Ward items may additionally carry a `wardResults/<id>` ref.
  relatedDataItems: z.array(relatedDataItemContract).default([]),
  dependsOn: z.array(questWorkItemIdContract).default([]),
  attempt: z.number().int().nonnegative().brand<'Attempt'>().default(0),
  maxAttempts: z.number().int().positive().brand<'MaxAttempts'>().default(1),
  retryCount: z.number().int().nonnegative().brand<'FailCount'>().default(0),
  lastWardRunId: fileNameContract.optional(),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  // `.nullish()`, not `.optional()` — a quest.json written before this field existed, or a
  // producer that stamps `null` instead of omitting the key, sends an explicit `null` here.
  // `.optional()` accepts an omitted key but rejects `null` outright, and this field sits inside
  // `questContract`'s `workItems` array, so that rejection fails the WHOLE quest.json parse, not
  // just this one row.
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().nullish(),
  startRef: z
    .string()
    .min(1)
    .brand<'GitBaseRef'>()
    .optional()
    .describe(
      "The quest worktree's HEAD sha at the moment this work item was FIRST served its prompt. `<startRef>..HEAD` is the range `get-blight-checklist`'s `since-ref` scope rebuilds its checklist over, and it is the only range that measures what THIS item produced: every minion commits its own work as it goes, so at signal time the tree is clean (a working-tree reading is empty by construction), HEAD~1 sees one piece, and a plan-scoped reading sees one round. Written ONCE and never rewritten — a resumed or re-served session keeps its ORIGINAL start, because re-stamping after a crash would shrink the reviewed range to whatever landed afterwards. Deliberately `.optional()` with NO default, so a work item that never resolved a worktree, a hydrated quest, and every item seeded before this field simply carry none, and that scope reports null for them rather than measuring something they could never satisfy.",
    ),
  // Same reasoning as `startedAt` above — `.nullish()` so an explicit `null` doesn't fail the
  // whole quest.json parse.
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().nullish(),
  errorMessage: z.string().brand<'ErrorMessage'>().optional(),
  summary: z.string().brand<'SignalSummary'>().optional(),
  insertedBy: questWorkItemIdContract.optional(),
  resume: z
    .boolean()
    .optional()
    .describe(
      'Set by orphan recovery when it flips a crashed in_progress item back to pending while KEEPING sessionId: dispatch must resume that Claude session (claude --resume) instead of fresh-spawning, so work in the orphaned session is preserved',
    ),
  wardMode: wardModeContract.optional(),
  packageNames: z
    .array(packageNameContract)
    .optional()
    .describe(
      'Copied from the linked operation item when advance creates this item, so the dispatched session is handed its package slice with the rest of its identity rather than having to resolve the operations ref to find it. Optional and omitted when empty, exactly as `wardMode` is: work items are the most numerous array on a quest, and a `.default([])` would materialise an empty array onto every one of them on every re-parse. The operation item is the authority — this is a copy taken at dispatch.',
    ),
  smoketestPromptOverride: z.string().min(1).brand<'PromptText'>().optional(),
  smoketestExpectedSignal: streamSignalKindContract.optional(),
  actualSignal: streamSignalKindContract.optional(),
  step: stepNameContract.optional(),
  // One entry per unit this work item was ASSIGNED — not a shared log sessions append to. Each
  // session gets a fresh, complete set that freezes when the step signals; a re-mint writes its
  // own set of the same units from scratch rather than amending its predecessor's.
  observations: z.array(unitObservationContract).default([]),
  pieceId: pieceIdContract.optional(),
  // What this work item was ASSIGNED, as distinct from what it MARKED (`observations`). The
  // router (story 15) WRITES this on every work item it mints; story 14's signal gate READS it
  // and refuses to let a session signal while any id here has no matching
  // `observations[].unitId`. Cannot be derived from the piece's own `assignedUnitIds` (that is
  // INTENT, re-filtered at dispatch) or from `payload.units[]` (not every family's payload has
  // one) — see story 02's own text for the full reasoning.
  assignedUnitIds: z.array(unitIdContract).default([]),
  // The return edge: which work item's `unmet` marks or `request` caused this one to exist.
  // Deliberately NOT `insertedBy` — that field already means "supersedes a failed item" for the
  // `pt N` continuation chain, and `work-items-to-quest-status-transformer` reads it to derive
  // quest completion; reusing it here would make an ordinary mark-minted rework loop read as a
  // resolved failure.
  mintedBy: questWorkItemIdContract.optional(),
  // The typed, per-family half of a brief — deliberately `z.record(z.unknown())`: the
  // per-family shapes live on the plan-file contract (story 07), and duplicating them here would
  // make `shared` depend on a shape only the orchestrator cares about. The router copies the
  // originating piece's payload onto what it mints, so a later plan amendment cannot rewrite
  // what a session already ran against.
  payload: z.record(z.unknown()).optional(),
  // Set by `quest-work`'s `outcome` payload — legal ONLY on a work item holding no assigned units,
  // where there is nothing for the record to derive an outcome FROM. `nextActionTransformer` takes
  // this as its `declaredWord`/`hitWall` arguments rather than deriving them, because it is pure and
  // synchronous and cannot read a live call — "the work tool writes them and this reads them, and a
  // pure function cannot go and look" (`next-action-transformer.ts`'s own header). Inlined as a
  // literal tuple rather than importing `@dungeonmaster/orchestrator`'s `stepOutcomeContract`:
  // `shared` is the base package and may not depend on anything above it, the same reason every
  // package keeps its own local `isoTimestampContract` instead of importing one.
  declaredWord: z.enum(['done', 'unmet', 'empty', 'wall']).optional(),
  declaredReason: z.string().min(1).brand<'OutcomeReason'>().optional(),
  // Set by `quest-work`'s `request` payload — the step this work item is blocked on, and why.
  // `nextActionTransformer` takes this as its `request` argument for the identical reason
  // `declaredWord` is an argument rather than a derivation: it is pure and cannot read a live call.
  requestedStep: stepNameContract.optional(),
  requestedReason: z.string().min(1).brand<'RequestReason'>().optional(),
  // Copied off the minting step's config (`agentFlowStatics.<family>.steps.<step>.needsLane`) by
  // `questRouteScopeBroker` at mint time. `true` means the ROUTER starts a siegelense instance
  // before this item dispatches and kills it when the item records — the session never owns that
  // lifecycle. `.optional()` rather than `.default(false)`, matching `wardMode`/`packageNames`:
  // work items are the most numerous array on a quest, and a step that never needs a lane (nearly
  // every one) must not materialise `needsLane: false` onto every row on every re-parse. Read as
  // `workItem.needsLane === true`, never as a falsy check.
  needsLane: z.boolean().optional(),
});

export type WorkItem = z.infer<typeof workItemContract>;
