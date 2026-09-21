# 16 — scopes are minted late, and `complete` comes off the graph

```
GOAL      A family's scopes are created when that family is ROUTED TO, not at Start. And
          a quest is complete when the family graph says so, not when the ledger drains.
AFTER     04 (family graph) · 15 (the router decides)
BEFORE    22
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus
```

---

## Two changes, and they are the same change

### Lazy scope creation

Today `questBuildRelayGraphBroker` mints every scope at Start — every codeweaver cell, every flowrider
flow, every siegemaster flow — before anything runs. With families routing to each other, each
family's scopes are minted when that family is routed to.

**That fixes a real bug.** An operator can add an observable mid-quest. Today flowrider's scopes were
already cut from the flows as they stood at approval, so a late observable never gets a flowrider
session at all. Minting later means the fan-out reads the flows as they stand then.

**And it is not really a trade-off, it is the only coherent option:** you cannot mint up front what the
graph has not decided yet.

### Completion off the graph

`workItemsToQuestStatusTransformer` derives `complete` from a drained ledger today. **Under a graph
that can cycle, a drained ledger is an ordinary mid-run state** — `work ⇄ review` and
`happyWalk ⇄ fixHappy` are cycles, and between two passes the ledger is legitimately empty.

So `complete` means *the family graph reached `@complete`*, full stop.

---

## The statement this rests on, worth reading before you code

**The config is the map. The ledger is the record. The UI is a projection.**

| | Is | Shape |
|---|---|---|
| the config | the map — everything that CAN happen | a graph, with cycles |
| the ledger | the record — what DID happen | a list, append-only, minted as reached |
| the UI | a projection — what probably happens next | computed, never stored |

The ledger cannot be the map, because the map has cycles and a list cannot say what is coming. Today
the ledger doubles as the plan — the queue page reads it to show what is next — and that only works
while the run is a straight line. Story 27 builds the projection that replaces it.

---

## Which operation items belong to which family

Nothing on `operationItemContract` names a family — it carries `role` (`operation-item-contract.ts:28`)
and nothing else. **So the mapping is derived, and it is five lines, not one.** Put it in a resolver of
its own, used by BOTH halves of this story.

| Family key in `questFlowStatics` | Its scopes on the ledger | Its seed in `questTypeRegistryStatics` |
|---|---|---|
| `riftcarver` | `role === 'riftcarver'` | `startImplementationOps[0]` |
| `codeweaver` | `role === 'codeweaver'` | `startImplementationOps[1]` |
| `flowrider` | `role === 'flowrider'` | `relayTail[1]` |
| `siegemaster` | `role === 'siegemaster'` | `relayTail[2]` |
| `wardFull` | `role === 'ward'` **and** `wardMode === 'full'` | `relayTail[3]` |
| `warpgate` | `role === 'warpgate'` | none — its text is `warpgateOperationStatics`, appended at merge |

**`relayTail[0]` — `{ role: 'ward', text: 'Ward gate (committed files)', wardMode: 'committed' }` — maps
to NO family.** Story 04 took the committed ward off the family list; after story 20 it is the `ward`
STEP inside each code-changing family's `CLOSE_OUT`. An item matching it is ignored by both halves here.

**`wardFull` is the one family whose key is not a role name**, which is why the table is data rather
than `role as FamilyKey`. Say in your signal that story 24's deletion of `wardMode` removes this
resolver's only discriminator for it — the conductor decides whether `wardFull` earns a carrier on the
operation item or whether 24 leaves `wardMode` alone.

---

## BUILD

Two new transformers and one correction to an existing one, all in
`packages/orchestrator/src/transformers/`.

### 1. Mint a family's scopes

```
{ quest, family } → OperationItem[]
```

It resolves the family's seed through the table above, then calls the existing fan-out **unchanged**:

```ts
// packages/orchestrator/src/transformers/relay-tail-fan-out/relay-tail-fan-out-transformer.ts:47
relayTailFanOutTransformer({ entry, quest }): RelayTailSlice[]
// RelayTailSlice = Pick<OperationItem, 'text' | 'flowIds' | 'packageNames'>   (:45)
// `entry` is one seed object off questTypeRegistryStatics — { role, text, fanOutBy?, locked?, wardMode? }
```

**The fan-out RULE does not change** — codeweaver per (package, flow) cell, flowrider and siegemaster
per flow. Only WHEN it runs.

Each slice becomes an `operationItemContract.parse({ … })`, copying the three things
`quest-build-relay-graph-broker.ts:89–140` already does and that are easy to lose:

| | |
|---|---|
| `locked` | off the family entry in `questFlowStatics` (story 04 put it there), defaulting TRUE. Only `codeweaver` sets it false, and `locked` is what enrols an item in its `slotManagerStatics` pt budget |
| `wardMode` | copied from the seed when present, which is the only thing that makes a `wardFull` scope distinguishable from a committed-ward one |
| the spine-packages fallback | a slice with an empty `packageNames` inherits every package the quest's flow nodes tag — UNLESS the role is a COMMAND role (`isCommandWorkItemRoleGuard`), which gets `[]`. `quest-build-relay-graph-broker.ts:100–115` carries the reason: `packageNames` narrows an AGENT's search, and a command has no prompt to narrow |

**Do NOT apply `operationsCodeweaverOrderTransformer` here.** The fan-out already orders codeweaver
cells by package KIND tier, then `packageGraph` depth, then name
(`relay-tail-fan-out-transformer.ts:211–234`); that transformer exists to reorder items ChaosWhisperer
authored, and this family's items have no author.

### 2. Derive quest completion from the graph

```
{ quest, questFlowStatics } → boolean
```

**It does not walk the graph forward, and walking it is the trap.** A family that produced zero scopes
leaves no trace on the ledger, so a forward walk cannot tell "flowrider was skipped as `empty`" from
"flowrider has not been routed to yet" — and it would walk straight past every un-minted family to
`@complete`. That is REL-5, the false complete, reintroduced by the thing meant to fix it.

Ask the question from the other end instead:

```
the family graph reached @complete
  ⇔ some family whose routes.done or routes.empty is '@complete'
      has at least ONE scope on the ledger
      and every one of its scopes is `complete`
```

In `questFlowStatics.feature` those families are `wardFull` and `warpgate`. A `wardFull` scope exists
only because siegemaster's `done` routed to it, so its presence is the proof the run got there, and no
new state records anything. A family that fanned out to zero scopes is skipped for free: the run routes
past it and `wardFull` is minted anyway.

`warpgate` is the `merged` side of the same test and needs no branch here — the existing transformer
already splits `complete` from `merged` on `currentStatus === 'merging'`
(`work-items-to-quest-status-transformer.ts:65–66`).

### 3. `workItemsToQuestStatusTransformer` — change ONE decision, keep every other

Read `packages/orchestrator/src/transformers/work-items-to-quest-status/work-items-to-quest-status-transformer.ts`
before editing. `hasPendingOperations` is read in THREE places and only one of them is a completion
claim.

| Line | What it decides | Fate |
|---|---|---|
| `:119` `return hasPendingOperations ? runningStatus : drainedStatus` | **the completion claim** | **changes.** `drainedStatus` is returned when the graph derivation above says so, `runningStatus` otherwise |
| `:116` `hasUnresolvedSinkFailure && !hasPendingOperations → 'blocked'` | a failure nothing superseded | **stays.** It is a failure roll-up, not a claim that the work finished |
| `:142` `allPendingDeadEnded && !hasPendingOperations → 'blocked'` | every pending item dead-ended on a failed dep | **stays**, same reason |

Everything else stays untouched, and each of these has a defect behind it:

| Stays | Because |
|---|---|
| the five statuses never derived over — pre-execution, user-paused, abandoned, blocked, and the literal `merged` (`:52–60`) | each is owned by something other than work-item state. `merged` is a literal rather than a guard because no metadata separates it from `complete` |
| the `merging` → `runningStatus`/`drainedStatus` split (`:65–66`) | a running merge is `merging`, a drained one is `merged`, never `complete` |
| the `excludedFromStatusDerivation` role filter (`:29–31`, `:72`) | a tavernkeeper item is created AFTER the quest terminated; counting it makes a finished quest read as running. Scoped to that one role — a `warpgate` item SHOULD re-open the quest |
| `supersededIds` off `insertedBy` (`:73–77`) | a failed item is resolved once a retry was spliced for it |
| the SINK computation off `dependedOnIds` (`:85`, `:97–102`) | only an unresolved failure that nothing overtook blocks |
| the `merging` narrowing of `failureCarryingItems` to `warpgate` (`:93–96`) | a quest that was blocked when Merge was pressed still carries the failed item that halted it, and scanning it again pins the quest short of `merged` forever. A FAILED merge still derives `blocked` |
| `allPendingDeadEnded` (`:130–142`) | a `skipped` dep is terminal and does NOT satisfy `dependsOn` |

**Do not wire either new transformer into Start.** Story 22 does that. Test them against a fixture
quest.

---

## DONE WHEN

| Assert | |
|---|---|
| **a drained ledger mid-run does NOT derive `complete`** | the one that bites if it is wrong. Fixture: a `work ⇄ review` cycle between passes — every codeweaver scope `complete`, every work item terminal, NO `wardFull` scope on the ledger. Expect `in_progress` |
| reaching `@complete` DOES derive complete | the same fixture plus one `role: 'ward'`, `wardMode: 'full'` scope at `complete`. Expect `complete` |
| a `wardFull` scope at `pending` derives `in_progress`, not `complete` | at least one scope, not all complete |
| a `role: 'ward'`, `wardMode: 'committed'` scope at `complete` does NOT derive complete | the family resolver's one real trap: matching on `role === 'ward'` alone completes every quest the moment the committed gate goes green |
| minting flowrider's scopes AFTER an observable was added includes that observable | the bug this fixes. Add the observable to a node on a runtime flow, mint, and assert its unit id is in the minted scope's set |
| a family routed to with nothing to fan out produces ZERO scopes | a quest whose flows are all `operational`: flowrider's `flowTypes` is `['runtime']` and its `unitKinds` carries no `off-map`, so `relay-tail-fan-out-transformer.ts:75–88` returns `[]`. Assert the array length is 0 |
| the SAME quest mints exactly ONE siegemaster scope, with `flowIds: []` | siegemaster's `unitKinds` DOES carry `off-map`, so it keeps a whole-quest item. The two families diverge on one statics field and a test that only covers flowrider misses it |
| the fan-out cell count is unchanged from today for an unchanged quest | this story changes WHEN, never HOW MANY. Take a fixture with three packages across two flows, mint `codeweaver` through the new transformer, and assert the same texts and the same ORDER `questBuildRelayGraphBroker` produces for it today |
| a whole-quest slice inherits the spine packages, and a `riftcarver` slice does not | the COMMAND carve-out |
| both transformers are pure | assert the quest object is unchanged |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| edit `orchestration-start-responder` | story 22 |
| edit `questBuildRelayGraphBroker`'s call sites, or the broker itself | story 22 |
| edit `relayTailFanOutTransformer` | story 22 owns its two changes — the seam rule and the operational-flow filter |
| add a `family` field to `operationItemContract` | the resolver above needs none. Say if you disagree; do not do it |
| build the projection VIEW | story 27 |
