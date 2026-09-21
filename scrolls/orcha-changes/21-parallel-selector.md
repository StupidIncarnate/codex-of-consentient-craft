# 21 — the selector returns a batch

```
GOAL      Dispatch more than one session at a time. It is nearly free.
AFTER     15 (the router decides what the batch IS)
BEFORE    22
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

---

## The whole cap is one line

`nextStepContract`'s `spawn-agents` already carries an array, and `spawnBatchLayerBroker` already
spawns the whole of it under `Promise.all`, pre-stamping each work item `in_progress` first:

```
next-step-contract.ts:24
  z.object({
    type: z.literal('spawn-agents'),
    agents: z.array(spawnInstructionContract),
  }),
```

```
spawn-batch-layer-broker.ts:72
  await Promise.all(
    agents.map(async (instruction) => {
```

**The only thing capping dispatch at one session is
`packages/orchestrator/src/brokers/quest/get-next-step/select-batch-layer-broker.ts`. The whole file
is nineteen lines, and these are the last four:**

```ts
import type { WorkItem } from '@dungeonmaster/shared/contracts';

export const selectBatchLayerBroker = ({ ready }: { ready: WorkItem[] }): WorkItem[] => {
  const [first] = ready;
  return first ? [first] : [];
};
```

`const [first] = ready;` is line 17. **Its JSDoc states the cap as the design**, so the header is part
of the change, not a comment to leave behind:

> *"The operations relay runs ONE session at a time (each work item is one agent session against one
> operation item), so this always returns the single first ready item."*

Parallelism is that selector returning a batch, plus a join: the route fires when the LAST item in the
batch has recorded.

---

## What the selector RECEIVES

`selectBatchLayerBroker` takes `{ ready: WorkItem[] }` today and decides by itself. After story 15 it
decides nothing — the router already did. So the selector's new input is the router's decision, and
this is the one thing story 15 does not pin down.

**Story 15 defines `NextAction` as "one of: mint these work items, follow a route, complete the
operation item, or block" and gives no fields.** This story consumes it, so it needs one field and one
only:

| Needs | Why |
|---|---|
| the WORK ITEM IDS to dispatch, in order | the selector's whole job. It turns ids into `WorkItem`s, filters them against the ready set, and hands the survivors up |

**OPEN — who owns the `NextAction` shape.** Story 15 builds it, this story is its first consumer, and
neither names its fields. Whoever executes 15 must give the "mint these work items" variant a field
naming the minted items, and whoever executes 21 must read that field rather than re-deriving the
batch from `ready`. **The plan author decides which story writes the contract** — but a selector that
recomputes a batch story 15 already computed is two engines that will disagree, so it must not be
"both".

**Until that is settled, keep the selector's INPUT a superset**: `{ ready, selected }`, where
`selected` is the router's list and `ready` is the eligibility filter. The intersection, in `ready`'s
order, is the batch. That shape works whichever way the OPEN resolves and is the honest reading of
"the selector returns the batch the router decided".

---

## BUILD

| File | Change |
|---|---|
| `select-batch-layer-broker.ts` | return the batch the router decided, not the first ready item. Rewrite the JSDoc — the line quoted above is the claim this story falsifies |
| `compute-next-step-from-quest-layer-broker.ts` | pass the router's decision through. **Keep the command split** — see below |
| `compute-ready-work-items-layer-broker.ts` | **no behaviour change.** Both of its rules stay; see below |
| the join | already exists as story 15's PHASE RULE. This story's obligation is not to break it |

### The command split, and exactly where it is

`computeNextStepFromQuestLayerBroker` runs the split BEFORE anything is batched, at `:34`:

```ts
const commandItem = ready.find((item) => isCommandWorkItemRoleGuard({ role: item.role }));
```

and returns `run-riftcarver` at `:40` or `run-ward` at `:48`, each with a single `workItemId`, before
`selectBatchLayerBroker({ ready })` is reached at `:56`. Its own comment says why, and the second half
is the load-bearing one:

> *"Returned BEFORE the ward branch and before the batch below, which is what keeps a riftcarver item
> out of `buildSpawnInstructionLayerBroker` — that layer parses `agentRoleContract` and throws for any
> role Claude cannot be dispatched as."*

**Keep the split and keep it in that position.** `spawnInstructionContract` carries
`role: agentRoleContract`, and `agentRoleContract` enumerates `codeweaver`, `flowrider`,
`siegemaster`, `spiritmender`, `warpgate` — `riftcarver` is deliberately absent from it, so a command
item reaching the batch is a throw, not a mis-dispatch.

### What `computeReadyWorkItemsLayerBroker` already guarantees

Two behaviours, both stated in its JSDoc, both of which the batch inherits for free and neither of
which this story may change:

| Behaviour | Mechanism |
|---|---|
| **floor order** | it returns `workItemsInDispatchOrderTransformer({ workItems })` filtered — "topological depth, then role/floor position, then createdAt". Its own header notes that the first ready item is therefore always the shallowest floor; with a batch, the whole batch is in that order |
| **pending chat roles excluded outright** | `!isChatWorkItemRoleGuard({ role: item.role })` at `:31`. Its header: *"a chat role is spawned only by the route that owns it … otherwise a headless dispatch session would hit the throw `get-agent-prompt` raises for chat roles"* |

### Eligibility stays in that broker, and NEVER as a status literal

**A work-item status has SIX values, not four.** `work-item-status-contract.ts:11–18`: `pending`,
`queued`, `in_progress`, `complete`, `failed`, `skipped`. `queued` is live and easy to miss —
`work-item-status-metadata-statics.ts:20–32` calls it *"deps satisfied, committed to a role group, but
awaiting slot dispatch"*, with `isActive: true`, `isPending: false` and `isTerminal: false`.

So the ready set **excludes a queued item today**, deliberately: it is already claimed. A batch
selector that re-derives eligibility for itself either re-admits it — dispatching an item something
else is holding — or invents a fourth answer. **The selector filters against the `ready` array and
nothing else.**

**Comparing `.status` to a literal is a LINT ERROR here**, not a style note.
`rule-ban-quest-status-literals-broker.ts:34` refuses `.status === '<work-item status>'` with *"Do not
compare .status to the work-item-status literal … Use the appropriate shared guard"*, and `:42` refuses
an inline set of them: *"Do not build an inline set/array of known status literals."* Use
`isPendingWorkItemStatusGuard`, `isActiveWorkItemStatusGuard`, `isTerminalWorkItemStatusGuard` and
`satisfiesDependencyWorkItemStatusGuard` — all of which read
`workItemStatusMetadataStatics.statuses[status]`, so a seventh value is covered the day it is added.

### The one rule a batch has to satisfy, and it is satisfied by construction

`packages/orchestrator/CLAUDE.md` § "Never parallel-dispatch different roles":

> *"The only permitted parallelism is multiple agents OF THE SAME ROLE that a SINGLE `get-next-step`
> returned together."*

Under the step engine a batch is **the pieces at one STEP** — one prompt, one model, one role. So the
rule holds without a new guard. **Assert it anyway**, because nothing in the types does: a batch whose
items carry two different `step` values is the shape that breaks it, and the assertion is cheap.

### Where concurrent writes actually serialize

**Concurrent `quest-work` calls queue behind `questWithModifyLockBroker`**, which is what that lock is
for. Story 17 already uses it. Two other paths in this flow take the same lock and are why a batch of
four does not corrupt the quest file:

| Path | Lock taken via |
|---|---|
| the pre-stamp of each item to `in_progress` before its spawn | `questModifyBroker` at `spawn-batch-layer-broker.ts:88`, which wraps `questWithModifyLockBroker` |
| every ledger write | `questOperationsUpdateBroker`, same lock |

The lock is per-quest and **deliberately non-reentrant** (its own header says so), so nothing in this
story may take it while already holding it.

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- <your paths>` exits 0, and:

| Assert | |
|---|---|
| a ready set of four dispatches four | assert `step.agents.length === 4` and the four `workItemId`s, in floor order |
| the route fires on the LAST recording, not the first | the join. Assert with a fixture where one item records late: after three of four record, the router returns no route; after the fourth, it does |
| a COMMAND work item still dispatches ALONE | the existing split. A test that only covers agents will pass against an implementation that batches a ward item with three agents, and that breaks at `agentRoleContract.parse` |
| a ready set holding a riftcarver item AND three agents returns `type: 'run-riftcarver'` with one `workItemId`, and no `spawn-agents` | the split's position, not just its existence |
| a pending chat role is still excluded from the ready set | it is spawned by the route that owns it, never by the dispatcher |
| a `queued` work item is NOT dispatched | it is already claimed. Assert it with a fixture, because the four statuses everyone remembers do not include it |
| a batch's items all carry the same `step` | the "never parallel-dispatch different roles" rule, made checkable |
| the batch is in `workItemsInDispatchOrderTransformer` order | pass the router a deliberately shuffled `selected` list and assert the output is re-ordered, not echoed |
| four concurrent `quest-work` writes all land | the lock. Assert all four observation sets are on the quest afterwards, not that four calls returned success |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| bound the batch by instance capacity | story 23 |
| enforce `maxConcurrent` | story 15 — the router already applied it before this selector sees anything |
| edit `quest-advance-broker` | story 22 |
| change the floor ordering | it is also the web execution view's order. Leave it |
| touch `spawn-batch-layer-broker.ts` | it already spawns an array under `Promise.all`. Nothing there needs changing, and the temptation to "make it parallel" is the trap — it already is |
