# 07 — the plan file

```
GOAL      A planner's forecast has a shape: batches of pieces, each piece naming its step,
          its units and its brief.
AFTER     01 (units) · 02 (a work item links back by pieceId)
BEFORE    08 (which validates it) · 09 · 15 · 17
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus — three families' payloads and one envelope
```

---

## "Work item" was doing two jobs

| | **PIECE** | **WORK ITEM** |
|---|---|---|
| Lives in | `<questFolder>/planned-work/<operationItemId>.json` | `quest.json` → `quest.workItems[]` |
| Is | the planner's FORECAST — what it intends | the RECORD — a session that ran |
| Written by | one planner, once, then amended | the orchestrator, as the router decides |
| Count | all of them, up front | only what has been reached |

**They are deliberately not 1:1.** A piece whose units come back `unmet` produces a second work item. A
piece the run never reaches produces none. The gap between the two files is the useful thing to look at
when a quest goes wrong.

**A piece has no size ceiling; a prompt does.** That is the real reason the plan is a file rather than
prompt text, and it belongs in the contract's own header so nobody later "simplifies" it back into the
prompt. `mcpToolResultStatics.maxVerbatimChars` is 50,000 and today's prompts already run 43,000–48,000.

**This is a new file, not a new field on an existing "plan" mechanism — and the vocabulary collides.**
`packages/shared/src/contracts/operation-plan/` already exists: `quest.planningNotes.operationPlans[]`
is a live, written-today array (`modify-quest-input-contract.ts:312-316` is its write path,
`get-quest-planning-notes` its read) holding a planning SUB-AGENT's spike report —
`operationPlanContract` → `operationPlanPieceContract`
(`packages/shared/src/contracts/operation-plan-piece/operation-plan-piece-contract.ts`), whose fields
are `id` (a UUID, `operationPlanPieceIdContract`), `title`, `intent`, `files`, `folderTypes`, `unitIds`,
`dependsOn`, `mirror`, `notes`, `status: 'pending' | 'done' | 'rejected'`. **That is a different shape
for a different job, and it keeps working exactly as it does today — nothing in this chain touches
it.** Do not import `operationPlanPieceContract`, do not name a new folder `operation-plan*`, and do
not reuse `OperationPlanStub` — every one of those names is already taken by the other mechanism. The
new work-plan's piece id is `pieceIdContract` (story 02, `packages/shared/src/contracts/piece-id/`,
NOT a UUID — see below).

---

## BUILD

New contract folder in `packages/orchestrator/src/contracts/work-plan/`, holding
`work-plan-contract.ts`, `work-plan.stub.ts` and `work-plan-contract.test.ts` — the same three-file
shape every contract folder in this repo holds. `packages/shared/src/contracts/work-item-status/` is
the reference: `work-item-status-contract.ts` declares the schema, `work-item-status.stub.ts` builds a
default instance BY PARSING it (never a literal object cast), `work-item-status-contract.test.ts`
exercises it:

```ts
// work-item-status.stub.ts, the pattern every stub in this story follows
import { workItemStatusContract } from './work-item-status-contract';
import type { WorkItemStatus } from './work-item-status-contract';

export const WorkItemStatusStub = ({ value }: { value?: WorkItemStatus } = {}): WorkItemStatus =>
  workItemStatusContract.parse(value ?? 'pending');
```

**Two exported consts, not one, because a refinement strips `.omit()`.** `z.object({…}).superRefine(…)`
returns a `ZodEffects` in zod 3 (this repo is on `3.25.76`), and a `ZodEffects` has no `.omit`, `.pick`,
`.extend` or `.shape` — the only `.shape` read anywhere in this tree today is on an UNREFINED contract
(`questNoteContract.shape.detail`,
`packages/orchestrator/src/responders/quest/reset-flow-signoffs/quest-reset-flow-signoffs-responder.ts:47`).
Story 17's `quest-work` tool `.omit()`s `writtenBy`/`writtenAt` off this contract to build its `plan`
payload, so **this file exports the bare object as `workPlanFieldsContract` beside the refined
`workPlanContract`**:

```ts
export const workPlanFieldsContract = z.object({ /* every field below */ });
export const workPlanContract = workPlanFieldsContract.superRefine((plan, ctx) => { /* both
  refinements below — the plannerMarks rule and the per-family payload check — live in this one call */ });
```

**This is the whole shape, not an excerpt — it IS the contract.** Unit ids below use the shape
`qaUnitEnumerateTransformer` actually mints, `<flowId>:<kind>:<localId>` with `off-map` hyphenated
(`packages/orchestrator/src/transformers/qa-unit-enumerate/qa-unit-enumerate-transformer.ts:54,67,81,97`)
— **not** the bare `obs-3` / `offmap:hostile-input` forms the design document's illustrative JSON uses
throughout §4 and §9. Every fixture in stories 07–09, 17 and 18 has to agree on this exact string,
because the in-scope check, the signal gate and this story's own 1:1 check are all string equality
against it.

```ts
export const workPlanFieldsContract = z.object({
  operationItemId: operationItemIdContract,                     // @dungeonmaster/shared/contracts
  family: z.enum(['codeweaver', 'flowrider', 'siegemaster']),   // see below — not story 04/05's family key
  flowId: flowIdContract.nullable(),                             // singular; null for a contracts-only cell
  packageNames: z.array(packageNameContract).default([]),
  writtenBy: questWorkItemIdContract,                            // server-stamped — story 17 omits it from the caller's payload
  writtenAt: z.string().datetime().brand<'IsoTimestamp'>(),      // server-stamped, same reason
  batches: z.array(workPlanBatchContract).default([]),
  plannerMarks: z.array(unitObservationFieldsContract).default([]),   // `cant-meet` only — refinement below
});

export const workPlanContract = workPlanFieldsContract.superRefine(/* see "plannerMarks" and
  "The three per-family payloads" below */);
```

`family` is a closed three-member enum, distinct from story 04/05's broader family key: it names WHICH
step graph a piece's `step` must resolve against (story 08's check), and only the three operator roles
ever write a plan — `riftcarver`, `wardFull` and `warpgate` hold no `plan` step, and the chat roles hold
no step graph at all. Reuse `agentPromptClassificationStatics.operatorRoleNames`
(`packages/orchestrator/src/statics/agent-prompt-classification/agent-prompt-classification-statics.ts:80`
— `['codeweaver', 'flowrider', 'siegemaster']`) as the source the enum's colocated test pins against,
rather than re-typing the three names a second time with nothing tying them together.

`flowId` is **nullable, not optional, and singular** — every fan-out mints one item per flow
(codeweaver per `(package, flow)` cell, flowrider and siegemaster per flow), so an item never needs more
than one. `null` is a real case, not a degenerate one: the codeweaver cell for a package that owns a
contract by `source` and tags no node anywhere — `shared`, routinely. Story 18's
`questWorkScopeContract.flowId` makes the identical field nullable for the identical reason
(`scrolls/orcha-changes/18-get-quest-work-tool.md:152,159-163`) — match it rather than diverging.

### `work-plan-batch/work-plan-batch-contract.ts`

```ts
export const workPlanBatchContract = z.object({
  mode: z.enum(['sequential', 'parallel']),
  pieces: z.array(workPlanPieceContract).min(1),
});
```

### `work-plan-piece/work-plan-piece-contract.ts`

```ts
export const workPlanPieceContract = z.object({
  id: pieceIdContract,                                    // story 02 owns the shape. e.g. 'pc-scan'
                                                            // NOT operationPlanPieceIdContract (a UUID, the unrelated mechanism above)
  step: stepNameContract,                                  // story 02/03 — checked against the step graph in story 08, not here
  assignedUnitIds: z.array(unitIdContract).default([]),    // may be EMPTY — a contracts-only piece proves nothing itself
  contextUnitIds: z.array(unitIdContract).default([]),
  recipeId: recipeIdContract.optional(),
  baselineFor: pieceIdContract.optional(),                 // adversarial pieces only — see below
  context: z.string().min(1).brand<'PieceContext'>(),
  notes: z.array(z.string().min(1).brand<'PieceNote'>()).default([]),
  payload: z.unknown(),        // per-family shape — checked in workPlanContract's own refinement, below
});
```

`payload` is typed `z.unknown()` on the PIECE itself, deliberately — the same reason `workItem.payload`
is `z.record(z.unknown())` in story 02: the piece alone does not know its own family, only the
envelope's `family` field does, so there is nothing for zod's native `z.discriminatedUnion` to key on at
this level. The real per-family check happens once, in `workPlanFieldsContract`'s own refinement, which
has both `family` and every piece in scope at once — see "The three per-family payloads" below.

### `recipe-id/recipe-id-contract.ts` — new

```ts
export const recipeIdContract = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u)
  .brand<'RecipeId'>();
```

**Story 02 owns `pieceIdContract`'s shape and this story does not restate it.** It is a branded string there, not a regex — a planner writes these by hand (`pc-1`, `pc-walk-1`), so do not assume a pattern story 02 does not declare
(`packages/hydration-recipes/src/contracts/recipe-name/recipe-name-contract.ts`) — the orchestrator
cannot import that contract directly (`packages/orchestrator/package.json` lists exactly
`@dungeonmaster/config`, `@dungeonmaster/shared`, `zod`), so this is a deliberate parallel declaration
of the same shape, not a second source of truth for what a real recipe book entry looks like. Story 18
names this contract as coming from here: *"`recipeIdContract` comes from story 07's plan contract"*
(`scrolls/orcha-changes/18-get-quest-work-tool.md:144`).

### The two unit arrays are two different jobs

`assignedUnitIds` is what this session must MARK. `contextUnitIds` is what it must READ and build
against and may NOT mark — which is how a seam's far half stays visible to the cell that does not own
it. **The in-scope check binds `assignedUnitIds` only**: a context unit is by definition a unit from
somewhere else, and checking it against this scope would reject exactly the case it exists for.

### `assignedUnitIds` is INTENT, and the router decides what is actually assigned

The plan is a forecast, so the router re-filters against the record at dispatch and hands the session
only what is still unsettled. **The router's decision lands on the WORK ITEM's own `assignedUnitIds`
field — story 02 adds this as a SECOND field, separate from the piece's, alongside `mintedBy`** — not
something recovered by re-reading the piece at gate or serve time. `workItem.pieceId` still names the
forecast a session came from; `workItem.assignedUnitIds` is the number a signal gate or a served view
actually counts. Story 18's `questWorkViewContract.assignedUnits` is built from exactly this field, not
from the piece: *"`assignedUnits` is built from `workItem.assignedUnitIds`, NOT from the piece … Serving
the piece's list instead hands a session units its predecessor already settled"*
(`scrolls/orcha-changes/18-get-quest-work-tool.md:207-212`). Living in a directory called `planned-work`
is what marks the PIECE's own copy as intent — the field name does not need to.

### `plannerMarks` is the planner's ONE mark authority

A planner gets no units. The single exception: a siege planner with fewer rounds than off-map families
must record the families it is not covering, or `hostile-input` and `perf` — the quest's only security
and performance coverage anywhere — are silently dropped.

**It may write `cant-meet`, only `cant-meet`, and only for a unit it is simultaneously putting on no
piece.** That does not break "never mark a unit you did not settle": the planner genuinely settled the
question *no session this pass will reach this*, which is exactly what a `cant-meet` plus a `toSettle`
records. `toSettle` itself is already required on `cant-meet` by `unitObservationFieldsContract`'s OWN
refinement (story 01); the refinement below does not repeat that — it narrows WHICH mark a planner may
use and rules out double-booking one unit onto both a piece and a mark:

```ts
.superRefine((plan, ctx) => {
  const claimedUnitIds = new Set(
    plan.batches.flatMap((batch) => batch.pieces.flatMap((piece) => piece.assignedUnitIds)),
  );
  plan.plannerMarks.forEach((mark, index) => {
    if (mark.mark !== 'cant-meet') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['plannerMarks', index, 'mark'],
        message:
          `plannerMarks[${index}]: a planner may only write 'cant-meet', never '${mark.mark}'. A ` +
          `planner gets no units — it may record that no piece will reach unit ` +
          `'${String(mark.unitId)}' this pass, never that one was met.`,
      });
    }
    if (claimedUnitIds.has(mark.unitId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['plannerMarks', index, 'unitId'],
        message:
          `plannerMarks[${index}]: unit '${String(mark.unitId)}' is claimed by a piece in this ` +
          `same plan, so it cannot also carry a planner mark — a unit is either assigned to a ` +
          `session or recorded as uncovered, never both.`,
      });
    }
  });
  // the per-family payload check lives in the same call — see below
})
```

**`offMapFamily` reuses the existing enum; it does not invent one.** `qaOffMapFamilyContract`
(`packages/shared/src/contracts/qa-off-map-family/qa-off-map-family-contract.ts:16-24`) already
declares the exact seven — `re-entry`, `concurrency`, `interruption`, `staleness`, `configuration`,
`hostile-input`, `perf` — and `qaChecklistItemContract.offMapFamily` and `flowOffMapSignoffContract.id`
both already use it. **Story 01's own `offMapFamilyContract` is a second declaration of the same seven
values — that is a duplicate, and it is story 01's to fix; flag it there, not here.** Every
`offMapFamily` field in this story's payloads is typed `qaOffMapFamilyContract.nullable()`, imported
from `@dungeonmaster/shared/contracts`. A `plannerMarks[].unitId` naming an off-map unit is spelled the
real shape too — `${flowId}:off-map:${family}` — never the bare `offmap:${family}` this story's own
examples used to show.

### The three per-family payloads

**Every payload is checked against the piece's own `family` inside `workPlanFieldsContract`'s
refinement — not by `z.discriminatedUnion`, because the discriminator (`family`) lives on the
envelope and the thing being discriminated (`payload`) lives three levels down, on each piece:**

```ts
.superRefine((plan, ctx) => {
  const payloadContract = {
    codeweaver: workPlanPayloadCodeweaverContract,
    flowrider: workPlanPayloadFlowriderContract,
    siegemaster: workPlanPayloadSiegemasterContract,
  }[plan.family];

  plan.batches.forEach((batch, batchIndex) => {
    batch.pieces.forEach((piece, pieceIndex) => {
      const path = ['batches', batchIndex, 'pieces', pieceIndex, 'payload'] as const;
      const parsed = payloadContract.safeParse(piece.payload);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [...path],
          message:
            `piece '${String(piece.id)}': payload does not match the ${plan.family} shape — ` +
            parsed.error.issues.map((issue) => issue.message).join('; '),
        });
        return;   // shape is already wrong — the 1:1 check below would only add noise
      }

      // THE 1:1 CHECK — codeweaver and flowrider only. `'units' in parsed.data` is how the
      // family-conditional binds: siegemaster's payload contract declares no `units` key at all,
      // so this branch never runs for it.
      if ('units' in parsed.data) {
        const unitsUnitIds = new Set(parsed.data.units.map((unit) => unit.unitId));
        const assignedUnitIds = new Set(piece.assignedUnitIds);
        const missingFromUnits = [...assignedUnitIds].filter((id) => !unitsUnitIds.has(id));
        const extraInUnits = [...unitsUnitIds].filter((id) => !assignedUnitIds.has(id));
        if (missingFromUnits.length > 0 || extraInUnits.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, 'units'],
            message:
              `piece '${String(piece.id)}': payload.units[] holds ${parsed.data.units.length} ` +
              `entries for ${piece.assignedUnitIds.length} assignedUnitIds` +
              (missingFromUnits.length > 0
                ? ` — '${String(missingFromUnits[0])}' has none`
                : ` — '${String(extraInUnits[0])}' is in units[] but not assigned`),
          });
        }
      }
    });
  });
  // the plannerMarks refinement above lives in this same call
})
```

**Codeweaver — `work-plan-payload-codeweaver/work-plan-payload-codeweaver-contract.ts`. The unit is a
FILE GROUP.**

```ts
export const workPlanFileEntryContract = z.object({
  path: filePathContract,
  change: z.enum(['new', 'edit']),
  in: z.string().min(1).brand<'PieceTypeSketch'>(),   // free-form type sketch, e.g. '{ path: string; ordinal: number }'
  out: z.string().min(1).brand<'PieceTypeSketch'>(),
  proves: z.array(unitIdContract).optional(),         // present on a test file only — which units it proves
});

export const workPlanCodeweaverUnitContract = z.object({
  unitId: unitIdContract,
  kind: z.enum(['observable', 'terminal', 'branch']),   // never 'off-map' — codeweaver never carries one
  observableType: outcomeTypeContract.optional(),        // present on kind: 'observable' only
  verifyByReading: z.boolean().optional(),
  text: z.string().min(1).brand<'PieceUnitText'>(),      // verbatim from the spec, never a paraphrase
  assert: z.string().min(1).brand<'PieceUnitAssert'>(),
  failsIf: z.string().min(1).brand<'PieceUnitFailsIf'>(),
});

export const workPlanPayloadCodeweaverContract = z.object({
  files: z.array(workPlanFileEntryContract).default([]),
  facts: z.array(z.string().min(1).brand<'PieceFact'>()).default([]),
  fences: z.array(z.string().min(1).brand<'PieceFence'>()).default([]),
  traps: z.array(z.string().min(1).brand<'PieceTrap'>()).default([]),
  doNotTouch: z.array(z.string().min(1).brand<'PieceDoNotTouch'>()).default([]),
  units: z.array(workPlanCodeweaverUnitContract).default([]),   // MAY be empty — a contracts piece proves nothing itself
});
```

**Flowrider — `work-plan-payload-flowrider/work-plan-payload-flowrider-contract.ts`. The unit is a TEST
FILE, the decisions are per UNIT.**

```ts
export const workPlanFlowriderUnitContract = z.object({
  unitId: unitIdContract,
  kind: qaChecklistKindContract,                       // terminal | branch | observable | off-map
  layer: z.enum(['browser', 'below-browser']),
  surface: qaChecklistItemContract.shape.checkSurface.optional(),   // see the note below — never planner-written
  observableTarget: z.object({
    target: z.enum(['observable', 'node', 'edge']),
    nodeId: flowNodeIdContract.optional(),
    edgeId: flowEdgeIdContract.optional(),
  }),
  assert: z.string().min(1).brand<'PieceUnitAssert'>(),
  failsIf: z.string().min(1).brand<'PieceUnitFailsIf'>(),
});

export const workPlanPayloadFlowriderContract = z.object({
  specPath: filePathContract,
  mode: z.enum(['new', 'extend']),
  harnesses: z.array(workPlanFileEntryContract.omit({ proves: true })).default([]),
  walk: z.object({
    shape: z.enum(['journey', 'matrix']),
    paths: z.array(qaWalkPathContract).default([]),    // REUSE — see below, do not re-declare
    pathsTruncated: z.boolean().default(false),
  }),
  units: z.array(workPlanFlowriderUnitContract).min(1),   // never empty for this family — see below
  facts: z.array(z.string().min(1).brand<'PieceFact'>()).default([]),
  fences: z.array(z.string().min(1).brand<'PieceFence'>()).default([]),
  traps: z.array(z.string().min(1).brand<'PieceTrap'>()).default([]),
  doNotTouch: z.array(z.string().min(1).brand<'PieceDoNotTouch'>()).default([]),
});
```

**`walk.paths[]` reuses `qaWalkPathContract` verbatim**
(`packages/shared/src/contracts/qa-walk-path/qa-walk-path-contract.ts:26-45`) — do not re-declare a
`{ nodeIds, forceLabels }` shape. **The field is `branchLabels`, not `forceLabels`** — the design
document's illustrative JSON uses the wrong name throughout §4 and its worked siege example.
`qaWalkPathContract` also carries `exitsFlow: boolean` (default `false`), which every worked example in
the design document omits; a walk that crosses into another flow needs it set true, so it is not
cosmetic.

**`surface` is filled by the orchestrator, never typed by a planner — and it is never PERSISTED with a
value either.** `workPlanFlowriderUnitContract.surface` is `.optional()` so a planner's submission with
no `surface` key parses; story 08 adds no check for it; story 09 persists whatever was submitted, which
per this shape is always absent. **Story 18's `get-quest-work` is the ONLY place that fills it**, from
`qaChecklistBuildTransformer`'s two sources — `qaCheckSurfaceStatics.byKind` for terminal/branch/off-map,
`byOutcomeType[observableType]` or `.readCheck` for observable
(`scrolls/orcha-changes/18-get-quest-work-tool.md:214-247`) — computed fresh on every read, never written
once at plan time. A planner that DOES submit a `surface` key parses today (the field is merely
optional, not refused); whether that should be a REFUSAL is story 08's open question, not this one's.

**Flowrider's `units[]` may not be empty.** Unlike codeweaver, a flowrider piece's whole job is proving
units, so `.min(1)` catches the degenerate empty case at parse time rather than waiting for story 08's
1:1 cross-reference check to catch a piece that could never have passed it.

**Siegemaster — `work-plan-payload-siegemaster/work-plan-payload-siegemaster-contract.ts`. The unit is
a PATH WALK, and half the plan is policy.**

```ts
export const workPlanPayloadSiegemasterContract = z.object({
  path: qaWalkPathContract,                 // reuse, same shape as flowrider's walk.paths[] entries
  offMapFamily: qaOffMapFamilyContract.nullable(),
});
```

**No lane or instance names.** The router starts each instance and serves its id (story 23).

**Siegemaster's payload carries no `units[]` at all, and the 1:1 check below binds ONLY where a payload
declares one.** A siege piece's unit IS the path walk (or the off-map family) already named by
`assignedUnitIds` and `offMapFamily`; there is nothing separate on the payload to cross-check it
against, unlike codeweaver's and flowrider's `units[]`, which exist precisely because a FILE or a SPEC
can silently drop a unit a test never got written for.

**CORRECTION, found while executing stories 14–16 against this story's own siege payload block: this
story's `DONE WHEN` used to read "`payload.units[]` is 1:1 with `assignedUnitIds`, and a mismatch is
REFUSED" with no family qualifier — which refuses every siege piece ever written, since none carries a
`units[]` key. The check is conditional on family: it binds where the payload declares `units[]`
(codeweaver, flowrider) and does not apply where it does not (siegemaster). Story 08's matching check
carries the same condition — see its own correction note.**

### `baselineFor`, and why it exists

An `adversarial` piece names the `happyWalk` piece — its `id` (`pieceIdContract`) — it measures
against. The router resolves it to that piece's work item and serves its instance id and run id
(story 18's `questWorkBaselineContract`, `scrolls/orcha-changes/18-get-quest-work-tool.md:406-419`).
**An attack is an ABSENCE claim** — I attacked this and it did not fall over — and an absence is only
evidence against a known-good reading taken first. Without this field the antagonist has nothing behind
its claim.

---

## DONE WHEN

| Assert | |
|---|---|
| a full envelope round-trips through `workPlanContract.parse` | one fixture per family — a codeweaver, a flowrider and a siegemaster plan, each using a real `<flowId>:<kind>:<id>` unit id, not the design document's bare form |
| `workPlanFieldsContract.omit({ writtenBy: true, writtenAt: true })` compiles and parses | this is the shape story 17 needs; if it does not compile, `workPlanFieldsContract` was not exported separately from `workPlanContract` |
| a piece with `assignedUnitIds: []` PARSES | a codeweaver contracts piece legitimately carries zero units — contracts are proved by the code that reads them |
| `plannerMarks` rejects a `met`, naming the mark and the unit id, with the message above | the planner's authority is bounded to one mark |
| `plannerMarks` rejects a mark on a unit a piece in the same plan already claims, with the message above | double-booking a unit onto both a session and a mark |
| `plannerMarks` rejects a `cant-meet` with no `toSettle` | inherited from story 01's refinement — assert it reaches here, not just at story 01 |
| a codeweaver or flowrider piece's `payload.units[]` is 1:1 with its `assignedUnitIds`, and a mismatch is REFUSED naming the piece id | a dropped terminal is invisible otherwise. This catches it at write time, before a session exists |
| a siegemaster piece with NO `units[]` key in its payload PARSES | the correction above — the check does not apply to this family, because there is nothing to cross-check |
| a codeweaver piece's `payload.units[]` is an ARRAY keyed by `unitId`, never a map keyed by observable TYPE | terminals and labelled edges carry no type tag, so a type-keyed map loses two whole kinds silently |
| a plan's `payload` for the WRONG family is REFUSED — a codeweaver plan whose piece carries a flowrider-shaped payload | the per-family refinement actually fires, not just the individual payload contracts in isolation |
| `offMapFamily` accepts only the seven `qaOffMapFamilyContract` values, and rejects an eighth by name | a repeated or invented family destroys a round's coverage — assert against the REAL enum, not a second one |
| `WorkPlanStub()` parses with no overrides | the `.stub.ts` pattern round-trips |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| write the cross-referencing checks — "this unit exists on this quest", "this step exists in this family" | story 08. This story is the SHAPE; that one is the graph of references |
| read or write the file | story 09 |
| build the MCP tool that accepts a plan | story 17 |
| touch `operationPlanContract` / `operationPlanPieceContract` or `quest.planningNotes.operationPlans[]` | a live, unrelated mechanism — see the disambiguation note above |
| declare a second off-map family enum | `qaOffMapFamilyContract` already exists; reuse it. Story 01 owns removing its own duplicate |
