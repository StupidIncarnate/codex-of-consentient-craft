# 11 — which units a step is measured over

```
GOAL      A step declares the SCOPE its family owns, so the in-scope set can be filtered
          by it. This is half of an existing statics, re-keyed — and the half that must
          NOT be deleted with the sign-off tracks.
AFTER     05 (steps exist to key it onto)
BEFORE    12 · 14 · 18 · 26
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**This story is here, ahead of the retirement in story 26, to make one thing impossible:** deleting
`signoffTrackEligibilityStatics` wholesale. It does two jobs that read as one, and retiring both would
break every flowrider run in a way that only shows up as a quest stalling forever.

---

## The two jobs, and only one of them retires

Read `packages/orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts`
before writing anything.

| Job | Fate |
|---|---|
| name the three sign-off FIELDS and which track owns which | **retires** in story 26, with the fields |
| SCOPE which units a track is measured over — `flowTypes`, `verificationMethods`, `unitKinds`, `packageScope` | **survives**, re-keyed from track onto STEP. That is this story |

### Why deleting the scoping half breaks everything

`verificationMethods: ['test']` is the only thing keeping a `(read-check)` observable — one settled by
reading a file, not by running a test — off flowrider's list. And
`qa-checklist-to-text-transformer.ts:89` applies that filter to the rows, the surfaces **and the
denominator**. Delete it and every flowrider operation blocks on a unit nobody in that family can ever
mark. There is no route out: the gate refuses the signal, and the only thing that could clear it is a
mark no session is allowed to write.

`flowTypes: ['runtime']` is the same story from a different angle. It is the only reason an operational
flow yields a zero flowrider denominator, and today's flowrider prompt explicitly says a flow retyped
`operational` mid-quest must not stall the quest. Without the filter, it does.

---

## BUILD

New statics keyed by step, holding the same four fields. Steps that need one:

| Step | `flowTypes` | `verificationMethods` | `unitKinds` | Note |
|---|---|---|---|---|
| codeweaver `review` | both | `['test', 'reading']` | every kind | it is the only family that settles a `(read-check)` unit, and after story 22 the only one that settles an OPERATIONAL unit |
| flowrider `review` | `['runtime']` | `['test']` | every kind | the two filters above |
| siege `happyWalk` | `['runtime']` | `['test']` | every kind + `off-map` | siegemaster is the only role carrying `off-map` |
| siege `adversarial` | `['runtime']` | `['test']` | `off-map` | it measures the family it was allocated |

**A step with no declared scope inherits its family's whole in-scope set unfiltered.** Say that in the
statics' own header, so a new step is not silently narrowed to nothing.

**`packageScope: 'intersection'` does NOT survive.** Today a glue node's units go to every cell that
tags it. Under a gate that refuses an unmarked assignment that would force two cells to mark the same
unit, or block one of them. Story 22 replaces it: a glue seam's units go to the SECOND cell only,
chosen by the cell ordering the orchestrator already computes. Leave the field out here and note why.

---

## DONE WHEN

| Assert | |
|---|---|
| a `(read-check)` unit is OUT of flowrider `review`'s scope and IN codeweaver `review`'s | the filter that stops the stall |
| an operational flow's units are out of both flowrider and siege scopes | the second filter |
| an `offmap:` unit is in siege's scope and in nobody else's | siegemaster is the only role carrying it |
| **`signoffTrackEligibilityStatics` is UNCHANGED and its test still passes** | its readers are live until story 26. This story ADDS; it does not move |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete or edit `signoffTrackEligibilityStatics` | story 26 |
| build the in-scope SET | story 12. This is the filter; that is the thing filtered |
| add `verifyByHuman` as a `verificationMethods` value | story 28. It is one more value in this field, which is why it goes after |
