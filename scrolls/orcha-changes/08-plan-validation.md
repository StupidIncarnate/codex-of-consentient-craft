# 08 — what a submitted plan must pass

```
GOAL      A plan is a graph of references into quest.json and into the step config. Every
          one of them can be wrong, and a wrong one surfaces as a session dispatched
          against nothing. Catch them all before a byte is persisted.
AFTER     07 (the shape) · 05 (it checks `piece.step` against the step graph)
BEFORE    17 (the write tool calls this)
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**A plan is cheap to reject and expensive to run.** Every piece becomes a dispatched session.

**Unit ids in every fixture below use the REAL shape.** `qaUnitEnumerateTransformer` mints
`<flowId>:<kind>:<localId>`, `off-map` hyphenated
(`packages/orchestrator/src/transformers/qa-unit-enumerate/qa-unit-enumerate-transformer.ts:54,67,81,97`)
— e.g. `flow-send:observable:scan-finds-every-path`, `flow-send:terminal:forward-unchanged`,
`flow-send:off-map:hostile-input`. Not the bare `obs-3` / `offmap:hostile-input` forms the design
document's illustrative JSON uses. Story 07 carries the same correction; every check below that
resolves a unit id does the string comparison against this shape.

**Two of the nineteen are already enforced by story 07's own contract, not by this story's code.**
`workPlanContract` (the input contract story 17 parses a submitted plan through) carries a
`.superRefine()` covering the 1:1 `payload.units[]` check and the `plannerMarks` shape check — see
story 07's "plannerMarks is the planner's ONE mark authority" and "The three per-family payloads". A
plan that fails either is refused at PARSE time, before this story's cross-referencing code ever runs.
This story's job for those two rows is to assert the refusal surfaces through the whole `quest-work`
pipeline (story 17), not to re-implement the check. They stay in the table below because the table is
the full list of what a submitted plan must pass, not a list of where each check lives.

---

## The nineteen checks

| # | Check | What a failure means | Enforced by |
|---|---|---|---|
| 1 | `operationItemId` matches the submitting work item's own `operations/<id>` ref | a planner writing into another scope's plan | this story |
| 2 | every `piece.id` is unique within the file | two work items resolve the same `pieceId` | this story |
| 3 | every `piece.step` exists in THIS family's step graph | a renamed or invented step — dispatch would fail later, with no session to blame | this story, against `agentFlowStatics[plan.family].steps` (story 05) |
| 4 | every `assignedUnitIds` and `contextUnitIds` entry resolves to a real unit on the quest — an observable id, a terminal node id, a labelled edge id, or `<flowId>:off-map:<family>` | the commonest typo, and the one that silently shrinks coverage | this story |
| 5 | every **assigned** unit is **in scope** for this operation item. Context units are exempt | a planner claiming another cell's work, while a seam's far half stays legal | this story — see "The in-scope check" below |
| 6 | no unit is claimed by two pieces in the same batch | two sessions marking the same unit concurrently | this story |
| 7 | every `flowId` referenced resolves in `quest.flows[]` | a stale flow id after a spec edit | this story |
| 8 | every `packageName` resolves in `quest.packagesAffected[]` | a package nobody declared | this story |
| 9 | every `payload.files[].path` sits under a package this scope owns | a piece reaching into a sibling cell's tree | this story |
| 10 | no two pieces in one batch name the same file path | the batch predicate, checkable by intersection | this story |
| 11 | `payload.units[]` is 1:1 with the piece's `assignedUnitIds` — **codeweaver and flowrider only; siegemaster's payload carries no `units[]` at all** | a dropped terminal or edge — invisible otherwise | **story 07's contract refinement** — see the correction above |
| 12 | every `observableTarget` resolves to the node or edge that unit actually hangs on | a mark written onto the wrong element | this story |
| 13 | a `browser`-layer piece count per batch is within the step's `maxConcurrent` | the load cap. **An early warning only** — see below | this story |
| 14 | **every piece in one batch names the SAME `step`** | a batch mixing steps has no single outcome to fold to and no single set of routes to take. This is how the phase order is enforced at write time rather than discovered at dispatch | this story |
| 15 | **every `adversarial` piece names a `baselineFor` resolving to a `happyWalk` piece in an EARLIER batch** | an absence claim with nothing behind it. "Earlier batch" is what catches the interleaved shape a planner would otherwise write | this story |
| 16 | `offMapFamily` is one of the seven `qaOffMapFamilyContract` values, and no family is allocated twice | a repeated family destroys the first round's coverage | this story |
| 17 | every `plannerMarks` entry is `cant-meet` with a `toSettle`, on a unit no piece claims | the planner's one mark authority, bounded | **`cant-meet`-with-`toSettle` and no-double-claim are story 07's contract refinement**; this story only re-checks that the named unit is a REAL unit on the quest (same derivation as check 4) |
| 18 | every `recipeId` a piece names is recorded on that flow AND carries the run id that proved it | a walker handed a seed that does not exist, or one that rotted while nobody was using it | **OPEN — see below. The field this check reads does not exist yet** |
| 19 | a walk piece whose path needs a seeded system names a recipe | the silent version: a walker inventing its own setup, differently each time | **OPEN — same field, and "needs a seeded system" has no test today either. See below** |

**Two of these are worth more than the rest.** The 1:1 `payload.units[]` check catches a dropped
terminal *at write time, before a session exists* — otherwise a unit silently never gets built and
nothing notices until the in-scope gate blocks at the end. And the in-scope check is what stops a
planner quietly widening its own cell.

**The `maxConcurrent` row can only ever be a warning, and the reason is structural:** a mark-minted
piece is by definition not in the plan. Three walkers marking `unmet` mint three fixers outside any
declared batch. The ROUTER enforces the cap (story 15); this check is an early heads-up at plan time.

## The in-scope check (#5) does NOT wait on story 12

The design document and an earlier draft of this story both said "the in-scope check" without saying
which derivation answers it, and story 12 (later in the chain) builds a NEW `{ quest, operationItemId,
step } → UnitId[]` transformer that sounds like the obvious source. **It is not needed here, and
waiting for it would be a real forward dependency this story cannot have.** Read what story 12 actually
adds: a STEP-level narrowing (story 11's `stepScopeStatics`, e.g. excluding a `(read-check)` unit from
flowrider) layered ON TOP OF the family-level scope. Check #5's own wording is family-level — "in scope
for this operation item" — not step-level, and the family-level derivation already exists and needs
none of stories 10–12:

```ts
const scope = operationSignoffScopeTransformer({ quest, operationItem });
// packages/orchestrator/src/transformers/operation-signoff-scope/operation-signoff-scope-transformer.ts
// → { track, flows, packageNames } | null — null only for spiritmender/warpgate, which never plan

const legalUnitIds = new Set(
  scope === null
    ? []
    : scope.flows.flatMap(
        (flow) =>
          qaChecklistBuildTransformer({
            flow,
            packagesAffected: quest.packagesAffected,
            packageNames: scope.packageNames,
            track: scope.track,
          }).items.map((item) => item.id),
        // packages/orchestrator/src/transformers/qa-checklist-build/qa-checklist-build-transformer.ts
        // — item.id is the SAME string qaUnitEnumerateTransformer mints, passed through unchanged
        // (qa-checklist-build-transformer.ts:10-14's own header says so)
      ),
);
```

This is exactly the chain `questGetQaChecklistBroker` already runs
(`packages/orchestrator/src/brokers/quest/get-qa-checklist/quest-get-qa-checklist-broker.ts:85-101`) —
reuse it directly (`questGetQaChecklistBroker({ questId, operationItemId })` and flatten
`checklists[].items[].id`) rather than re-assembling the three transformers by hand, unless story 08
lands before story 17 gives you a `questId` to call it with, in which case call the transformers
directly as above with an in-memory `quest` object. **`scope.track` here is exactly `plan.family`** —
`operationSignoffScopeTransformer` derives `track` from `operationItem.role`, and a plan's own `family`
field is required (check the submitting work item's operation item) to equal that role, so there is
nothing to reconcile between the two names.

**Do not add a `step` parameter to this call or wait on story 11/12.** A `piece.step` is checked
separately (#3) against the step graph; check #5 never needs to know which unit KINDS a given step can
settle, only which units belong to this operation item's flows and packages at all.

## Off-map ids in check 4 — the same shape correction as everywhere else

The table above already reads `<flowId>:off-map:<family>`, corrected from the design's bare
`offmap:<family>`. A context or assigned unit id ending in a family name is checked by first splitting
on `:`, confirming the middle segment is exactly `off-map`, then confirming the trailing segment is one
of `qaOffMapFamilyContract.options` AND that `<flowId>` (the leading segment) is a flow this operation
item's scope actually includes — an off-map id naming a flow outside scope must still fail check 5.

## Checks 18 and 19 read `quest.flows[].recipes[]` — SETTLED, story 02 builds it

Two agents found the same hole independently: the field did not exist. `flowContract`
(`packages/shared/src/contracts/flow/flow-contract.ts:24-34`) carried `id`, `name`, `flowType`,
`scope`, `entryPoint`, `exitPoints`, `nodes`, `edges` and `offMapSignoffs`, and nothing in the chain
added `recipes`. Three stories consumed it — this one validates it, story 18 serves it, story 27
renders it.

**Story 02 now owns it**, because it is the only story in phase A already editing a shared contract and
it is the same kind of change: additive, defaulted, read by nothing when it lands. Each entry carries
the recipe name and **the run id that proved it** — check 19 needs both, and an unproven seed is the
failure the whole recipe discipline exists to prevent.

So checks 18 and 19 are ordinary cross-references by the time this story runs. Read story 02 for the
entry's exact fields before writing them.

## Reject the whole plan, never a piece

A partially-accepted plan is a coverage hole with no owner. The planner gets the validation error,
fixes it, and resubmits inside the same session — the same shape as the signal gate, and for the same
reason.

**The error message has to name the piece id and the check.** A planner has to act on it inside the
same turn, and "invalid plan" gives it nothing to act on. This story returns a LIST of `{ pieceId,
check, message }` failures (one entry per piece per failed check — a piece can fail more than one),
never a single string; story 17 is what formats the list into the message it throws. Its own worked
example fixes the exact shape to build toward:

```
quest-work: plan refused — 2 of 14 pieces failed validation. Nothing was written.

  pc-3   assigned unit `flow-send:observable:shipping-total` is not in scope for operation item op-7
  pc-9   payload.units[] holds 4 entries for 5 assignedUnitIds — `flow-send:terminal:forward-unchanged` has none

Fix both and resubmit the whole plan in this turn.
```

(`scrolls/orcha-changes/17-quest-work-tool.md:259-266`.) So this story's own validator returns, per
failure, at minimum the piece id and one line naming the check and the offending value — close enough
to those two rows that story 17 need not re-derive wording, only join the lines and count them.

**A worked message per check**, so the naming convention is fixed rather than left to whoever
implements it — `<pieceId>: <what is wrong>, naming the value`:

| # | Example message |
|---|---|
| 1 | `operationItemId 2fde15cd-… does not match this work item's own operation item 9e75438c-…` |
| 2 | `piece id 'pc-scan' is used by two pieces in this plan — piece ids must be unique within the file` |
| 4 | `pc-scan: assignedUnitIds names 'flow-send:observable:scan-finds-every-pth', which is not a unit on flow 'flow-send'` |
| 5 | `pc-scan: assigned unit 'flow-send:observable:copy-lands-in-quest-images' is not in scope for operation item 2fde15cd-… (package server, flow flow-send)` |
| 6 | `pc-scan and pc-copy both claim unit 'flow-send:observable:copy-lands-in-quest-images' in the same batch` |
| 9 | `pc-scan: payload.files[].path 'packages/web/src/…' is outside the packages this operation item owns (server)` |
| 14 | `batch 1 mixes steps 'work' and 'review' — every piece in one batch must name the same step` |
| 15 | `pc-stress-happy-path: baselineFor 'pc-walk-happy-path' resolves to a piece in the SAME batch, not an earlier one` |
| 16 | `offMapFamily 'security' is not one of the seven qaOffMapFamilyContract values` |

---

## DONE WHEN

**One failing case per check, seventeen in total (checks 18 and 19 are OPEN — see above), each
asserting the refusal AND that the message names the offending piece.** Then one valid plan per family,
accepted.

Build fixtures with the REAL unit-id shape — `<flowId>:<kind>:<localId>`, `off-map` hyphenated. The
design document's "Three full planner outputs" (`scrolls/orchestrator-step-engine-plan.md`, §4) are cut
from a real quest and are good STARTING shapes for a realistic fixture, but their unit ids are the
design's bare illustrative form (`obs-3`, `offmap:hostile-input`) — rewrite every id through the real
shape before using one as a fixture, or the fixture round-trips against nothing `qaUnitEnumerateTransformer`
would ever produce. Hand-built fixtures are fine too, and smaller.

| The case most likely to be written wrong | |
|---|---|
| the in-scope check | assert that an ASSIGNED unit out of scope is refused **and a CONTEXT unit out of scope is allowed**. A test that only covers the first half will pass against an implementation that rejects both, and that implementation breaks every seam |
| checks 11 and 17's "already enforced by story 07" rows | assert the refusal reaches the CALLER through the whole `quest-work` pipeline (a plan built with a mismatched `units[]` count, submitted through story 17's tool, is refused) — not just that `workPlanContract.parse` throws in isolation, which story 07 already covers |
| a siegemaster piece with no `units[]` key at all | assert it is ACCEPTED — this is the correction to check 11 above, and the case most likely to regress if someone "fixes" the condition back to unconditional |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| write checks 18 and 19 as real cross-references | blocked — see the OPEN note above. Ship the other seventeen and leave these two named as not-yet-checkable, not silently dropped from the list |
| build the MCP tool | story 17 |
| read or write the file | story 09 |
| enforce `maxConcurrent` for real | story 15 |
