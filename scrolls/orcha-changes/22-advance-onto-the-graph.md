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

## BUILD

| File | Change |
|---|---|
| `brokers/quest/advance/quest-advance-broker.ts` | gains ONE job: stamping `step: <graph.entry>`. Its guard is on *pending* operation items, and a pending item still has no work items because the router only mints inside an *in-progress* one — **that guard stays correct**. Ordering between families is enforced by the `dependsOn` chain, not by advance |
| `brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts` | seeds the ENTRY family rather than minting the whole ordered tail at Start. Each family's operation items are minted when the previous family's `done` routes to it (story 16) |
| `responders/orchestration/start/orchestration-start-responder.ts` | reads `questFlowStatics` |
| `brokers/quest/get-next-step/*` | call the router |
| `transformers/work-items-to-quest-status/…` | stop deriving `complete` from a drained ledger |
| `transformers/relay-tail-fan-out/…` | two changes — see below |
| the `spiritmender` and `warpgate` SPLICES | hand-written slice arithmetic in two brokers today. They become one route entry each, so **delete the splice code** |

---

## `relayTailFanOutTransformer` changes twice

### 1. It runs when a family is routed to, not once at Start

The fan-out RULE is untouched — codeweaver per (package, flow) cell, flowrider and siegemaster per
flow. Only the timing moves.

### 2. A glue seam's units go to the SECOND cell only

**The problem:** codeweaver orders cells by package-kind tier, so the far side of an HTTP seam is
routinely a LATER operation item. Today the answer is a note rather than a verdict — *"If that half is
not built yet, write down what you assumed"* — and all three marks are wrong for it.

**The fix is upstream of the marks.** The orchestrator already computes cell order (package kind tier,
then package-graph depth, then name), so "which side comes second" is a fact it HOLDS at fan-out time,
not a judgement anyone makes later. The later cell can see both halves; the earlier one is never
assigned the unit and never has to mark it.

That replaces `packageScope: 'intersection'` for seam units. Today a glue node's units go to EVERY cell
that tags it, which under a gate that refuses an unmarked assignment would force two cells to mark the
same unit, or block one of them. **One owner, chosen by ordering the orchestrator already does.** No
fourth mark; the vocabulary stays at three.

The earlier cell still needs to SEE the far half — that is what `contextUnitIds` is for (story 07).

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

---

## Also update

`packages/orchestrator/CLAUDE.md` and `docs/quest-role-paths.md`. **The second is repo policy** — that
document is the spec, and it is written against strict 1:1.

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
note pointing here.

---

## DONE WHEN

Integration tests, one operation item end to end per family shape, against a stub dispatcher. **Assert
the work items MINTED and their ORDER**, never that a callback fired.

| Family shape | Assert |
|---|---|
| **codeweaver** | plan → two parallel pieces → review marks two units `unmet` → a worker minted carrying EXACTLY those two → review `done` → operation complete |
| **flowrider** | a piece's `surface` reaches the worker's rendered prompt **verbatim**, and two units on one spec file carry different `layer` values |
| **siegemaster** | walk marks `unmet` → fixer minted on those units → fixer `done` → back to the walk carrying only those → clean. Assert the return happened with **no `done` route declared**, and that an adversarial `unmet` reaches `fixAdversarial` and never `fixHappy` |
| **the two phases** | no `adversarial` work item is minted until every `happyWalk` piece has recorded, and it carries the instance and run id its `baselineFor` names |
| **ward gates** | a red mints a `repair` scoped to that family; the repair returns to the ward with no declared route; a spent `maxVisits` blocks; `wardFull` runs ONCE after every family has drained, never per cell |
| **the family graph** | nine codeweaver cells route to flowrider once, on the ninth. `empty` routes on when a fan-out produced no scopes. **A drained ledger mid-run must NOT derive `complete`** |
| **on-request steps** | a planner's `request` for `recipe` mints it and returns to that planner, with no route declared either way. Then the one that matters: a WORKER requesting one mid-piece resumes as a fresh work item carrying the same units, with the recipe names on it |
| **operational flows** | three NEGATIVE assertions, the hardest kind to remember: (1) an all-operational quest mints ZERO flowrider and ZERO siegemaster scopes — not "they complete cleanly", that they are never minted; (2) a RUNTIME flow carrying an operational NODE has that node's units absent from a flowrider scope — **the filter is per unit, not per flow**, and filtering only by `flowType` sends those units to a session that cannot settle them and blocks the gate forever; (3) a codeweaver reviewer marks an operational unit `met` with TREE STATE as evidence, never a test path |
| **the seam** | a glue node's units land on the LATER cell only, and appear as `contextUnitIds` on the earlier one |
| **sad paths** | a wall at every step, a spent `maxVisits`, a mid-run amendment, an orphaned step resumed |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete anything | story 24 |
| start an instance | story 23 |
| touch a sign-off field | story 26 |
