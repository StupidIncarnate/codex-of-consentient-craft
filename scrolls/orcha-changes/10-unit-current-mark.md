# 10 — what a unit's mark actually IS

```
GOAL      Answer "what is this unit's state right now?" and "what happened to it?" from
          the work item record, with nothing overwritten and nothing reconstructed.
AFTER     01 (observations) · 02 (work items hold them)
BEFORE    12 · 14 · 15 · 18 · 27
PACKAGE   @dungeonmaster/orchestrator
MODEL     opus — the rule is one sentence and it is easy to implement wrong
```

---

## The rule, and the wrong version of it

**A unit's current mark is the one on the most recent work item that was ASSIGNED it.**

The wrong version — *the most recent mark anywhere* — passes a naive test and fails in production.
Here is the case that separates them:

```
work item 1   assigned [obs-3, obs-7]   marks obs-3 met, obs-7 met
work item 2   assigned [obs-7]          marks obs-7 unmet
                                        → obs-3 is STILL met
```

Under "most recent mark anywhere" you scan backwards and the last mark you see for `obs-3` is work item
1's, so both readings agree here. Now:

```
work item 3   assigned [obs-3]          marks obs-3 unmet
work item 4   assigned [obs-7]          marks obs-7 met
                                        → obs-3 is unmet, from work item 3
```

The readings still agree. **They diverge when a work item is assigned a unit and dies without marking
it** — which is exactly what the signal gate exists to prevent but cannot prevent for a crashed
session. Under the right rule that unit reads as unmarked and gets re-minted. Under the wrong one it
reads as whatever the last completed session said, and the crash is invisible.

So: **assignment is the key, not the mark.** Implement it that way even though the two agree on the
happy path.

---

## Why nothing overwrites

Each session gets a FRESH set — one entry per unit it was assigned — and that set freezes when the
step signals. A re-mint writes its own set of the same units from scratch. It does not amend its
predecessor's.

| Question | Answer |
|---|---|
| What is a unit's current state? | the mark on the most recent work item that was ASSIGNED it |
| What happened to it? | walk the work items in order — that is the churn |
| Does anything overwrite? | **no.** No work item's set is ever touched by another |

**This is what deletes the per-unit reset lever.** Flowrider's rework rule today is the sharpest
constraint on any verdict store: *"Any unit it named that you already signed: overwrite that sign-off
from the new `PROVED` line, or clear it with `flowriderSignoff: null`. A `confirmed` your reviewer just
rejected is the one thing that must not survive the loop."* With three shared, overwritable fields that
needs an explicit null-out, written correctly, every time. With a set per work item there is nothing to
clear: the reviewer's own record says `unmet`, its work item is the most recent one assigned that unit,
so that IS the state — and the rejected `met` stays readable on the work item that made it, which is
where it belongs.

---

## What "was ASSIGNED it" reads, concretely

**This section is the shared fact for stories 12, 14, 15 and 18. They reference it by number rather
than restating it.**

A work item's assignment is `workItem.payload.units[]`, mapped to `unitId`. Story 02 adds `payload` to
`workItemContract` as `z.record(z.unknown())`; story 07 gives `units[]` its per-family shape and pins it
1:1 with the piece's `assignedUnitIds`. Both land before this story, so the field is there to read.

`payload` is an untyped record on the work item, so **narrow it with a Zod parse, never a cast** — the
repo bans `as unknown as` on a shape mismatch. One small contract does it:

```ts
// packages/orchestrator/src/contracts/work-item-assignment/work-item-assignment-contract.ts
// + work-item-assignment.stub.ts + work-item-assignment-contract.test.ts
export const workItemAssignmentContract = z.object({
  units: z.array(z.object({ unitId: unitIdContract }).passthrough()).default([]),
});
```

`.passthrough()` because each family's `units[]` entry carries more (`layer`, `surface`, `assert`,
`failsIf`), and this contract is asserting one key rather than describing the payload.

**Resolution order, and the fallback is not optional:**

| Read | When |
|---|---|
| `workItemAssignmentContract.safeParse(workItem.payload)` → `units[].unitId` | whenever the parse succeeds |
| the work item's own `observations[].unitId` | when `payload` is absent, or the parse fails |

The fallback covers a work item minted before the router writes payloads (story 15), every work item
already on disk in an existing `quest.json`, and every chat role. **Take the UNION of the two** — a
session that marked a unit it was not handed still marked it, and dropping that would lose a real
record on the argument that it was not forecast.

**Why not "the observation set alone".** That is the WRONG rule this story's first section argues
against, dressed as an implementation shortcut: a work item that was assigned a unit and died without
marking it has no observation for it, so the walk cannot see it, and the unit reads as if nothing was
ever assigned it. The `null` the current-mark transformer returns then happens to be the right answer —
but the churn walk silently loses that session's row, which is the one row story 27 exists to show.
Reading `payload.units[]` costs one contract and gets the right rule now.

**Nothing in these two transformers changes when story 15 lands.** Story 15 is where the router starts
WRITING `payload.units[]` onto a mark-minted work item; this story is where it is read, and the reader
is already correct for both producers.

---

## BUILD

Two transformers, plus the two return contracts and the assignment contract above — three contract
folders in all, each with its `.stub.ts` and `-contract.test.ts`.

**All three go in `packages/orchestrator/src/contracts/`, not in `shared`.** The only other reader is
story 18's responder, which is in this package, and story 27's churn view derives its own from
`quest.workItems[].observations[]`, which `shared` already exports — `@dungeonmaster/web` depends on
`shared` alone and never on this package. No shape crosses a package line, so none needs to move.

### 1. current mark

```
packages/orchestrator/src/transformers/unit-current-mark/unit-current-mark-transformer.ts
packages/orchestrator/src/transformers/unit-current-mark/unit-current-mark-transformer.test.ts
packages/orchestrator/src/contracts/unit-current-mark/unit-current-mark-contract.ts
packages/orchestrator/src/contracts/unit-current-mark/unit-current-mark.stub.ts
packages/orchestrator/src/contracts/unit-current-mark/unit-current-mark-contract.test.ts
```

```ts
export const unitCurrentMarkContract = z.object({
  unitId: unitIdContract,
  mark: unitMarkContract,
  evidence: z.string().min(1).brand<'MarkEvidence'>(),
  toSettle: z.string().min(1).brand<'ToSettleInstruction'>().optional(),
  workItemId: questWorkItemIdContract,
  step: stepNameContract.optional(),
  at: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type UnitCurrentMark = z.infer<typeof unitCurrentMarkContract>;
```

**The three brand literals must be spelled exactly as story 01 spells them** — `MarkEvidence`,
`ToSettleInstruction`, `IsoTimestamp`. Story 01 declares those fields INLINE inside
`unitObservationContract` and exports no `markEvidenceContract` to import, and that contract carries a
`.superRefine`, which makes it a `ZodEffects` with no `.shape` to reach through. A Zod brand is
structural on the literal, so a re-declaration under the same literal is assignable; a typo in the
literal is a nominal type nothing satisfies, and it surfaces at the first assignment rather than here.

```ts
export const unitCurrentMarkTransformer = ({
  quest,
  unitId,
}: {
  quest: Quest;
  unitId: UnitId;
}): UnitCurrentMark | null
```

Where each field comes from:

| Field | Source |
|---|---|
| `unitId`, `mark`, `evidence`, `toSettle`, `at` | the OBSERVATION, verbatim. `at` is the moment the unit was settled, not the moment the session ended |
| `workItemId`, `step` | the work item holding that observation |

`step` is `.optional()` because a chat-role work item carries none (story 02).

**It returns `null` in TWO cases, and the second is the whole point of the rule:**

| `null` when | Means |
|---|---|
| no work item was ever assigned this unit | nobody has been handed it yet |
| the most recent work item assigned it holds no observation for it | that session was handed it and died without marking it |

Both read as "outstanding". **Neither is an error.** Story 12 decides whether outstanding matters in a
given scope.

### 2. the churn walk

```
packages/orchestrator/src/transformers/unit-mark-churn/unit-mark-churn-transformer.ts
packages/orchestrator/src/transformers/unit-mark-churn/unit-mark-churn-transformer.test.ts
packages/orchestrator/src/contracts/unit-mark-churn-entry/unit-mark-churn-entry-contract.ts
packages/orchestrator/src/contracts/unit-mark-churn-entry/unit-mark-churn-entry.stub.ts
packages/orchestrator/src/contracts/unit-mark-churn-entry/unit-mark-churn-entry-contract.test.ts
```

```ts
export const unitMarkChurnEntryContract = z.object({
  workItemId: questWorkItemIdContract,
  step: stepNameContract.nullable(),
  // `.nullable()`, not `.optional()` — a work item assigned this unit that never marked it is
  // exactly the row this walk exists to show, so the entry is emitted with an explicit null
  // rather than dropped.
  mark: unitMarkContract.nullable(),
  evidence: z.string().min(1).brand<'MarkEvidence'>().nullable(),
  toSettle: z.string().min(1).brand<'ToSettleInstruction'>().nullish(),
  at: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type UnitMarkChurnEntry = z.infer<typeof unitMarkChurnEntryContract>;
```

```ts
export const unitMarkChurnTransformer = ({
  quest,
  unitId,
}: {
  quest: Quest;
  unitId: UnitId;
}): UnitMarkChurnEntry[]
```

Oldest first. Every work item that was assigned this unit, in order, with what it said. Story 27c
renders this; it is what makes a quest's history legible without reconstructing anything.

**`toSettle` rides on the entry.** A `cant-meet` without its instruction renders as a dead end with no
owner, which is the exact failure story 01's refinement exists to prevent — and this walk is the
surface a human reads it off.

`at` on an unmarked entry falls back to `workItem.completedAt ?? workItem.createdAt` — a crashed
session has no observation to take a time from, and a row with no time cannot be placed in the
sequence.

### Ordering — array position, never a timestamp

**Walk `quest.workItems` in ARRAY ORDER and take the LAST match.** That order is append order: every
mint path spreads and appends (`quest-advance-broker.ts:93` — `workItems: [...quest.workItems, newWorkItem]`,
and the same shape in `orchestration-merge-responder.ts:150`, `quest-hydrate-broker.ts:161`,
`orchestration-start-responder.ts:132`). Nothing sorts or re-orders the array.

**Do not sort by `createdAt`.** A parallel batch is minted inside one persist and shares a timestamp,
so a sort over it is unstable and "most recent" becomes whichever way the engine happened to compare.

---

## DONE WHEN

| Assert | |
|---|---|
| the four-work-item churn above reads back in order, every entry intact | build it as wi1 `met` → wi2 `met` → wi3 `unmet` → wi4 `met` on `obs-3`, and assert the SEQUENCE — `['met','met','unmet','met']` — not just the count |
| a unit no work item was assigned returns `null` | not a throw |
| **a unit assigned to a work item that never marked it returns `null`** | fixture: `wi1` with `payload: { units: [{ unitId: 'obs-3' }] }` and `observations: []`. This is the case that separates the right rule from the wrong one — under "observation set is the assignment" the transformer cannot see `wi1` at all |
| the same fixture emits a churn entry for `wi1` with `mark: null` | the crashed session is VISIBLE. This is the assertion the wrong rule fails |
| **an unmarked assignment on the LATEST work item beats a `met` on an earlier one** | fixture: `wi1` marks `obs-3` `met`; `wi2` is assigned `obs-3` and marks nothing. `unitCurrentMarkTransformer` returns `null`, not `wi1`'s `met`. Assignment is the key, not the mark |
| a work item whose `payload` is absent still contributes its `observations[]` | the fallback. Every quest.json on disk is this case |
| a work item whose `payload` holds no `units` key parses and contributes nothing from it | `.default([])` on the contract, not a throw |
| nothing in the quest is mutated by either transformer | they are pure. Hold `JSON.stringify(quest)` before the call and `toBe` it after |

---

## OPEN

**`UnitId` has two spellings in the chain and only one can be right.** The code derives a unit id as
`<flowId>:<kind>:<localId>` — `qa-checklist-item-id-contract.ts:23` enforces exactly three kebab
segments, and `qa-unit-enumerate-transformer.ts:54` builds `` `${flowId}:terminal:${String(node.id)}` ``.
Story 01's `unitIdContract` is a free-form `z.string().min(1)`, so those ids parse — but its own table
gives bare local ids as examples (`scan-finds-every-path`, `forward-unchanged`) and its
`offMapUnitId({ family })` helper returned `offmap:hostile-input`, where the enumerator returns
`<flowId>:off-map:hostile-input`.

**Two spellings for one off-map unit is a silently unmatched unit, not a type error.** Every story
downstream that joins an observation to an enumerated unit — 12, 14, 18, 27 — joins on string equality.

Every `UnitId` this story reads or writes is the enumerator's three-segment form. **The conductor must
**SETTLED — story 01 retired the helper.** No such builder exists for the real shape either:
every call site that needs one writes the template literal inline, because it always has the
`flowId` in scope already. `unitIdContract` validates the three-segment shape with the same regex
`qaChecklistItemIdContract` already uses.

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| decide whether a unit SHOULD have been marked | story 12 |
| refuse a signal | story 14 |
| implement `invalidation` | story 17 writes the payload; story 15's router acts on it |
| read a sign-off field | story 26 retires those. They are still live and nothing here touches them |
| write `payload.units[]` onto anything | story 15. This story only reads it |
