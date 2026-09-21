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

---

## The nineteen checks

| Check | What a failure means |
|---|---|
| `operationItemId` matches the submitting work item's own `operations/<id>` ref | a planner writing into another scope's plan |
| every `piece.id` is unique within the file | two work items resolve the same `pieceId` |
| every `piece.step` exists in THIS family's step graph | a renamed or invented step — dispatch would fail later, with no session to blame |
| every `assignedUnitIds` and `contextUnitIds` entry resolves to a real unit on the quest — an observable id, a terminal node id, a labelled edge id, or `offmap:<family>` | the commonest typo, and the one that silently shrinks coverage |
| every **assigned** unit is **in scope** for this operation item. Context units are exempt | a planner claiming another cell's work, while a seam's far half stays legal |
| no unit is claimed by two pieces in the same batch | two sessions marking the same unit concurrently |
| every `flowId` referenced resolves in `quest.flows[]` | a stale flow id after a spec edit |
| every `packageName` resolves in `quest.packagesAffected[]` | a package nobody declared |
| every `payload.files[].path` sits under a package this scope owns | a piece reaching into a sibling cell's tree |
| no two pieces in one batch name the same file path | the batch predicate, checkable by intersection |
| `payload.units[]` is 1:1 with the piece's `assignedUnitIds` | a dropped terminal or edge — invisible otherwise |
| every `observableTarget` resolves to the node or edge that unit actually hangs on | a mark written onto the wrong element |
| a `browser`-layer piece count per batch is within the step's `maxConcurrent` | the load cap. **An early warning only** — see below |
| **every piece in one batch names the SAME `step`** | a batch mixing steps has no single outcome to fold to and no single set of routes to take. This is how the phase order is enforced at write time rather than discovered at dispatch |
| **every `adversarial` piece names a `baselineFor` resolving to a `happyWalk` piece in an EARLIER batch** | an absence claim with nothing behind it. "Earlier batch" is what catches the interleaved shape a planner would otherwise write |
| `offMapFamily` is one of the seven, and no family is allocated twice | a repeated family destroys the first round's coverage |
| every `plannerMarks` entry is `cant-meet` with a `toSettle`, on a unit no piece claims | the planner's one mark authority, bounded |
| every `recipeId` a piece names is recorded on that flow AND carries the run id that proved it | a walker handed a seed that does not exist, or one that rotted while nobody was using it |
| a walk piece whose path needs a seeded system names a recipe | the silent version: a walker inventing its own setup, differently each time |

**Two of these are worth more than the rest.** The 1:1 `payload.units[]` check catches a dropped
terminal *at write time, before a session exists* — otherwise a unit silently never gets built and
nothing notices until the in-scope gate blocks at the end. And the in-scope check is what stops a
planner quietly widening its own cell.

**The `maxConcurrent` row can only ever be a warning, and the reason is structural:** a mark-minted
piece is by definition not in the plan. Three walkers marking `unmet` mint three fixers outside any
declared batch. The ROUTER enforces the cap (story 15); this check is an early heads-up at plan time.

---

## Reject the whole plan, never a piece

A partially-accepted plan is a coverage hole with no owner. The planner gets the validation error,
fixes it, and resubmits inside the same session — the same shape as the signal gate, and for the same
reason.

**The error message has to name the piece id and the check.** A planner has to act on it inside the
same turn, and "invalid plan" gives it nothing to act on.

---

## DONE WHEN

**One failing case per check, nineteen in total**, each asserting the refusal AND that the message
names the offending piece. Then one valid plan per family, accepted.

Use the worked examples as fixtures if you want realistic shapes — the design plan
(`scrolls/orchestrator-step-engine-plan.md`, "Three full planner outputs") has three cut from a real
quest with real ids. You do not need them; hand-built fixtures are fine, and smaller.

| The case most likely to be written wrong | |
|---|---|
| the in-scope check | assert that an ASSIGNED unit out of scope is refused **and a CONTEXT unit out of scope is allowed**. A test that only covers the first half will pass against an implementation that rejects both, and that implementation breaks every seam |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| build the MCP tool | story 17 |
| read or write the file | story 09 |
| enforce `maxConcurrent` for real | story 15 |
