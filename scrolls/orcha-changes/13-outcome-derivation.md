# 13 — marks become one of four words

```
GOAL      A step's outcome is DERIVED from its record, not declared by the agent — except
          where the step holds no units, which is the one case it declares its own.
AFTER     05 (the four words are in the graph) · 10
BEFORE    15
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

---

## `done` is a fact about the record, not a claim

That sentence is the whole story. An agent does not get to say it finished while leaving work on the
floor.

```
any assigned unit marked `unmet`        → outcome is `unmet`
every one marked `met` or `cant-meet`   → outcome is `done`
no units assigned                       → the step declares its own word
an environment wall, at any point       → outcome is `wall`
```

**The "no units assigned" line covers four real cases**, and without it two of them are unreachable:

| | Why it holds no units |
|---|---|
| a `planner` | by role. It cuts work; it does not settle units |
| `repair` (spiritmender) | it fixes what a ward gate named. There are no units in a ward failure |
| `warpgate` | it merges. There are no units in a merge |
| an `adversarial` piece allocated no family | there is nothing to measure |

A `kind: 'deterministic'` step is outside this entirely — its outcome is its handler's exit code,
classified in story 20.

---

## The batch fold

Ordered worst first: **`wall` > `unmet` > `done` > `empty`.**

```
{ outcomes: Outcome[] } → Outcome
```

**The fold is PER STEP, not per batch**, and that distinction is the whole reason this is its own
function rather than a line inside the router. A step's pieces can run across several batches; every
piece at that step folds to that step's outcome and takes that step's routes.

Fold across a mixed batch instead and an adversarial `unmet` lands at `fixHappy`, which never measured
it. Story 08 makes a mixed batch impossible at write time, and this fold is what makes it harmless if
one ever gets through.

---

## BUILD

Two transformers.

```
deriveOutcome  { assignedUnitIds, observations, declaredWord?, hitWall } → Outcome
foldOutcomes   { outcomes: Outcome[] }                                   → Outcome
```

**`deriveOutcome` must REFUSE a `declaredWord` from a step that holds units**, rather than ignoring
it. A worker that says `done` while holding an `unmet` unit is making a claim the record contradicts,
and silently overruling it hides a prompt bug. Throw, and name the units that contradict the claim.

---

## DONE WHEN

| Assert | |
|---|---|
| one `unmet` among nine `met` derives `unmet` | the gate's whole point |
| all `met` derives `done` | |
| `met` + `cant-meet` derives `done` | `cant-meet` SETTLES a unit. This is the case people implement wrong |
| zero assigned units + `declaredWord: 'empty'` derives `empty` | the planner case |
| **zero assigned units and NO declared word throws** | a step that holds no units and declares nothing has said nothing |
| **units assigned AND a declared word throws, naming the contradicting units** | not "the declaration wins", not "the record wins silently" |
| `hitWall` beats everything, including all-`met` | a wall found after the last mark still walls |
| the fold at every precedence pair | six pairs. Write all six |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| route anywhere | story 15 |
| refuse a signal | story 14 — this DERIVES a word; that REFUSES a call |
| classify a handler exit code | story 20 |
