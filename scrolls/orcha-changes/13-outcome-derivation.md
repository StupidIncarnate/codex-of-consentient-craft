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
an environment wall, at any point       → outcome is `wall`   (checked FIRST — see BUILD)
no units assigned                       → the step declares its own word
any assigned unit marked `unmet`        → outcome is `unmet`
any assigned unit not marked at all     → outcome is `unmet`
every one marked `met` or `cant-meet`   → outcome is `done`
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

One contract and two transformers.

### The contract — this story owns it

```
packages/orchestrator/src/contracts/step-outcome/step-outcome-contract.ts
packages/orchestrator/src/contracts/step-outcome/step-outcome.stub.ts
packages/orchestrator/src/contracts/step-outcome/step-outcome-contract.test.ts
```

```ts
export const stepOutcomeContract = z.enum(['wall', 'unmet', 'done', 'empty']);

export type StepOutcome = z.infer<typeof stepOutcomeContract>;
```

**Nothing before this story declares one.** Story 05 spells the four words only as ROUTE KEYS inside
`agentFlowStatics`, where they are object keys under `as const` and never a value. This is the first
story that needs the word as a value, so it builds it, and story 15's router imports it.

**Declared worst first**, so `stepOutcomeContract.options` IS the precedence order and `foldOutcomes`
indexes it rather than carrying a second copy. A separate ordering array is a second source of truth
for one fact.

### The two transformers

```
packages/orchestrator/src/transformers/derive-outcome/derive-outcome-transformer.ts
packages/orchestrator/src/transformers/derive-outcome/derive-outcome-transformer.test.ts
packages/orchestrator/src/transformers/fold-outcomes/fold-outcomes-transformer.ts
packages/orchestrator/src/transformers/fold-outcomes/fold-outcomes-transformer.test.ts
```

```ts
export const deriveOutcomeTransformer = ({
  assignedUnitIds,
  observations,
  declaredWord,
  hitWall,
}: {
  assignedUnitIds: readonly UnitId[];
  observations: readonly UnitObservation[];
  declaredWord?: StepOutcome;
  hitWall: boolean;
}): StepOutcome

export const foldOutcomesTransformer = ({
  outcomes,
}: {
  outcomes: readonly StepOutcome[];
}): StepOutcome
```

`UnitObservation` is story 01's contract; `UnitId` is story 01's too. `hitWall` is required and
un-defaulted: a caller that forgets it is a step whose wall vanishes, and `boolean` with no default is
what makes that a compile error.

**`assignedUnitIds`, not the observation set.** Story 10 says which one a work item was handed and how
to resolve it; this transformer takes the answer, it does not re-derive it.

### The order the four checks run in, which is not the order they are written in

| # | Check | Result |
|---|---|---|
| 1 | `hitWall === true` | `wall`. **Before both throws** |
| 2 | `assignedUnitIds.length === 0` | `declaredWord` when present, else THROW (case A) |
| 3 | `declaredWord !== undefined` | THROW (case B) |
| 4 | otherwise | `unmet` if any assigned unit is unmarked or marked `unmet`, else `done` |

**The wall runs first, and that is a decision rather than an ordering accident.** An environment wall
is a fact about the machine, and refusing to report it because the record is incomplete leaves a quest
halted with the interesting half of the reason thrown away. A prompt bug that also hit a wall is still
a wall.

**An UNMARKED assigned unit derives `unmet`, not an error.** Story 14's gate is what refuses the
signal; this transformer is called on records that got past it and on records that did not, and a
throw here would make the gate's own diagnostic unreachable.

### `deriveOutcomeTransformer` throws twice, and both messages are fixed

**Case A — no units, no word.** A step that holds no units and declares nothing has said nothing.

```ts
throw new Error(
  `deriveOutcomeTransformer: no units were assigned and no declaredWord was given. A step holding no units is the one case that declares its own outcome — pass one of ${stepOutcomeContract.options.join(' | ')}.`,
);
```

**Case B — units AND a word.** A worker that says `done` while holding an `unmet` unit is making a
claim the record contradicts, and silently overruling it hides a prompt bug.

```ts
throw new Error(
  `deriveOutcomeTransformer: declaredWord '${String(declaredWord)}' was given alongside ${String(assignedUnitIds.length)} assigned units, which derive '${derived}'. A step that holds units does not declare its outcome — the record does. Unsettled units: ${contradicting.length === 0 ? 'none' : contradicting.join(', ')}. Mark every unit met or cant-meet and drop declaredWord.`,
);
```

`derived` is what check 4 would have returned. **`contradicting` is every assigned unit that is neither
`met` nor `cant-meet`** — the `unmet` ones and the unmarked ones together, because those are the two
shapes that make a `done` false and a reader needs both. It is legitimately empty when the record
agrees with the declaration, and the throw still fires: the rule is structural, and a step that holds
units may not declare an outcome even when it would have guessed right.

### `foldOutcomesTransformer` on an empty array returns `empty`

A step whose pieces all drained to nothing is exactly the `empty` case, and `empty` is the identity of
a worst-first fold. A throw there halts the router on a legal state.

---

## DONE WHEN

| Assert | |
|---|---|
| one `unmet` among nine `met` derives `unmet` | the gate's whole point. Ten `assignedUnitIds`, ten observations |
| all `met` derives `done` | |
| `met` + `cant-meet` derives `done` | `cant-meet` SETTLES a unit. This is the case people implement wrong |
| an assigned unit with NO observation derives `unmet` | not a throw. The gate is story 14's job |
| zero assigned units + `declaredWord: 'empty'` derives `empty` | the planner case |
| zero assigned units + `declaredWord: 'done'` derives `done` | the `repair` and `warpgate` case. The declared word is taken as given, whichever of the four it is |
| **zero assigned units, no declared word, `hitWall: false` THROWS** | case A. Assert on the message with `toThrow(...)` carrying the four words, not on the fact that it threw |
| **units assigned AND a declared word THROWS, and the message names the unsettled units** | case B. Fixture: three units, one `unmet`, `declaredWord: 'done'` — assert the message contains that unit's id |
| **case B still throws when the record AGREES** | three units all `met`, `declaredWord: 'done'`. The message reads `Unsettled units: none`. This is the row that stops "the declaration wins when it happens to be right" |
| `hitWall: true` with all nine `met` returns `wall` | a wall found after the last mark still walls |
| **`hitWall: true` with units assigned AND a `declaredWord` returns `wall` and does NOT throw** | the ordering decision above, pinned. Without this row the order is an accident |
| `hitWall: true` with zero units and no declared word returns `wall`, not case A's throw | same reason |
| the fold at every precedence pair | six pairs, and write all six: `wall`+`unmet`→`wall`, `wall`+`done`→`wall`, `wall`+`empty`→`wall`, `unmet`+`done`→`unmet`, `unmet`+`empty`→`unmet`, `done`+`empty`→`done`. Assert each in BOTH argument orders — a fold that reads `outcomes[0]` passes half of them |
| `foldOutcomesTransformer({ outcomes: [] })` returns `empty` | not a throw |
| `stepOutcomeContract.options` is exactly `['wall','unmet','done','empty']`, in that order | the fold indexes it. A re-ordering that looks cosmetic silently inverts the precedence |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| route anywhere | story 15 |
| refuse a signal | story 14 — this DERIVES a word; that REFUSES a call |
| classify a handler exit code | story 20 |
| resolve what a work item was ASSIGNED | story 10. `assignedUnitIds` arrives already resolved |
| touch `agentFlowStatics` | story 05 owns it. This story adds the contract its route keys are named after; it does not re-type them |
