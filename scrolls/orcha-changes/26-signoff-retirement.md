# 26 — retire the sign-off tracks (a set of ~12)

```
GOAL      Three overwritable sign-off fields go. The SCOPING data they sat beside stays.
AFTER     11 (which added the step-keyed scope) · merges WITH 24
MODEL     sonnet — this is apply-the-contract work across many files
```

**The largest set and the least interesting, which is exactly why it goes wrong.**

---

## Read this before slicing, or you will break every flowrider run

`packages/orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts`
does **two jobs that read as one**:

| Job | Fate |
|---|---|
| name the three sign-off FIELDS and which track owns which | **retires** with the fields |
| SCOPE which units a track is measured over — `flowTypes`, `verificationMethods`, `unitKinds`, `packageScope` | **survives.** Story 11 already re-keyed it onto the step |

`verificationMethods: ['test']` is the only thing keeping a `(read-check)` observable off flowrider's
list, and `qa-checklist-to-text-transformer.ts:89` applies that filter to the rows, the surfaces AND the
denominator. `flowTypes: ['runtime']` is the only reason an operational flow yields a zero flowrider
denominator. Delete either and the in-scope gate blocks forever on a unit nobody in that family can
mark, with no route out.

**Re-measure before slicing.** The design plan reports 77 non-test source files for `quest.workItems`
and 77 for sign-offs. The same figure for two different surfaces is suspicious rather than impossible,
and the sign-off number is what sizes this set. **The conductor owns that measurement.**

---

## The surfaces, found by search rather than assumed

Slice **1–3 files per session.** A session handed a large batch optimises for throughput over
correctness and invents evasions — extracting violations to variables, `[\s\S]*` wildcards — that pass
lint without improving anything.

| Order | Group | Files |
|---|---|---|
| **1, alone** | the scoping statics | `orchestrator/src/statics/signoff-track-eligibility/` + its test. It SPLITS rather than deletes, and every other session reads the result |
| **2** | `session-forensics` | `session-forensics/src/statics/track-denominator/` and everything downstream. **It keeps a HAND-COPIED duplicate** of the eligibility statics, so it drifts silently rather than failing — nothing ties the two together |
| then, any order | the patch-field allowlist | `orchestrator/src/statics/signoff-patch-fields/` |
| | the evidence contract | `orchestrator/src/statics/flow-evidence-contract/` + its test. Its test PAIRS the field names against `byTrack`, so it fails loudly — good |
| | the input allowlist | `orchestrator/src/statics/quest-status-input-allowlist/` |
| | the outstanding transformers | `transformers/signoff-outstanding/`, `signoff-flow-outstanding/`, `operation-signoff-scope/` — three domains, three sessions |
| | the checklist chain | `transformers/qa-checklist-build/`, `qa-checklist-to-text/`, `qa-units-in-package-scope/` — **these SURVIVE as `get-quest-work`'s internals.** Change what they read, do not delete them |
| | the summary | `transformers/quest-summary-build/` — feeds the web COVERAGE block, which story 27 rebuilds |
| | shared contracts | `shared/src/contracts/flow-off-map-signoff/`, `signoff-denominator-track/`, `quest-summary-track-counts/`, `quest-summary-flow/` |
| | the smoketest harness | `transformers/smoketest-flow-signoff-apply/`, `brokers/smoketest/sign-outstanding-units/`, `.../scenario-driver/smoketest-sweep-pending-work-items-layer-broker.ts`. **It fabricates sign-offs and must stop** |

---

## The brief every session in this set gets

```
GOAL      remove the three sign-off fields from <these files>, reading the step-keyed
          scope story 11 built instead of the track-keyed one
OWNS      <1-3 exact paths, plus their colocated tests>
NO TOUCH  every other path in the table. A sibling session has it open right now
DONE      no sign-off field remains in your files; scope comes from the STEP; ward green
WARD      npm run ward -- -- <your paths>
ASSERT    run the test FIRST, capture the real output, and assert on THAT. Do not write
          an expected value from the code you are about to change
```

**Two things no session in this set may do.** Do not widen a type, loosen an assertion or delete a test
to reach green — a retirement that makes a red go away by weakening what was red is reviewed by nobody
here. And do not invent the step-scoped shape: story 11 defined it, and everyone reads it.

---

## What this set does NOT include

| | Where |
|---|---|
| the web COVERAGE block — three sign-off tracks per flow | story 27. **It blanks when this lands, and that is expected** |
| `unconfirmable` becoming `cant-meet` in the debt list | story 27 |
| the `verifyByHuman` value in `verificationMethods` | story 28 — one more value in the field this set re-keys, which is why it goes after |
| hydration recipes needing a `step` on every fabricated work item | story 28 |
