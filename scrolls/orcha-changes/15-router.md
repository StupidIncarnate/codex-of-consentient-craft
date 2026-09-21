# 15 — the router

```
GOAL      Given a quest, decide what runs next. This is the engine, and nothing else
          matters if it is wrong.
AFTER     04 · 05 · 07 · 09 · 10 · 12 · 13
BEFORE    16 · 21 · 22
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus
```

**Tested against a STUB dispatcher. It is wired to no live path in this story** — story 22 does that —
so the tree stays green and a mistake here costs a test, not a quest.

---

## The four questions, in this order

The order IS the engine. Get it wrong and the symptoms are subtle: work that should have been re-cut
gets skipped, or a phase advances with pieces still unstarted.

1. **Did this step REQUEST another step?** → mint that step, carrying the request. Its `done` returns
   to the session that asked. This is how `recipe` and `read` run.
2. **Does this step have `unmet` units?** → mint a fresh work item at `routes.unmet`, scoped to exactly
   those. That work item has **no piece** — it is minted from the marks — and carries an inherited
   payload instead.
3. **Are there unstarted plan batches left AT THE CURRENT STEP?** → mint the next one. A batch holds
   pieces for one step only, and every batch at this step is minted before question 4 is reached.
4. **Otherwise** → follow `routes.done`.

**Write a test where all four are true at once.** A request beats an `unmet`; an `unmet` beats an
unstarted batch; an unstarted batch beats `routes.done`. That single test is worth more than the four
separate ones.

---

## `NextAction` — the whole shape, because two later stories consume it

New contract folder `packages/orchestrator/src/contracts/next-action/`, three files as always.

```ts
export const mintedWorkItemContract = z.object({
  step: stepNameContract,                                  // story 02's field, on the item this mints
  role: workItemRoleContract,                              // copied from operationItem.role — never invented
  assignedUnitIds: z.array(unitIdContract).default([]),    // ALREADY FILTERED. See "assignment" below
  pieceId: pieceIdContract.optional(),                     // absent on a mark-, request- or invalidation-mint
  payload: z.record(z.unknown()).optional(),               // the piece's own, or the inherited copy
  mintedBy: questWorkItemIdContract.optional(),            // THE RETURN EDGE. See below
  needsLane: z.boolean().default(false),                   // copied off the step config; story 23 spends it
});

export const nextActionContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('mint'),
    operationItemId: operationItemIdContract,
    step: stepNameContract,        // every item in `batch` sits at THIS step — the fold is per step
    cause: z.enum(['request', 'unmet', 'plan-batch', 'return-to-minter', 'invalidation', 'capped']),
    batch: z.array(mintedWorkItemContract),
  }),
  z.object({
    kind: z.literal('route'),
    operationItemId: operationItemIdContract,
    from: stepNameContract,
    outcome: outcomeContract,      // story 13's four words
    step: stepNameContract,        // the ROUTE TARGET. `batch` sits here
    batch: z.array(mintedWorkItemContract).min(1),
  }),
  z.object({
    kind: z.literal('complete'),
    operationItemId: operationItemIdContract,
    outcome: outcomeContract,      // `done` or `empty` — the word that reached `@done`
  }),
  z.object({
    kind: z.literal('block'),
    operationItemId: operationItemIdContract,
    family: z.string().min(1),
    step: stepNameContract,
    reason: z.enum(['wall', 'max-visits', 'unknown-step', 'unknown-route-target', 'no-minter']),
    message: z.string().min(1),
  }),
]);
```

### Why `mint` and `route` both carry a batch, and are still two variants

**`route` is the only one that means "every piece at `from` has DRAINED."** That is the phase rule,
and it is a fact the ledger cannot cheaply re-derive afterwards — the ledger is a list and the map has
cycles. Story 16's family-graph completion walk and story 27's projection both key on it. `mint` means
the scope is still inside a step it already entered: a loop-back, a request, or the next batch of a
step already running.

### `cause: 'capped'` with an EMPTY batch is the only empty batch

`maxConcurrent` can hold everything back. Then the scope is neither done nor blocked, and the honest
answer is "come back". `{ kind: 'mint', cause: 'capped', batch: [] }` says exactly that, and story 22
maps it to today's `NextStep { type: 'idle' }`. **The router returns an empty batch in no other case** —
everything else is `route`, `complete` or `block`.

### What each consumer reads off it

| Story | Reads |
|---|---|
| 21, the selector | `batch` on `mint` and `route`. That list IS the batch `select-batch-layer-broker` returns, replacing `const [first] = ready` at `select-batch-layer-broker.ts:17` |
| 22, the cutover | `kind` — `mint`/`route` persist `batch` as pending work items and set the operation item `in_progress`; `complete` marks it `complete` and hands the family graph its turn (story 16); `block` calls `questBlockOnFailureBroker` with `message` as the reason |
| 22, again | `mintedWorkItem` → `workItemContract`: `step`, `role`, `assignedUnitIds`, `pieceId`, `payload`, `mintedBy` copy across verbatim. Story 22 fills `id`, `status: 'pending'`, `spawnerType` (`isCommandWorkItemRoleGuard`), `dependsOn`, `createdAt` and the `operations/<id>` ref — the router invents none of those |
| 23, instances | `needsLane`, on each minted item |

### Two more fields on `workItemContract`, and story 02 has four

Say this in your signal; the conductor decides whether 02 is amended or these land here.

| Field | Why nothing derives it |
|---|---|
| `assignedUnitIds` | **story 14 owns this one — read its "Where the assignment lives" section.** The router WRITES it; the gate reads it |
| `mintedBy: questWorkItemIdContract.optional()` | the return edge. The router knows the minter at CREATION time and nothing records it, so at READ time — deciding where a fixer's `done` goes — there is nothing to look up. **Do not reuse `insertedBy`**: `work-items-to-quest-status-transformer.ts:73–77` already reads it as "a retry was spliced for a failed item", and every mark-minted work item would then read as superseding its minter |

---

## Three mechanisms the questions depend on

### The return edge

A work item minted from a mark (question 2) or a request (question 1) **returns to the session that
caused it**, and the router knows which that was because it created it — that is what `mintedBy`
records. So a step that is only ever mark-minted declares **no `done` route at all**, and an undeclared
outcome returns to its minter rather than stalling.

Writing that back-edge into config is what produced the jank: `fixHappy: { done: 'happyWalk' }` reads
like a wired transition when it means "go back where you came from", and the moment two walkers shared
one fixer the wiring was silently wrong.

**A return mints a FRESH work item at the minter's step. It does not resume the minter's own.** Story
22's own assertion says so: *"a WORKER requesting one mid-piece resumes as a fresh work item carrying
the same units, with the recipe names on it."* What that fresh item is assigned is the ordinary role
table applied at the minter's step — a `planner` gets none, a `reviewer` gets the step's in-scope set
(story 12), a `worker` gets its minter's own `assignedUnitIds` minus whatever is now settled.

`mintedBy` absent AND no route declared for the outcome is `block` with `reason: 'no-minter'`. Story
06's reachability check is what stops that ever reaching production; this throw is its backstop.

### The phase rule

**A step's `done` fires only when every piece at that step has DRAINED.** That is question 3 doing its
job: every batch at the current step is minted and recorded before question 4 is consulted.

For siege this is what makes `happyWalk → adversarial` mean something. Every happy piece has recorded
before the first attack is minted, so the router can resolve each adversarial piece's `baselineFor` to
a real work item and serve its instance id and run id.

"Recorded" means a terminal work-item status — `isTerminalWorkItemStatusGuard`. A `pending` or
`in_progress` item at this step means the step has not drained and question 4 is not reached.

### Grouping, when a reviewer's `unmet` spans several pieces

**The key is the ORIGINATING PIECE, never the mark set.** Concretely, and it is four lines:

1. The plan arrives as an argument — the BUILD signature takes `plan`. Story 22's caller reads it with
   story 09's read broker (`{ questFolder, operationItemId } → WorkPlan | null`) BEFORE it enters the
   lock, because that read is async and the router runs inside a synchronous callback. See "Ordering
   and the lock" below.
2. Build `claimedBy: Map<UnitId, PieceId>` by walking `plan.batches` in declaration order, then each
   `batch.pieces` in declaration order, then each piece's `assignedUnitIds` in declaration order, and
   **writing only if the key is absent**. First write wins — that is what "FIRST claimed" means, and
   the plan file's own order is the only ordering anyone can read back off disk.
3. `contextUnitIds` are NOT claims. Story 07: *"The in-scope check binds `assignedUnitIds` only."* A
   seam's far half is on the earlier cell as context and must not pull a re-mint onto it.
4. Partition the `unmet` ids by `claimedBy.get(unitId)`, and mint one work item per group, as one
   batch, in the plan's own piece order.

Two `unmet` units from one piece at two layers → ONE work item. From two pieces → two.
`payload.specPath` happens to make that one-per-spec-file for flowrider, but that is the instance, not
the rule; codeweaver and siege have no such field.

**A unit no piece claimed gets its own group, with no `pieceId` and no `payload`.** That is the
reviewer's whole job — catching a unit nobody took — and there is no originating piece to copy from.
Its brief is the unit text plus the minting observation, both of which `get-quest-work` already serves
(story 18). Do not synthesise a payload for it.

**A mark-minted work item has no piece, so copy the originating piece's payload onto it:**

| Field | Carried? |
|---|---|
| `payload.files`, `facts`, `fences`, `doNotTouch` | **yes** — it is the same work |
| `baselineFor` | **yes** — a re-minted attack measures against the same happy run the first one did |
| `payload.units[]` | **filtered to the units being re-minted, where the family HAS that array.** Codeweaver's and flowrider's payloads do; **siegemaster's does not** — story 07's siege payload is `{ path, offMapFamily }` and nothing else. For siege, copy the payload whole and let `assignedUnitIds` carry the scope |
| an instance id | **never** — the router starts a fresh one per work item (story 23), so a copy is stale by construction |

**A reviewer has no piece of its own**, so when a reviewer's `unmet` mints a worker, copy from the piece
that first claimed each unit — which is what step 2 above already computed. That piece holds the right
files, fences and doNotTouch, which is what a re-minted worker actually needs.

---

## `maxVisits` — SETTLED. It is counted off the ledger, and no field is added

Story 05 declares `maxVisits` on every step and nothing counts visits. It is not `attempt`, it is not
`maxAttempts`, and it is not `retryCount`:

| Existing field | What it actually is |
|---|---|
| `retryCount` | orphan recovery's budget, bumped on a CRASH against `slotManagerStatics.orphanRecovery.maxResets`. A crash-resumed session is the SAME visit, so counting it here would spend a step's budget on an outage |
| `attempt` / `maxAttempts` | per-work-item and written once at mint — `quest-build-relay-graph-broker.ts:163` sets `maxAttempts: 1` on every seeded item and nothing ever reads it back. They count nothing across work items |

**A visit is a work item at that step for that scope:**

```
visits = quest.workItems.filter(
  (item) =>
    item.relatedDataItems.some((ref) => String(ref) === `operations/${operationItemId}`) &&
    item.step === step,
).length
```

Counted over EVERY status — pending, in_progress and terminal alike — because a visit that crashed
still burned a dispatch. The router blocks when `visits + batch.length > maxVisits`, before it mints,
so the budget is never overspent by a parallel batch.

**Off the ledger rather than off a counter, and there is a precedent to copy.**
`operation-pt-chain-transformer.ts:28–33` counts a pt chain by filtering the ledger, for the same
reason: a counter field is a second source of truth, and a crash, a replay or a hand-edited
`quest.json` desyncs it from the record it claims to summarise.

The block message:

```
maxVisits spent: step `work` in family `codeweaver` has been entered 40 times for operation item
<operationItemId>, which is its whole budget — the loop is not converging and another session would
be the 41st to find the same thing. Still unmet: <unit ids, at most 15>.
```

---

## Enforcement the router owns, that nothing else can

**`maxConcurrent` is the router's**, not the plan contract's, and the reason is structural: **a
mark-minted piece is by definition not in the plan.** Three walkers marking `unmet` mint three fixers
outside any declared batch, and their returns mint three concurrent re-walks. Nothing a planner wrote
bounds that. Story 08's check is an early warning at plan time; this is the enforcement.

`maxConcurrent: { limit: 4, counts: 'browser-pieces' }` on flowrider's `work` step. **The `counts` half
matters**: that step also runs below-browser pieces that cost nothing and must not eat the cap.

Counted concretely:

| | |
|---|---|
| a piece is a browser walk iff | any entry in its `payload.units[]` has `layer: 'browser'` (story 07's flowrider payload). An inherited payload keeps `layer`, so a re-mint counts too |
| the denominator | LIVE work items at this step for this scope — status `pending` or `in_progress`, story 12's own definition of live — whose payload is a browser walk, PLUS the browser pieces in the batch about to be minted |
| the rule | mint browser pieces only while `live + minted < limit`. Below-browser pieces in the same batch are minted regardless |
| nothing fits | `{ kind: 'mint', cause: 'capped', batch: [] }`. Do NOT block: the cap clears when a walk records |

Siege lanes are a different budget and are NOT a number in config — story 23.

---

## Also here: `invalidation`

A `flowId` and a reason re-open every unit on that flow. Story 17 builds the payload; this acts on it.

**Concretely:** the invalidated units are the in-scope units on that flow (story 12's in-scope set,
intersected with `flowId`). The router UNIONS them into the `assignedUnitIds` of whatever work item it
mints next for this scope — the route target's, or the minter's on a return edge — and that session
marks them from scratch. They are never assigned back to the session that sent the invalidation; a
fixer cannot measure.

**Nothing is edited and nothing is erased.** No existing work item's `observations[]` is touched and no
mark is cleared. The re-opening is a consequence of story 10's rule alone: once a later work item is
assigned the unit, that item is the most recent one assigned it, so its mark is the state. The durable
record of the invalidation is the `walk-reset` note story 17 writes.

It is the only lever that re-opens off-map families after a fix, and it exists because nobody can
enumerate what a shared-code fix moved.

**One honest consequence, stated so it is not read as a bug:** where the next minted item is a
`reviewer`, it is already assigned the step's whole in-scope set, so the union adds nothing. The lever
bites when the next minted item is a WORKER, which is otherwise scoped to the marks alone.

---

## Ordering and the lock — the router takes NO lock, and must not

`questWithModifyLockBroker` is **deliberately non-reentrant**, and its own header says what happens:
*"WHEN-NOT-TO-USE: Around a call to `questModifyBroker` or `questOperationsUpdateBroker`. Both take
this lock themselves and it is deliberately non-reentrant, so wrapping one deadlocks that questId"*
(`quest-with-modify-lock-broker.ts:15–17`).

The router is pure and synchronous, and story 22 calls it from inside
`questOperationsUpdateBroker`'s `update` callback — which is synchronous, runs under that lock, and is
handed a quest freshly loaded from disk (`quest-operations-update-broker.ts:73–82`). So:

| | |
|---|---|
| the router | takes no lock, does no I/O, returns a decision |
| the plan read | happens BEFORE `questOperationsUpdateBroker` is entered. Story 09's read broker is async and a synchronous callback cannot await it |
| the persist | is the caller's single `questOperationsUpdateBroker` write, which is what makes the decision and its application all-or-nothing on a crash |

---

## BUILD

```
{ quest, plan, operationItemId, agentFlowStatics, questFlowStatics } → NextAction
```

`plan` is `WorkPlan | null` — null for a scope whose planner has not run, which is the state question 3
sees as "no unstarted batches".

**It returns a decision; it does not perform one.** Story 21 wires it to the selector and story 22 to
advance. Keeping it pure is what lets its tests be cheap and exhaustive.

Unit ids in every fixture are the ids the enumeration already produces —
`<flowId>:observable:<id>`, `<flowId>:terminal:<nodeId>`, `<flowId>:branch:<edgeId>`,
`<flowId>:off-map:<family>`. Story 14's table has the source lines.

### Two messages this story owns

```
step `<name>` is not declared in family `<family>` — agentFlowStatics.<family>.steps holds:
<the step keys, comma-separated>. The step-name contract is free-form so a quest.json naming a
retired step still loads; dispatch is the only place it may fail.
```

```
step `<from>` in family `<family>` routes `<outcome>` to `<target>`, which is neither a step in that
family nor `@done` nor `@blocked`. The graph reachability check runs at lint and at load; this throw
is its backstop.
```

---

## DONE WHEN

| Assert | |
|---|---|
| **the four-question order, with one fixture where all four are true** | the single highest-value test in this story. One quest, one scope: an open `request` for `recipe`, two units marked `unmet`, one unstarted plan batch at the current step, and a declared `routes.done`. Assert `cause: 'request'` and a batch of exactly one |
| every route on every step in all six graphs resolves to a step key, `@done` or `@blocked` | a table-driven sweep over `agentFlowStatics` |
| the return edge: a `fixHappy` item carrying `mintedBy: <the happyWalk work item id>` and `routes.done` undeclared produces `{ kind: 'mint', cause: 'return-to-minter', step: 'happyWalk' }` | |
| an item with no `mintedBy` and no route for its outcome produces `{ kind: 'block', reason: 'no-minter' }` | not a stall, and not a silent pass |
| the phase rule: two `happyWalk` pieces, one terminal and one `in_progress`, and **no `adversarial` work item is minted** | assert on the ABSENCE. Then flip the second to terminal and assert it is |
| an adversarial minted item's payload carries the instance id and run id of the work item its `baselineFor` piece produced | |
| grouping: two `unmet` units from one piece → one minted item; from two pieces → two, in the plan's piece order | |
| an `unmet` unit no piece claims → its own minted item with `pieceId` absent and `payload` absent | the reviewer's whole job |
| an inherited payload carries `baselineFor`, carries no instance id, and has `units[]` filtered to the re-minted ids | |
| a SIEGE `unmet` re-mint copies `{ path, offMapFamily }` whole, and its scope is `assignedUnitIds` | the case a `payload.units[]`-only implementation drops on the floor |
| **`maxVisits`: 40 work items already at `work` for this scope, a batch of one is refused** with `{ kind: 'block', reason: 'max-visits' }` and the message names the step, the family and the count | build the 40 with mixed statuses — terminal, failed and one `in_progress` — so a status filter fails this test |
| 39 at `work` and a batch of TWO is refused | `visits + batch.length > maxVisits`, checked before minting |
| an unknown step id fails LOUDLY with the message above, naming the step and the family | story 03 opened the contract so it loads; this is where it must not load silently |
| `invalidation` on a flow re-opens its units onto the NEXT minted work item, **editing nothing** | assert the prior work items are byte-identical afterwards — deep-equal the whole `workItems` array against a snapshot taken before the call |
| `maxConcurrent` counts browser pieces only | a batch of six below-browser pieces plus one browser piece is within a limit of 4: all seven mint |
| `maxConcurrent` with four browser walks already `in_progress` returns `{ cause: 'capped', batch: [] }` | not `block`. The cap clears when a walk records |
| the quest and the plan objects are unchanged after every call | it is pure. Assert both inputs |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| touch `select-batch-layer-broker.ts` or its siblings | story 21 |
| touch `quest-advance-broker.ts` or `quest-build-relay-graph-broker.ts` | story 22 |
| mint a SCOPE | story 16 |
| start an instance | story 23 |
| take `questWithModifyLockBroker` | nobody, ever, in this file. See "Ordering and the lock" |
