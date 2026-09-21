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

## BUILD

Two transformers or brokers, and one correction to an existing one.

| | |
|---|---|
| mint a family's scopes | takes the quest and a family key, runs the existing fan-out for that family's `fanOutBy`, returns the operation items. **The fan-out RULE does not change** — codeweaver per (package, flow) cell, flowrider and siegemaster per flow |
| derive quest completion | from the family graph's position, not from the ledger |
| `workItemsToQuestStatusTransformer` | stop deriving `complete` from a drained ledger. Everything else it does — weighing failure, pause and abandon ownership — stays |

**Do not wire either into Start yet.** Story 22 does that. Test them against a fixture quest.

---

## DONE WHEN

| Assert | |
|---|---|
| **a drained ledger mid-run does NOT derive `complete`** | the one that bites if it is wrong. Build the fixture with a step-graph cycle: a `work ⇄ review` pair between passes, ledger empty, quest still running |
| reaching `@complete` in the family graph DOES derive complete | |
| minting flowrider's scopes AFTER an observable was added includes that observable | the bug this fixes. Assert the unit is in the minted scope's set |
| a family routed to with nothing to fan out produces ZERO scopes, and the family graph routes `empty` onward | a quest with no UI flows seeds no flowrider scope |
| the fan-out cell count is unchanged from today for an unchanged quest | this story changes WHEN, never HOW MANY |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| edit `orchestration-start-responder` | story 22 |
| edit `questBuildRelayGraphBroker`'s call sites | story 22 |
| build the projection VIEW | story 27 |
