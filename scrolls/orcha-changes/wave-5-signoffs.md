# Wave 5 — retire the sign-off tracks

**This is the largest wave and the least interesting, which is exactly why it goes wrong.** It is a
fan-out of small mechanical sessions, not one story.

**Model: sonnet.** The repo's own guidance: use sonnet for large mechanical fan-outs, reserve opus for
the orchestrator and genuinely hard debugging.

---

## Read this before slicing the wave

**`signoffTrackEligibilityStatics` does two jobs that read as one, and retiring both breaks every
flowrider run.**

| Job | Fate |
|---|---|
| name the three sign-off FIELDS and which track owns which | **retires** with the fields |
| SCOPE which units a track is measured over — `flowTypes`, `verificationMethods`, `unitKinds`, `packageScope` | **survives**, re-keyed from track onto STEP |

`verificationMethods: ['test']` is the only thing keeping a `(read-check)` observable off flowrider's
list, and `qa-checklist-to-text-transformer.ts:89` applies that filter to the rows, the surfaces AND
the denominator. `flowTypes: ['runtime']` is the only reason an operational flow yields a zero
flowrider denominator. Delete either and the in-scope gate blocks on units the family structurally
cannot settle — forever, with no route out.

**Re-measure before you slice.** The plan reports 77 non-test source files for `quest.workItems` and
77 for sign-offs. The same figure for two different surfaces is suspicious rather than impossible, and
the sign-off number is what sizes this wave. The coordinator owns that measurement.

---

## The surfaces, measured

These are real paths, found by search rather than assumed. Slice **1–3 files per session** — an agent
handed a large batch optimises for throughput over correctness and invents evasions that pass lint
without improving anything.

| Group | Files | Note |
|---|---|---|
| **the scoping statics** | `orchestrator/src/statics/signoff-track-eligibility/` + its test | **Session 1, and alone.** It splits rather than deletes, and every other session reads the result |
| the patch-field allowlist | `orchestrator/src/statics/signoff-patch-fields/` | what makes a modify-quest element a sign-off write |
| the evidence contract | `orchestrator/src/statics/flow-evidence-contract/` + its test | its test PAIRS the field names against `byTrack`, so it fails loudly — good |
| the input allowlist | `orchestrator/src/statics/quest-status-input-allowlist/` | |
| the outstanding transformers | `orchestrator/src/transformers/signoff-outstanding/`, `signoff-flow-outstanding/`, `operation-signoff-scope/` | three domains, three sessions |
| the checklist chain | `orchestrator/src/transformers/qa-checklist-build/`, `qa-checklist-to-text/`, `qa-units-in-package-scope/` | the surviving derivation behind `get-quest-work` |
| the summary | `orchestrator/src/transformers/quest-summary-build/` | feeds the web COVERAGE block, which wave 7 rebuilds |
| shared contracts | `shared/src/contracts/flow-off-map-signoff/`, `signoff-denominator-track/`, `quest-summary-track-counts/`, `quest-summary-flow/` | |
| the smoketest harness | `orchestrator/src/transformers/smoketest-flow-signoff-apply/`, `orchestrator/src/brokers/smoketest/sign-outstanding-units/`, `.../scenario-driver/smoketest-sweep-pending-work-items-layer-broker.ts` | **it fabricates sign-offs and must stop** |
| `session-forensics` | `session-forensics/src/statics/track-denominator/` and everything downstream | it keeps a HAND-COPIED duplicate of the eligibility statics. The whole package reads a different shape after this |

**`session-forensics` is the one to schedule first among the big ones.** Its `track-denominator-statics`
is a hand-kept copy, so it drifts silently rather than failing — nothing ties the two together.

---

## The brief every session in this wave gets

```
OWNS      <1-3 exact paths, plus their colocated tests>
NO TOUCH  every other path in the table above. Somebody else has it open right now
DONE      the three sign-off fields are gone from your files, the SCOPING data is read
          from the step rather than the track, and ward is green on your paths
ASSERT    run the test FIRST, capture the real output, and assert on THAT. Do not write
          an expected value from the code you are about to change
```

**Two things no session in this wave may do.** Do not widen a type, loosen an assertion or delete a
test to reach green — a retirement that makes a red go away by weakening what was red is reviewed by
nobody here. And do not invent the step-scoped shape: session 1 defines it, and everyone else reads it.

---

## What this wave does NOT include

| | Where it lives |
|---|---|
| the web COVERAGE block, which is three sign-off tracks per flow | wave 7 — it blanks when this lands, and that is expected |
| `unconfirmable` becoming `cant-meet` in the debt list | wave 7, same reason |
| the `verifyByHuman` value in `verificationMethods` | wave 8 — it is one more value in the field this wave re-keys, which is why it goes after |
| hydration recipes needing a `step` on every fabricated work item | wave 8's tail. Every fabricated work item needs a `step` and its units or it is undispatchable |
