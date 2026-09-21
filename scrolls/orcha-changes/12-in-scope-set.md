# 12 — the in-scope set, and what "outstanding" means

```
GOAL      Given a scope and a step, list the units that step is answerable for — and say
          which of them nothing is going to settle.
AFTER     10 (current mark) · 11 (the filter)
BEFORE    14 · 15 · 18
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus — the LIVE-work-item qualifier below is subtle and its absence deadlocks siege
```

---

## Two derivations, and both have a qualifier that is easy to drop

### 1. The in-scope set

```
{ quest, operationItemId, step } → UnitId[]
```

Every unit this scope owns, filtered by the step's declared scope from story 11.

**The family is not a parameter.** It is `operationItem.role` — `codeweaver`, `flowrider` or
`siegemaster` — which is the key `stepScopeStatics.byFamilyStep` is keyed on. A separate `family`
argument is a second way to ask a question the item already answers, and the two can disagree.

The scope's own unit set is what today's `get-qa-checklist` derives — the units on the flows this
operation item names, narrowed by its `packageNames`. **That derivation already exists and is correct.**
Reuse it; story 24 keeps it as `get-quest-work`'s internals precisely so it is not rewritten.

#### The reuse, spelled out — which function, what it takes, what it returns

`signoff-flow-outstanding-transformer.ts` holds the whole in-scope derivation for ONE flow, in
lines 65–91, followed by ONE line that is not in scope for you. Read it before writing anything.

```ts
signoffFlowOutstandingTransformer({
  flow,                    // Flow
  track,                   // keyof typeof signoffTrackEligibilityStatics.byTrack
  packagesAffected,        // readonly QuestPackageEntry[]  — defaults []
  packageNames,            // readonly PackageName[]        — defaults []
}): QaChecklistItemId[]
```

Inside it, in order, and what each line is worth to you:

| Lines | What it does | Your version |
|---|---|---|
| 65 | `const eligibility = signoffTrackEligibilityStatics.byTrack[track];` | `stepScopeStatics.byFamilyStep[family][step]`, with the no-scope fallback from story 11 |
| 69 | `const { signoffField } = eligibility;` | **drop.** Story 26 retires the field |
| 70–72 | reads `unitKinds`, `observableOrigins`, `verificationMethods` into three `Set`s | same three reads, off the step entry |
| 74 | `qaUnitEnumerateTransformer({ flow })` — `{ flow: Flow } → QaVerificationUnit[]`, the SINGLE enumeration | **CALL IT UNCHANGED.** Do not write a second enumerator: ids are derived from the graph, and a second derivation drifts silently |
| 75–81 | three `.filter`s: kind, then observable provenance, then `unit.verifyByReading === true ? 'reading' : 'test'` | the same three predicates, re-pointed at the step entry |
| 83–89 | `qaUnitsInPackageScopeTransformer({ flow, units, track, packagesAffected, packageNames }) → QaVerificationUnit[]` — the two PACKAGE narrowings | **CALL IT UNCHANGED, passing the family as `track`** — see below |
| 90 | `.filter((unit) => unit[signoffField] === undefined)` | **drop. This one line is the whole difference** — it is the sign-off half, and the in-scope set is everything above it |
| 91 | `.map((unit) => unit.id)` | same. `QaVerificationUnit['id']` IS the `UnitId` — see story 10's OPEN |

#### Two calls you make unchanged, and one narrowing you do NOT reuse

**`qaUnitsInPackageScopeTransformer` takes `track`, and the family name IS a valid track key.** Its
three keys are exactly `codeweaver | flowrider | siegemaster`, and all three carry the same nine
`packageTypes` (`signoff-track-eligibility-statics.ts:125–135` and the two entries below it), so
passing the family gives the identical answer. **Do not edit that file.** Story 26 owns re-pointing its
line 61 read at `stepScopeStatics`; editing it here breaks `signoffFlowOutstandingTransformer`, which
is still live and still shares it. This story stays additive, exactly as story 11 does.

**`operationSignoffScopeTransformer` you READ, and do not call.**

```ts
operationSignoffScopeTransformer({ quest, operationItem })
  : { track, flows: readonly Flow[], packageNames: readonly PackageName[] } | null
```

It does the flow narrowing in two steps — by the TRACK's `flowTypes` (lines 65–67), then by the item's
own `flowIds` (lines 72–73). The second step is yours verbatim. **The first is not**, and the reason is
the one difference between a track and a step in story 11's table: `siegemaster`'s track carries
`flowTypes: ['runtime', 'operational']` (line 162), while `happyWalk` and `adversarial` carry
`['runtime']` alone. Call this transformer and an operational flow's siege units come back in a scope
story 11 deliberately excludes them from.

So do the flow narrowing yourself, in four lines, off `stepScopeStatics`. Three things from that file
carry over unchanged and should not be rediscovered:

- **`null` is a real answer, not an error.** Lines 52–58 return `null` for any role outside the three —
  `spiritmender` and `warpgate` are measured on nothing. Return `[]` for that case; do not throw.
- **`flowScope` is never indexed.** Line 72 narrows on `operationItem.flowIds` unconditionally; the
  field is described in the header and read only by tests. There is nothing to re-point — see story 11.
- **An item declaring NO `flowIds` matches no flow**, which is what keeps a flow-less quest and a
  track-less item completable. Keep that, and do not "fix" it into a whole-quest scope.

`qaChecklistBuildTransformer` is NOT in this chain. It RENDERS (`label`, `checkSurface`, `paths`,
truncation) on top of the same enumeration and calls `signoffFlowOutstandingTransformer` for its
`remainingItemIds` at line 139. Reading it tells you what the units look like to a session; it is not
the derivation.

**Without the story-11 filter, every flowrider reviewer blocks forever** on a `(read-check)` unit
nobody in that family can settle. That is not a hypothetical; it is why story 11 exists.

### 2. What is OUTSTANDING

```
{ quest, plan, operationItemId, step } → UnitId[]
```

The in-scope units that **nothing is going to settle**. A unit is outstanding only when all three hold:

| | Without it |
|---|---|
| **the record does not settle it** — its current mark (story 10) is `null` or `unmet` | a unit a completed work item marked `met` reads as outstanding forever, and the scope never drains |
| **no UNSTARTED plan piece claims it** | you re-mint work a planner already scheduled |
| **no LIVE work item is assigned it** | two siege walkers running at once each read the other's units as unclaimed. The happy walker then derives `unmet` on an off-map family the adversarial walk is mid-way through, and mints a happy fixer for it |

**That third qualifier is the one that will be dropped**, because it reads as an optimisation and is
not. Both siege walkers are `role: 'reviewer'`, so both are assigned the full scope; a walker
re-marking what its own fixer just changed is correct, but two walkers at once must not each see the
other's units as abandoned.

**"Claims" means an UNSTARTED piece, and the word carries the whole qualifier.** A piece is a forecast
and is never removed from the plan, so "any piece names it" would keep a unit out of the outstanding
set for the rest of the quest — including after that piece's work item came back `unmet`, which is the
one case the loop's forward motion depends on. A piece is STARTED when some work item carries its id in
`workItem.pieceId` (story 02). So:

```
claimed  =  the piece names the unit in `assignedUnitIds`
            AND no work item carries that `pieceId`
```

---

## BUILD

Two transformers in `packages/orchestrator/src/transformers/`, one per derivation above.

```
step-in-scope-units/step-in-scope-units-transformer.ts
step-in-scope-units/step-in-scope-units-transformer.test.ts
step-outstanding-units/step-outstanding-units-transformer.ts
step-outstanding-units/step-outstanding-units-transformer.test.ts
```

```ts
export const stepInScopeUnitsTransformer = ({
  quest,
  operationItemId,
  step,
}: {
  quest: Quest;
  operationItemId: OperationItemId;
  step: StepName;
}): UnitId[]

export const stepOutstandingUnitsTransformer = ({
  quest,
  plan,
  operationItemId,
  step,
}: {
  quest: Quest;
  plan: WorkPlan;
  operationItemId: OperationItemId;
  step: StepName;
}): UnitId[]
```

`WorkPlan` is story 07's `packages/orchestrator/src/contracts/work-plan/` contract.
`stepOutstandingUnitsTransformer` calls `stepInScopeUnitsTransformer` and narrows; it does not
re-derive.

**An `operationItemId` that resolves to no item on `quest.operations` THROWS**, in this repo's voice:

```
stepOutstandingUnitsTransformer: quest '<questId>' holds no operation item '<operationItemId>'
```

An absent item is a caller bug, and returning `[]` for it is indistinguishable from a scope that is
genuinely empty — which is exactly the reading that turns a gate off silently.

### "Live" — and the two strings the story cannot spell

**`isTerminalWorkItemStatusGuard` from `@dungeonmaster/shared/guards` is the answer.** A work item is
LIVE when `!isTerminalWorkItemStatusGuard({ status: workItem.status })`.

There are SIX statuses, not four. `workItemStatusContract` is
`['pending','queued','in_progress','complete','failed','skipped']`, and
`work-item-status-metadata-statics.ts` is the source of truth for the flags —
`queued` is live (`isTerminal: false`, and `isActive: true`: deps satisfied, awaiting a slot), and
`skipped` is terminal. A `pending | in_progress` reading loses `queued`, which is exactly a walker
between dispatch and start.

**And you may not write the comparison by hand even if you get the list right.** This repo's own lint
rule `rule-ban-quest-status-literals-broker` refuses it:

> Do not compare .status to the work-item-status literal '{{literal}}'. Use the appropriate shared
> guard (e.g., isActiveWorkItemStatusGuard, isCompleteWorkItemStatusGuard, isTerminalWorkItemStatusGuard, etc.).

It also refuses an inline array or `Set` of status literals. There is one guard for this and it is the
one named above.

---

## OPEN

**The RECORD qualifier is derived, not quoted.** The design plan's §8 states two qualifiers
("a unit is outstanding only when NO plan piece claims it and NO live work item is assigned it") and
does not name the record at all. The record qualifier is what makes the two `DONE WHEN` rows about a
`complete` work item — one marked `unmet`, one marked `met` — both come out right at the same time, so
it is required by this story as written. **If the design intends `outstanding` to ignore the record,
the conductor must say so and those two rows have to change.** Do not resolve it by weakening a row.

---

## DONE WHEN

| Assert | |
|---|---|
| a codeweaver scope's in-scope set holds its cell's units and no sibling cell's | the `packageNames` narrowing. Fixture: two nodes on one flow, one tagged `packages: ['web']`, one `packages: ['server']`, and the operation item declares `packageNames: ['web']`. **Tag both nodes** — `qa-units-in-package-scope-transformer.ts:87` keeps an UNTAGGED node's units in for every cell, so an untagged fixture passes without exercising the filter |
| a `(read-check)` unit is in codeweaver `review`'s set and out of flowrider `review`'s | story 11's filter, exercised end to end. The unit is an observable carrying `verifyByReading: true` |
| an operation item whose role is `spiritmender` returns `[]` | `operationSignoffScopeTransformer` returns `null` there. Not a throw |
| an `operationItemId` on no ledger THROWS, and the message names the id | the message above, verbatim |
| **a unit an unstarted plan piece claims is NOT outstanding** | qualifier two |
| **the SAME unit, once a work item carries that piece's `pieceId`, is no longer shielded by the piece** | the word "unstarted" doing its job. One field changed between the two assertions |
| **a unit a LIVE work item is assigned is NOT outstanding** | qualifier three. The two-walker fixture below |
| **a unit no piece claims and no live item holds IS returned by the same call** | run it in the SAME test as the row above. Without a positive, a transformer that returns `[]` passes both |
| a unit whose work item is `complete` and marked `unmet` IS outstanding | the loop's forward motion depends on this |
| a unit whose work item is `complete` and marked `met` is NOT outstanding | qualifier one |
| a unit whose work item is `queued` is NOT outstanding | the status the four-word reading loses |
| both transformers are pure | hold `JSON.stringify(quest)` before the call and `toBe` it after |

### The two-walker fixture, in full

One quest. One `siegemaster` operation item `op-siege-1`, `flowIds: ['flow-send']`,
`packageNames: []`. One flow `flow-send` with `flowType: 'runtime'`.

**`op-siege-1` and `wi-happy-1` are labels for reading, not literals.** `operationItemIdContract` and
`questWorkItemIdContract` are both `z.string().uuid()`, so take real ids from `OperationItemStub` and
`WorkItemStub`. `pieceId` and every `UnitId` are free-form branded strings and may be written as shown.

At `step: 'adversarial'` the step scope is `unitKinds: ['off-map']` (story 11), so the in-scope set is
exactly the seven `flow-send:off-map:<family>` units and nothing else. That is what makes the fixture
readable — no terminals or branches to filter past.

| | |
|---|---|
| plan piece `pc-happy-1` | `step: 'happyWalk'`, `assignedUnitIds: ['flow-send:off-map:perf']` |
| work item `wi-happy-1` | `pieceId: 'pc-happy-1'`, `step: 'happyWalk'`, `status: 'in_progress'`, `payload: { units: [{ unitId: 'flow-send:off-map:perf' }] }`, `observations: []` |
| plan piece `pc-adv-1` | `step: 'adversarial'`, `assignedUnitIds: ['flow-send:off-map:hostile-input']` |
| nothing at all claims | `flow-send:off-map:staleness` |

```ts
stepOutstandingUnitsTransformer({ quest, plan, operationItemId: 'op-siege-1', step: 'adversarial' })
```

Two assertions on that one result:

- it does **not** contain `flow-send:off-map:perf` — a live `happyWalk` holds it
- it **does** contain `flow-send:off-map:staleness` — nothing claims it, and this is what proves the
  filter rather than an empty return

Then the control, one field changed: set `wi-happy-1.status` to `complete` and give it
`observations: [{ unitId: 'flow-send:off-map:perf', mark: 'unmet', evidence: '…', at: '…' }]`.
`flow-send:off-map:perf` now comes back. **That pair is the test** — either half alone proves nothing
about the qualifier.

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| refuse a signal | story 14 |
| mint anything | story 15 |
| decide a step's OUTCOME | story 13 |
| edit `signoff-flow-outstanding/`, `signoff-outstanding/`, `operation-signoff-scope/` or `qa-units-in-package-scope/` | story 26. All four are live and green until then. **This story ADDS two transformers beside them** |
| write a second unit enumerator | `qaUnitEnumerateTransformer` is the single one. Ids are derived from the graph, so a second derivation drifts and nothing reports it |
| resolve a work item's assignment yourself | story 10 owns that reading — `payload.units[]`, falling back to `observations[]`. Call it |
