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
| name the three sign-off FIELDS and which track owns which — `signoffField` | **retires** in story 26, with the fields |
| SCOPE which units a track is measured over — `flowTypes`, `verificationMethods`, `unitKinds`, `packageTypes` | **survives**, re-keyed from track onto STEP. That is this story |
| the two SLICE RULES — `flowScope`, `packageScope` | **neither survives**, and neither costs anything to drop. See "Two fields that look like they survive and do not" below |

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

### Where it lives

```
packages/orchestrator/src/statics/step-scope/step-scope-statics.ts
packages/orchestrator/src/statics/step-scope/step-scope-statics.test.ts
```

Beside `agent-flow-statics.ts`, which story 05 puts in the same folder type. The step graph says what
runs; this says what each step is measured over. Two files because one is edited when a prompt is
swapped and the other when a denominator moves, and those are different reasons.

### The shape — keyed by FAMILY then STEP

Step names are not unique across families. `review` exists in codeweaver and in flowrider, `plan` in
all three, `commit` and `ward` in all three through `CLOSE_OUT`. A flat step key would silently give
flowrider's `review` codeweaver's scope.

```ts
export const stepScopeStatics = {
  byFamilyStep: {
    codeweaver: {
      review: {
        flowTypes: ['runtime', 'operational'],
        verificationMethods: ['test', 'reading'],
        unitKinds: ['terminal', 'branch', 'observable'],
        packageTypes: [
          'http-backend', 'mcp-server', 'frontend-react', 'frontend-ink', 'hook-handlers',
          'eslint-plugin', 'cli-tool', 'programmatic-service', 'library',
        ],
        observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      },
    },
    flowrider: {
      review: {
        flowTypes: ['runtime'],
        verificationMethods: ['test'],
        unitKinds: ['terminal', 'branch', 'observable'],
        packageTypes: [ /* the same nine */ ],
        observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
      },
    },
    siegemaster: {
      happyWalk: {
        flowTypes: ['runtime'],
        verificationMethods: ['test'],
        unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
        packageTypes: [ /* the same nine */ ],
        observableOrigins: [
          'spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'siegemaster', 'operator',
        ],
      },
      adversarial: {
        flowTypes: ['runtime'],
        verificationMethods: ['test'],
        unitKinds: ['off-map'],
        packageTypes: [ /* the same nine */ ],
        observableOrigins: [ /* siegemaster's six, as above */ ],
      },
    },
  },
} as const;
```

**The family key is `siegemaster`, not `siege`** — it is the key `agentFlowStatics` uses and the value
`operationItem.role` carries.

The four entries, and why each is what it is:

| Family · step | `flowTypes` | `verificationMethods` | `unitKinds` | Why |
|---|---|---|---|---|
| codeweaver `review` | both | `['test', 'reading']` | every kind but `off-map` | it is the only family that settles a `(read-check)` unit, and after story 22 the only one that settles an OPERATIONAL unit |
| flowrider `review` | `['runtime']` | `['test']` | every kind but `off-map` | the two filters above |
| siegemaster `happyWalk` | `['runtime']` | `['test']` | every kind, `off-map` included | siegemaster is the only role carrying `off-map` |
| siegemaster `adversarial` | `['runtime']` | `['test']` | `['off-map']` | it measures the family it was allocated |

**A step with no declared scope inherits its family's whole in-scope set unfiltered.** Say that in the
statics' own header, so a new step is not silently narrowed to nothing. In this file that covers every
`worker` step and every `planner` step — a worker is handed the units its piece assigns, not a scope.

**One entry is a deliberate NARROWING of what the track does today, not a copy.** Siegemaster's track
carries `flowTypes: ['runtime', 'operational']` (`signoff-track-eligibility-statics.ts:162`); both siege
steps here carry `['runtime']` alone. Operational units move to codeweaver's reviewer, which is the
only family that can settle them — an operational flow is a one-time task sequence with no repeatable
walk for a siege lane to drive. Write that reason into the entry's own comment, or the next reader
"restores" the missing value.

### Two fields are in the snippet and not in the table, on purpose

**`packageTypes`.** `qa-units-in-package-scope-transformer.ts:61` reads it —
`const eligiblePackageTypes = new Set(eligibility.packageTypes.map(String));` — and story 26 is what
re-points that read at this file. Omit it here and there is nothing for that line to index when it
arrives.

**All three tracks carry the SAME nine kinds today**, so the narrowing is a no-op on every current
quest. Restate it anyway rather than dropping it: the one thing a package-kind list buys is a repo with
a package kind no family can prove in, and a filter that is absent cannot be the one that binds later.
The colocated test asserts the nine are 1:1 with `packageTypeContract`'s options, exactly as the old
statics' test does at line 225.

**`observableOrigins`** is carried unchanged from each step's matching track, pending the OPEN below.

### Restate the values. Do not import them.

`statics` may import `statics`, so `flowTypes: signoffTrackEligibilityStatics.byTrack.flowrider.flowTypes`
would compile. Three reasons not to:

| | |
|---|---|
| two entries have no counterpart to import | `adversarial`'s `unitKinds: ['off-map']` appears nowhere in the old statics, and neither do the step keys |
| story 26 deletes the half this file would import through | `signoffField` sits in the same entry. An import makes this file part of that deletion's blast radius for no gain |
| the coupling is the thing the re-key exists to break | an import means an edit to a track's list silently changes a step's scope — which is a track keying a step, which is what stopped existing |

### Two fields that look like they survive and do not

| Field | What the code does with it |
|---|---|
| `flowScope: 'declared'` | **read by no production file.** `operation-signoff-scope-transformer.ts:72` narrows on the item's own `flowIds` unconditionally; the only reads are in the two colocated tests (`signoff-track-eligibility-statics.test.ts:119`, `signoff-outstanding-transformer.test.ts:44`). There is no call site to re-point |
| `packageScope: 'intersection'` | **read by no production file either.** `qa-units-in-package-scope-transformer.ts:101–105` hardcodes the intersection rule and its header only DESCRIBES the field. The single read is `signoff-track-eligibility-statics.test.ts:239` |

**`packageScope` does not survive, and this is why it costs nothing to drop.** Today a glue node's
units go to every cell that tags it. Under a gate that refuses an unmarked assignment that would force
two cells to mark the same unit, or block one of them. Story 22 replaces it: a glue seam's units go to
the SECOND cell only, chosen by the cell ordering the orchestrator already computes. Leave both fields
out here and note why in the header.

---

## OPEN

**`observableOrigins` is the one field nobody has ruled on.** It excludes an observable whose `addedBy`
names a role running strictly after the track — `signoff-flow-outstanding-transformer.ts:76` is the
production read, and `quest-summary-build-transformer.ts:95` and
`session-forensics/.../is-track-owed-unit-guard.ts:48` are the other two.

Neither the design plan's §8 correction nor its §1 retirement list names it. Both readings are
defensible:

| Keep it | Drop it |
|---|---|
| a codeweaver reviewer is not measured on an observable siegemaster wrote after it ran | under a loop with a rework edge, "strictly after" is no longer a property of the relay — a codeweaver `work` step can be minted from a later family's `unmet` |

Dropping it does NOT deadlock — the reviewer marks the unit `unmet` and the ordinary route mints a
worker — so this is a cost question, not a correctness one. **The conductor decides.** Until it does,
carry the field with each step's family list copied verbatim from the old statics' matching track, so
behaviour is unchanged either way and the decision is one edit to one file.

---

## DONE WHEN

| Assert | |
|---|---|
| a `(read-check)` unit is OUT of flowrider `review`'s scope and IN codeweaver `review`'s | `verificationMethods.includes('reading')` is `false` for `flowrider.review` and `true` for `codeweaver.review`. That is the filter `qa-checklist-to-text-transformer.ts:89` applies, and the one that stops the stall |
| an operational flow's units are out of both flowrider and siegemaster scopes | `flowTypes` on `flowrider.review`, `siegemaster.happyWalk` and `siegemaster.adversarial` is exactly `['runtime']` |
| an `off-map` unit is in siegemaster's two scopes and in neither `review` | `unitKinds.includes('off-map')` is `true` for `happyWalk` and `adversarial`, `false` for both `review` entries |
| `siegemaster.adversarial.unitKinds` is exactly `['off-map']` | it measures the family it was allocated and nothing else. A `toStrictEqual`, not an `includes` |
| the nine `packageTypes` are 1:1 with `packageTypeContract.options` | the same pin the old statics' test holds at line 225 |
| every `byFamilyStep` key pair names a step that exists in `agentFlowStatics` | a scope for a step nobody declared is a filter that never fires. A table-driven sweep over both statics |
| **`signoff-track-eligibility-statics.ts` is byte-identical and its test still passes** | its readers are live until story 26. This story ADDS; it does not move. `git diff --stat` on that path shows nothing |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete or edit `signoffTrackEligibilityStatics` | story 26 |
| re-point any reader at this file | story 12 does that for the derivation chain, story 26 for the rest. **Nothing imports this statics when you are finished, and that is correct** — the tree is green because nothing changed behaviour |
| build the in-scope SET | story 12. This is the filter; that is the thing filtered |
| add `verifyByHuman` as a `verificationMethods` value | story 28. It is one more value in this field, which is why it goes after |
