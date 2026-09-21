# 22 — the live path reads the graphs

```
GOAL      THE CUTOVER. Before this story nothing new is reachable from a running quest;
          after it, quests run on the step engine.
AFTER     15 · 16 · 19 · 20 · 21
BEFORE    23 · 24
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus
```

**This is the one story that cannot be interrupted half-done.** Everything before it was additive.

---

## BUILD — every file, and the exact call site in it

### `brokers/quest/advance/quest-advance-broker.ts` (99 lines)

| Line | What happens to it |
|---|---|
| `:42` `quest.operations.find((operation) => operation.status === 'pending')` | unchanged. Advance still takes the FIRST pending operation item |
| `:47–55` the strict-1:1 resume guard, ending `if (alreadyLinked) { return null; }` at `:53` | **unchanged, and it stays CORRECT.** Its premise is that a pending item has no work items — and that still holds, because the router only mints inside an *in-progress* one |
| `:59–64` the `dependsOn` chain off `lastSatisfying` | unchanged. Ordering between families is enforced by that chain, not by advance |
| `:66–85` the `workItemContract.parse({ … })` object | **the ONE addition: `step: <the family graph entry's step>`.** Resolve it from `agentFlowStatics[family].entry` (story 05) for the family the operation item belongs to |
| `:78` `...(nextOperation.wardMode === undefined ? {} : { wardMode: nextOperation.wardMode }),` | leave it. Story 24 removes it |
| the JSDoc at `:10–17` | it states strict 1:1 as the invariant. Rewrite it — one operation item now holds many work items |

### `brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts` (176 lines)

It builds the WHOLE ledger today, in one expression:

```
:149  const operations = [...orderedExisting, ...implementationOps, ...tailOps];
```

| Block | What happens to it |
|---|---|
| `:89–118` `registry.startImplementationOps.flatMap(…)` | **goes.** Replaced by story 16's mint-a-family's-scopes broker, called for the ENTRY family only |
| `:123–140` `registry.relayTail.flatMap(…)` | **goes** entirely. There is no tail — each family's scopes are minted when the previous family's `done` routes to it |
| `:56` `const registry = questTypeRegistryStatics[quest.questType];` | becomes `questFlowStatics`, and the value it reads is `entry` rather than two ordered arrays |
| `:61–65` `settledExisting` — force-completing chat intake items | **stays.** Nothing about the graph changes the intake |
| `:72–79` `spinePackages` | **stays.** It is the scope fallback for a seed that fans out to one whole-quest item |
| `:144–147` `operationsCodeweaverOrderTransformer` | **stays.** The codeweaver cells are still ordered dependencies-first |
| `:151–175` `firstActionable` + `firstWorkItem` | **stays**, and the work item gains `step` exactly as advance's does |

**It has a SECOND call site, and it is not on the list.** `quest-hydrate-broker.ts:90`:

```ts
const relay = questBuildRelayGraphBroker({ quest, priorWorkItemIds: [], now });
```

Hydration's own work — a `step` and units on every fabricated work item — is story 28d. **This story's
obligation is narrower and non-negotiable: that call site still compiles and the hydration integration
tests still pass.** If the signature changes, change it there too.

### `responders/orchestration/start/orchestration-start-responder.ts`

| Line | What happens to it |
|---|---|
| `:83–85` `const hasExistingRelay = quest.operations.some((operation) => operation.locked && operation.role === 'ward');` | **this breaks silently and it is the nastiest thing in the story.** There is no seeded `ward` tail item once the tail is gone, so the check answers `false` forever and **every re-Start re-seeds the entry family**. Replace it with a test the new shape can satisfy — the entry family already has scopes on the ledger |
| `:122–126` the `questBuildRelayGraphBroker({ quest: questForRelay, priorWorkItemIds: chatItemIds, now })` call | keeps its shape; what comes back is one family's scopes rather than the whole ledger |
| `:110–114` `relayOverrides` / `questForRelay` | **stays.** The package graph must be stamped before the fan-out, because the fan-out orders cells off it |
| `:128–135` the single `questOperationsUpdateBroker` persist | **stays.** Seed the relay BEFORE the status transition, for the reason its own comment gives: a crash between the two leaves the quest `approved` and startable |
| `:148–153` the `approved → in_progress` flip | unchanged |

**Start stays pure `quest.json` bookkeeping.** No spawn, no git, no build, no `capacity` read — the POST
answers in milliseconds and the `quest-modified` event swaps the browser panel at once. Do not move
anything into it.

### `brokers/quest/get-next-step/*`

| File | Change |
|---|---|
| `compute-next-step-from-quest-layer-broker.ts` | call the router (story 15) instead of deciding. `:52` `mode: commandItem.wardMode ?? 'committed'` is how a ward run gets its scope today — it now comes off the step's `args` (story 20). `:34–54` the command split stays; story 21 states why and where |
| `select-batch-layer-broker.ts` | story 21 already rewrote it. Do not touch it again |
| `build-spawn-instruction-layer-broker.ts` | `:55` `const role: AgentRole = agentRoleContract.parse(workItem.role);` and `:64` `agentTaskPromptTransformer({ role, … })` both key on the ROLE. Under the graph the prompt and the model come off the STEP. `:56` `canResume` and the whole never-clobber-a-session rule stay exactly as they are |
| `scan-once-layer-broker.ts` | `:115` `if (cwdResolution.kind === 'missing-worktree' && step?.type !== 'run-riftcarver')`. The carve is now a deterministic step in the `riftcarver` family, so the exemption must key on the new shape or the quest blocks on the one step that could have repaired it |
| `compute-ready-work-items-layer-broker.ts` | **no change.** Both its rules survive; story 21 lists them |
| `recover-orphaned-work-items-layer-broker.ts` | an orphaned item resumes with its `step` and its `observations` intact — the set freezes at signal (story 02), so a resumed session re-marks from scratch |

### `transformers/work-items-to-quest-status/work-items-to-quest-status-transformer.ts`

The drained-ledger derivation is two lines:

```
:110  const hasPendingOperations = operations.some((operation) => operation.status !== 'complete');
:119  return hasPendingOperations ? runningStatus : drainedStatus;
```

**Story 16 changes the transformer. This story changes its CALLER** — `questOperationsUpdateBroker`,
which re-derives status on every ledger write — so the family graph's position is what reaches it.
Everything else the transformer does stays: `:52–60` the never-derived statuses, `:93–102` the
unresolved-sink-failure test, `:65–66` the `merging`/`merged` pair.

**`insertedBy` and `mintedBy` are two different fields and must not be conflated here.** This
transformer reads `insertedBy` at `:76–78`:

```ts
const supersededIds = new Set(
  derivationWorkItems.map((item) => item.insertedBy).filter((id) => id !== undefined),
);
```

`insertedBy` means *"a retry was spliced for this failed item"* — it is what clears a sink failure.
`mintedBy` (story 02) is the RETURN EDGE: which session's marks minted this work item. Read `mintedBy`
here and a mark-minted worker reads as superseding the reviewer that minted it, so a quest with a
healthy `work ⇄ review` loop derives `complete`. **Leave `:76–78` reading `insertedBy`.**

### `transformers/relay-tail-fan-out/relay-tail-fan-out-transformer.ts` (269 lines)

Two changes — see the section below. Its callers are `quest-build-relay-graph-broker.ts:92` and
`:131` today; after story 16 the caller is the mint-a-family's-scopes broker.

### The splices — THREE, not two, and one of them is an append

| Where | Lines | Shape | Becomes |
|---|---|---|---|
| `quest-run-ward-broker.ts` | `:283–318` — `spiritmenderOp`, then `freshWardOp`, then `insertIndex` and the three-way `slice` | spiritmender + a `pt N` ward | one `routes.unmet: 'repair'` entry on the `ward` step |
| `quest-run-riftcarver-broker.ts` | `:489–523` — the same shape | spiritmender + a `pt N` carve | one `routes.unmet: 'repair'` entry on the `carve` step |
| `quest-handle-signal-back-responder.ts` | `:308–335` — `continuations`, `insertIndex`, the three-way `slice` | duplicate-on-partial | **retires** with REL-6 (story 19). `unmet` does the job |
| `orchestration-merge-responder.ts` | `:111–151` — `closedOut`, `warpgateOperation`, then `operations: [...closedOut, warpgateOperation]` | warpgate | an APPEND, not a slice. It becomes one `warpgate` family scope. Keep `dependsOn: []`, keep `locked: true`, keep the force-complete of every non-complete item at `:111–115` — its comment says why each is load-bearing |

---

## `relayTailFanOutTransformer` changes twice

### 1. It runs when a family is routed to, not once at Start

The fan-out RULE is untouched — codeweaver per (package, flow) cell, flowrider and siegemaster per
flow. Only the timing moves.

### 2. A glue seam's units go to the SECOND cell only

**The problem:** codeweaver orders cells by package-kind tier, so the far side of an HTTP seam is
routinely a LATER operation item. Today the answer is a note rather than a verdict — *"If that half is
not built yet, write down what you assumed"* — and all three marks are wrong for it.

**The fix is upstream of the marks.** The orchestrator already computes cell order, and it does it
right here:

```
relay-tail-fan-out-transformer.ts:221-234
  .sort((left, right) => { … rankByPackage … depthByPackage … localeCompare(…) });
```

so "which side comes second" is a fact it HOLDS at fan-out time, not a judgement anyone makes later.
The later cell can see both halves; the earlier one is never assigned the unit and never has to mark
it.

**Three things about this change are easy to get wrong, and each is a measured defect if you do.**

**(a) CELL MEMBERSHIP DOES NOT CHANGE. Only UNIT ASSIGNMENT does.** The loop at `:145–165` mints a
cell for a package wherever it tags a node, glue nodes included, and its own comment records why
awarding a node to one owner was tried and reverted:

> *"Awarding the node to one owner instead lost work whenever that node was the OTHER side's ONLY node
> in the flow: no cell was minted for it at all, so its observables reached no session's 'Must satisfy'
> list."*

Both cells still exist. The earlier one just is not assigned the seam's units.

**(b) The thing to change is the unit filter, and it is in a different file.**
`packageScope: 'intersection'` is declared three times in
`signoff-track-eligibility-statics.ts` (`:136`, `:156`, `:176`) and implemented once:

```
qa-units-in-package-scope-transformer.ts:105
  return owningPackages.some((name) => declaredNames.has(name));
```

That `.some()` is what gives a glue unit to every cell that tags it. It becomes: for a unit whose
owning node carries more than one package, the unit belongs to the cell whose package sorts LAST among
the cells minted for this flow — the same three sort keys as `:221–234`.

**(c) A seam is `node.packages.length > 1`, and the contract says so.** `flowNodeContract`'s own
`.describe()` at `:48`: *"A node carrying more than one is a seam: it spans a package boundary, and it
owns the glue verification units no single-package slice can."* Do not invent a second definition.

That replaces `packageScope: 'intersection'` for seam units. Under a gate that refuses an unmarked
assignment, the old rule would force two cells to mark the same unit, or block one of them. **One
owner, chosen by ordering the orchestrator already does.** No fourth mark; the vocabulary stays at
three.

The earlier cell still needs to SEE the far half — that is what `contextUnitIds` is for (story 07).

**`RelayTailSlice` is `Pick<OperationItem, 'text' | 'flowIds' | 'packageNames'>` (`:45`)**, so it has
nowhere to carry a unit list. Either widen it or recompute the ordering inside the unit filter from the
same keys. **Recomputing is the safer of the two** — the sort keys are `quest.packagesAffected`,
`packageBuildOrderStatics.tiers` and `quest.packageGraph`, all of which the unit filter can already
reach, and a widened slice would have to be persisted and kept in sync with a mid-quest amendment.

---

## Operational flows: who gets them, and it is an assertion requirement

**Codeweaver owns operational work outright. Flowrider and siegemaster never see it.**

| Family | Operational flows, nodes and observables | Why |
|---|---|---|
| **codeweaver** | gets all of it | somebody does the work, and its reviewer is the only session that reads the tree and can confirm the change landed |
| **flowrider** | filtered out | it writes tests that walk a flow. There is nothing to walk, and a test asserting a file is ABSENT is a change-detector that goes green the day it is written and blind thereafter |
| **siegemaster** | filtered out | it drives a running system by hand. An operational change has no running surface to drive |

**The filtering is the ORCHESTRATOR's, never the session's.** A prompt that says "skip operational
units" is a rule an agent can misread; a scope that never contains one cannot be misread.

**The FLOW-level half already exists.** `relayTailFanOutTransformer:70–73` filters
`quest.flows` against `eligibility.flowTypes` off `signoffTrackEligibilityStatics.byTrack[role]`, and
`:75–88` keeps a whole-quest item only for a track carrying `off-map`. Keep both.

**OPEN — the UNIT-level half has no field to key on, and the DONE WHEN below demands it.**
`flowTypeContract` is `z.enum(['runtime', 'operational'])` and it is a property of the FLOW.
`flowNodeContract` is `.strict()` and carries `id`, `label`, `type`, `packages`, `observables` and the
three sign-offs — **no operational marker**. `flowObservableContract` has none either. So "a RUNTIME
flow carrying an operational NODE" is not expressible on a quest today, and assertion (2) below cannot
be written against the current contracts. **The plan author decides**: add an `operational: boolean` to
`flowNodeContract` (a `.strict()` contract edit, with the `.default()` trap its own header records), or
drop the per-unit claim and filter by `flowType` alone — accepting the hole the design says that leaves.
Do not pick one silently, and do not fake the assertion with a fixture whose flow is wholly
operational: that is assertion (1), and it passes against the flow-level filter that already exists.

Also update `flow-type-contract.ts:13–14`, whose own comment says an operational flow *"is verified by
Siegemaster checking the final state"*. After this story it is not.

---

## Also update

`packages/orchestrator/CLAUDE.md` and `docs/quest-role-paths.md`. **The second is repo policy** — that
document is the spec, and it is written against strict 1:1.

### `docs/quest-role-paths.md` — 1074 lines, and here is the budget

Fourteen of its top-level sections are affected. Read it once, end to end, before editing any of them.

| Lines | Section | Fate |
|---|---|---|
| 17–39 | The model in one paragraph | rewrite — it is the relay, in one paragraph |
| 40–147 | Core concepts | rewrite the work-item half. "Work item = one agent session" survives; "each operation item is worked by exactly one work item" does not |
| 148–237 | Quest types and their relay tails | **replace.** There are no tails. `questFlowStatics` and the family graph |
| 238–254 | Dispatchers: two drivers, one relay | mostly survives — both dispatchers still drive one brain |
| 255–288 | Quest status lifecycle | `complete` comes off the graph now |
| 289–370 | The operations ledger, from create to complete | rewrite — the ledger is minted lazily |
| 371–434 | The relay engine — `questAdvanceBroker` (373), Dispatch selection (397), Status derivation (415) | rewrite all three. `:399–405` says "return **one session at a time**"; `:404–405` says "there is at most one dispatchable work item at any moment" — both false after story 21. `:407–413` (the riftcarver exemption) needs the new step shape. `:423–426` (never derive `complete` while an operation is pending) is restated |
| 435–629 | Per-role paths — chat/intake (454), Implementation (462), Verify (468), three verification tracks (512), the reset lever (560), `questNotes` (575), Command (590), Recovery (622) | **the largest block.** 512–559 and 560–574 retire with the tracks (story 26); 462–511 become per-STEP paths; 590–621 becomes the deterministic-handler section |
| 630–803 | The sad paths in detail — (a) 636, (b) 649, (b2) 659, (c) 689, (c2) 731, (d) 751, (e) 772 | (a) retires with duplicate-on-partial; (b) and (b2) become route entries; (e) **deletes** — commit-before-signal is gone (story 19). (c), (c2) and (d) survive |
| 804–828 | Block ownership | survives, extended to `@blocked` |
| 829–849 | Resuming a blocked quest | survives |
| 850–1028 | Invariants — Relay (852), Riftcarver (893), Ward (943), Orphan recovery (951), Block (969), Siegemaster (984), Contract integrity (1017) | the REL-* table below. RIFT-*, Orphan and Block survive; Siegemaster's retire with the tracks |
| 1029–1074 | Full happy path (feature, E2E reference) | **replace the diagram.** It draws the ordered tail, `ward (changed)` between families, and "No pending operation item remains → derives complete ✓" |

| Invariant | Fate |
|---|---|
| REL-1 strict 1:1 | **breaks.** One operation item, many work items |
| REL-2 universal operations link | survives |
| REL-3 one session at a time | **breaks** with parallel batches. A command still dispatches alone |
| REL-4 advance atomic and idempotent | survives, extends to the router |
| REL-5 no false complete | **restated.** `complete` means the family graph reached `@complete` |
| REL-6 duplicate-on-partial | **retires.** `unmet` does the job, and names exactly what remains |
| REL-6a/6b/6c three-track rules | **retire** with the sign-off tracks, story 26 |
| REL-6d commit-before-signal | **retires**, story 19 |
| REL-7 idempotent signal | survives |

**Two new invariants:** no step signals with an unmarked ASSIGNED unit; and a `role: 'reviewer'` step is
assigned its scope's whole IN-SCOPE set, filtered by the step's declared scope.

And update the INVARIANT comment at `work-item-contract.ts:35–39`, which story 02 left standing with a
note pointing here. Verbatim, so you can find it:

```
// INVARIANT (behavioral, enforced by every seeding path — quest-create, the relay graph
// builder, and questAdvanceBroker): every work item carries exactly ONE `operations/<id>`
// ref linking it to its operation item on the quest operations ledger, and each operation
// item is worked by exactly ONE work item over its life (strict 1:1 — never re-linked,
// never status-reverted). Ward items may additionally carry a `wardResults/<id>` ref.
```

The first sentence survives (REL-2). The second — *"each operation item is worked by exactly ONE work
item"* — is what breaks.

---

## DONE WHEN

Integration tests, one operation item end to end per family shape, against a stub dispatcher. **Assert
the work items MINTED and their ORDER**, never that a callback fired.

**Every assertion below that names a unit spells a real unit id.** The single enumeration is
`qa-unit-enumerate-transformer.ts`, and the shape is `<flowId>:<kind>:<localId>` — `:54`
`${flowId}:terminal:${nodeId}`, `:67` `${flowId}:branch:${edgeId}`, `:81`
`${flowId}:observable:${observableId}`, `:97` `${flowId}:off-map:${family}`, with `off-map`
hyphenated. A fixture asserting a bare observable id proves nothing about the router's scoping,
because nothing it is compared against carries that shape.

| Family shape | Assert |
|---|---|
| **codeweaver** | plan → two parallel pieces → review marks two units `unmet` → a worker minted carrying EXACTLY those two → review `done` → operation complete |
| **flowrider** | a piece's `surface` reaches the worker's rendered prompt **verbatim**, and two units on one spec file carry different `layer` values |
| **siegemaster** | walk marks `unmet` → fixer minted on those units → fixer `done` → back to the walk carrying only those → clean. Assert the return happened with **no `done` route declared**, and that an adversarial `unmet` reaches `fixAdversarial` and never `fixHappy` |
| **the two phases** | no `adversarial` work item is minted until every `happyWalk` piece has recorded, and it carries the instance and run id its `baselineFor` names |
| **ward gates** | a red mints a `repair` scoped to that family; the repair returns to the ward with no declared route; a spent `maxVisits` blocks; `wardFull` runs ONCE after every family has drained, never per cell |
| **the family graph** | nine codeweaver cells route to flowrider once, on the ninth. `empty` routes on when a fan-out produced no scopes. **A drained ledger mid-run must NOT derive `complete`** |
| **on-request steps** | a planner's `request` for `recipe` mints it and returns to that planner, with no route declared either way. Then the one that matters: a WORKER requesting one mid-piece resumes as a fresh work item carrying the same units, with the recipe names on it |
| **operational flows** | three NEGATIVE assertions, the hardest kind to remember: (1) an all-operational quest mints ZERO flowrider and ZERO siegemaster scopes — not "they complete cleanly", that they are never minted; (2) a RUNTIME flow carrying an operational NODE has that node's units absent from a flowrider scope — **the filter is per unit, not per flow**, and filtering only by `flowType` sends those units to a session that cannot settle them and blocks the gate forever. *(Blocked on the OPEN above — no field expresses an operational node today.)* (3) a codeweaver reviewer marks an operational unit `met` with TREE STATE as evidence, never a test path |
| **the seam** | a glue node's units land on the LATER cell only, and appear as `contextUnitIds` on the earlier one. **Assert the earlier cell still EXISTS** — membership is unchanged, and a test that only counts units passes against an implementation that stopped minting the cell |
| **Start is idempotent** | Start the same quest TWICE and assert the entry family's scopes appear ONCE. The `hasExistingRelay` check keyed on a locked `ward` item, and there is no longer one |
| **hydrate still works** | `quest-hydrate-broker`'s integration tests pass unchanged. It is the second caller of `questBuildRelayGraphBroker` |
| **sad paths** | a wall at every step, a spent `maxVisits`, a mid-run amendment, an orphaned step resumed |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete anything | story 24 |
| start an instance, or read `capacity` | story 23 |
| touch a sign-off field | story 26 |
| give a fabricated hydration work item a `step` or units | story 28d. Only keep the call site compiling |
| rewrite `select-batch-layer-broker.ts` | story 21 did it |
