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

## BUILD

Two transformers in `packages/orchestrator/src/transformers/`.

### 1. current mark

```
{ quest, unitId } → { mark, evidence, toSettle?, workItemId, at } | null
```

`null` when no work item has ever been assigned it. **That is a real answer, not an error** — it means
"outstanding", and story 12 is what decides whether outstanding matters here.

### 2. the churn walk

```
{ quest, unitId } → Array<{ workItemId, step, mark, evidence, at }>, oldest first
```

Every work item that was assigned this unit, in order, with what it said. Story 27 renders this; it is
what makes a quest's history legible without reconstructing anything.

**"Was assigned" is derivable two ways and only one is right.** A work item's `observations[]` tells
you what it MARKED. Its assignment is what the router gave it, which after story 15 is recoverable from
its `pieceId` plus the plan, or from its inherited payload. **For this story, treat the observation set
as the assignment record** — a session that signals has marked every assigned unit (that is the gate),
so the two coincide for any work item that completed. Note in the JSDoc that a crashed work item is the
case where they differ, and that story 15 is where assignment becomes explicit.

---

## DONE WHEN

| Assert | |
|---|---|
| the four-work-item churn above reads back in order, every entry intact | and assert the SEQUENCE, not just the count |
| a unit no work item was assigned returns `null` | not a throw |
| **a unit assigned to a work item that never marked it reads as outstanding** | the case that separates the right rule from the wrong one |
| nothing in the quest is mutated by either transformer | they are pure. Assert the input object is unchanged |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| decide whether a unit SHOULD have been marked | story 12 |
| refuse a signal | story 14 |
| implement `invalidation` | story 17 writes the payload; story 15's router acts on it |
| read a sign-off field | story 26 retires those. They are still live and nothing here touches them |
