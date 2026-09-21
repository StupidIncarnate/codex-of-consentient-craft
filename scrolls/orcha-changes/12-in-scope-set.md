# 12 — the in-scope set, and what "outstanding" means

```
GOAL      Given a scope and a step, list the units that step is answerable for — and say
          which of them nothing is going to settle.
AFTER     10 (current mark) · 11 (the filter)
BEFORE    14 · 15 · 18
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus — the second qualifier below is subtle and its absence deadlocks siege
```

---

## Two derivations, and both have a qualifier that is easy to drop

### 1. The in-scope set

```
{ quest, operationItemId, step } → UnitId[]
```

Every unit this scope owns, filtered by the step's declared scope from story 11.

The scope's own unit set is what today's `get-qa-checklist` derives — the units on the flows this
operation item names, narrowed by its `packageNames`. **That derivation already exists and is correct.**
Reuse it; story 24 keeps it as `get-quest-work`'s internals precisely so it is not rewritten. The chain
is:

| | |
|---|---|
| `transformers/qa-checklist-build/qa-checklist-build-transformer.ts` | renders ONE flow's atomic units — every terminal, every labelled decision edge, every observable |
| `transformers/qa-units-in-package-scope/qa-units-in-package-scope-transformer.ts` | applies the two PACKAGE narrowings |
| `transformers/operation-signoff-scope/operation-signoff-scope-transformer.ts` | resolves ONE operation item to its exact scope. **It reads `signoffTrackEligibilityStatics` by TRACK today** — this is where the step-keyed read replaces it |

**Without the story-11 filter, every flowrider reviewer blocks forever** on a `(read-check)` unit
nobody in that family can settle. That is not a hypothetical; it is why story 11 exists.

### 2. What is OUTSTANDING

```
{ quest, plan, operationItemId, step } → UnitId[]
```

The in-scope units that **nothing is going to settle**. A unit is outstanding only when BOTH hold:

| | Without it |
|---|---|
| **no plan piece claims it** | you re-mint work a planner already scheduled |
| **no LIVE work item is assigned it** | two siege walkers running at once each read the other's units as unclaimed. The happy walker then derives `unmet` on an off-map family the adversarial walk is mid-way through, and mints a happy fixer for it |

**That second qualifier is the one that will be dropped**, because it reads as an optimisation and is
not. Both siege walkers are `role: 'reviewer'`, so both are assigned the full scope; a walker
re-marking what its own fixer just changed is correct, but two walkers at once must not each see the
other's units as abandoned.

---

## BUILD

Two transformers in `packages/orchestrator/src/transformers/`, one per derivation above.

"Live" means a work item whose status is `pending` or `in_progress` — not `complete`, not `failed`.
Take the status vocabulary from `workItemStatusContract`; do not spell the strings.

---

## DONE WHEN

| Assert | |
|---|---|
| a codeweaver scope's in-scope set holds its cell's units and no sibling cell's | the package narrowing |
| a `(read-check)` unit is in codeweaver `review`'s set and out of flowrider `review`'s | story 11's filter, exercised end to end |
| **a unit a plan piece claims is NOT outstanding** | qualifier one |
| **a unit a LIVE work item is assigned is NOT outstanding** | qualifier two. Build the two-walker fixture explicitly: `happyWalk` live holding `offmap:perf`, `adversarial` asking what is outstanding, and `offmap:perf` must NOT come back |
| a unit whose live work item is `complete` and marked `unmet` IS outstanding | the loop's forward motion depends on this |
| both transformers are pure | assert the quest object is unchanged |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| refuse a signal | story 14 |
| mint anything | story 15 |
| decide a step's OUTCOME | story 13 |
