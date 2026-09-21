# 26 — retire the sign-off tracks (a set of 31)

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
| name the three sign-off FIELDS and which track owns which — `signoffField` | **retires** with the fields |
| SCOPE which units a track is measured over — `flowTypes`, `verificationMethods`, `unitKinds`, `packageTypes` | **already re-keyed onto the step.** Story 11 built `orchestrator/src/statics/step-scope/step-scope-statics.ts` (`stepScopeStatics.byFamilyStep`) as an ADDITIVE file and left this one byte-identical until this story lands |

**Correction to the old framing.** This file does not "split" here — it already split, in story 11.
**This story DELETES it outright**, once every one of its **nine** production readers in this set has
moved to `stepScopeStatics`. "Its last two readers" was wrong — the full list, measured by who imports
the symbol, is under "The delete order" below, and two of the nine are TYPE-ONLY imports that no test
run will catch. Deleting it before they are re-pointed breaks the typecheck on files a sibling session
owns; deleting it after leaves nothing pointing at it. **Run this file's own session (session 7 below)
LAST in this set, not first.**

`verificationMethods: ['test']` is the only thing keeping a `(read-check)` observable off flowrider's
list, and `qa-checklist-to-text-transformer.ts:89` applies that filter to the rows, the surfaces AND the
denominator (`trackMethods.includes(item.verifyByReading === true ? 'reading' : 'test')` — quoted
verbatim from that file). `flowTypes: ['runtime']` is the only reason an operational flow yields a zero
flowrider denominator. Delete either without a working replacement and the in-scope gate blocks forever
on a unit nobody in that family can mark, with no route out.

**The hand-copied duplicate HAS drifted, and here is the diff.** Read
`session-forensics/src/statics/track-denominator/track-denominator-statics.ts` before touching it
(session 25). Field by field, against
`orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts`:

| Field on the original's `byTrack` entries | In the copy? | Accounted for by the copy's own docstring? |
|---|---|---|
| `flowTypes` · `unitKinds` · `observableOrigins` · `verificationMethods` | **yes, all four, values byte-identical for all three tracks** | yes — *"Four of them fit in a table like this one"* |
| `flowScope` | no | yes — *"the two that do not are flow slice and package slice"* |
| `packageScope` | no | yes — same clause |
| `signoffField` | no | not named, but genuinely redundant: the copy keys `byTrack` by the FIELD (`codeweaverSignoff`), where the original keys it by the ROLE (`codeweaver`) |
| **`packageTypes`** | **no** | **NO — this is the drift** |

**`packageTypes` is the finding.** The copy's docstring (`track-denominator-statics.ts:19-23`) tallies
*"six exclusions"* — four carried, two not — and `packageTypes` is a SEVENTH field on the original that
the tally never mentions and the copy never carries. It is a plain list of package kinds, exactly the
shape the docstring says "fits in a table like this one," so nothing about it explains the omission.

**It has cost nothing so far**, which is precisely why it survived: `session-forensics` has no
package-kind filter anywhere in its coverage pipeline, so no reading has ever been wrong because of it.
That is the failure mode the story predicted — *"it drifts silently rather than failing"* — observed
rather than assumed.

**So the session rebuilding this copy makes a decision, not a transcription:** does the replacement
carry a package-kind filter or not? Answer it deliberately and write the answer down. Carrying the gap
forward unexamined is how it survives a second rewrite.

---

## MEASURED — the real blast radius, not the design plan's guess

The design plan (`scrolls/orchestrator-step-engine-plan.md:3503-3513`) reports **77 non-test source
files** for `quest.workItems` and **77 for sign-offs**, and calls the matching number *"suspicious
rather than impossible."* It was right to be suspicious: **both figures are wrong, and the two surfaces
are not close to the same size.**

Measured over `packages/**`, `.ts`/`.tsx` only, excluding `*.test.*`, `*.integration.test.*`,
`*.proxy.*`, `*.stub.*`, `*.harness.*`, `*.e2e.*`, any `/test/` directory and the `.ward/` run
artefacts:

| Surface | Pattern | Design plan said | **Real count** | Test/proxy/harness files behind it |
|---|---|---|---|---|
| the three FIELDS — what this set actually deletes | `codeweaverSignoff\|flowriderSignoff\|siegemasterSignoff` | 77 | **39** | 59 |
| the sign-off VOCABULARY — the wider rename surface | `[Ss]ignoff` in any casing or kebab form | 77 | **75** | — |
| `quest.workItems` — a different surface, NOT this set's | `\bworkItems\b` | 77 | **96** | 219 |

**The 39 is the number that sizes this set**, because it is the count of files that name a field being
deleted. The 75 counts everything carrying the word — `signoff-contract.ts`, `signoffTracksStatics`,
`reset-flow-signoffs` and its whole tool chain — most of which belongs to story 24 or story 25, not
here. Quoting 75 as this set's size double-counts other stories' work.

**By package, for the 39:**

| Package | Files |
|---|---|
| `orchestrator` | 19 |
| `shared` | 13 |
| `session-forensics` | 5 |
| `mcp` | 2 |

**So the design plan's "suspicious" 77/77 was exactly the copy-paste it looked like** — and the
sign-off surface is roughly HALF what the plan sized it at, while `quest.workItems` is a quarter
larger. That plan reads *"the sign-off figure is what makes step 7 the larger unknown of the two"*
(`orchestrator-step-engine-plan.md:3512`); on these numbers it is the SMALLER of the two.

**A literal grep undercounts, and one file proves it.**
`session-forensics/src/transformers/quest-to-coverage/quest-to-coverage-transformer.ts` contains the
word "signoff" nowhere, yet types its tracks off `Object.keys(trackDenominatorStatics.byTrack)` and
indexes `unit.trackVerdicts[track]` (`:34-45`) — so it breaks the moment session 25/26 change those
keys' shape, with nothing for a text search to catch. The session list below is built by dependency,
not by grep, which is why it names files the counts above do not.

---

## The surfaces, found by search rather than assumed

**31 sessions, not ~12.** The old grouped table collapsed several real sessions into one row and missed
several load-bearing files entirely — the three contracts that actually DECLARE the fields, the
orchestrator's own internal unit shape, the glyph statics, the save-invariant transformers, and
`modify-quest-input` are all real, and none of them were in the original list. Slice **1–3 files per
session** — a session handed a large batch optimises for throughput over correctness and invents
evasions (extracting violations to variables, `[\s\S]*` wildcards) that pass lint without improving
anything.

| # | OWNS (+ colocated test/stub) | AFTER | What, and why |
|---|---|---|---|
| 1 | `shared/src/contracts/flow-node/flow-node-contract.ts` · `flow-edge/flow-edge-contract.ts` · `flow-observable/flow-observable-contract.ts` | — | **Ground zero.** The three `.optional()` fields themselves: `flow-node-contract.ts:51-53`, `flow-edge-contract.ts:27-29`, `flow-observable-contract.ts:83-85` — each declares `codeweaverSignoff`, `flowriderSignoff`, `siegemasterSignoff` verbatim. Delete all three, on all three files, in one session — they are the same three-line pattern repeated |
| 2 | `shared/src/contracts/flow-off-map-signoff/flow-off-map-signoff-contract.ts` | — | Off-map families carry only `siegemasterSignoff` (`flow-off-map-signoff-contract.ts:37`) — one field, not three. Its own session because the shape differs from #1's |
| 3 | `shared/src/contracts/signoff/signoff-contract.ts` · `shared/src/contracts/signoff-track/signoff-track-contract.ts` · `shared/src/statics/signoff-tracks/signoff-tracks-statics.ts` | — | All three retire per the design plan's own list (`scrolls/orchestrator-step-engine-plan.md:133`, *"Retired: `codeweaverSignoff`, `flowriderSignoff`, `siegemasterSignoff`, `signoffTrackContract`, `signoffDenominatorTrackContract`…"*). `signoffContract`'s shape — `{ verdict, evidence, toSettle?, workItemId, at }` — is the direct ancestor of the new `workItem.observations[]` entry `{ unitId, mark, evidence, toSettle?, at }` (design plan §1). **Flag for whoever builds story 01 (observation-record): read this file before inventing the new shape from scratch** — the `evidence`/`toSettle` field descriptions and the `superRefine` requiring `toSettle` on `unconfirmable` are exactly what `mark: 'cant-meet'` needs too |
| 4 | `shared/src/contracts/signoff-verdict/signoff-verdict-contract.ts` | — | `z.enum(['confirmed', 'unconfirmable'])` (`signoff-verdict-contract.ts:22`) — not named in the design plan's retirement list but used by #3's `signoffContract` and by `session-forensics`'s `verificationUnitContract.trackVerdicts` (session 20). Retires alongside #3 |
| 5 | `shared/src/contracts/signoff-denominator-track/signoff-denominator-track-contract.ts` | — | **OPEN, see below.** The design plan's retirement list names this too, but three other shared contracts (#6) still key rows on it |
| 6 | `shared/src/contracts/quest-summary-track-counts/quest-summary-track-counts-contract.ts` · `quest-summary-flow/quest-summary-flow-contract.ts` · `quest-summary-unconfirmable/quest-summary-unconfirmable-contract.ts` | 5 | All three `import { signoffDenominatorTrackContract }` and key a row on it (`id: signoffDenominatorTrackContract` / `track: signoffDenominatorTrackContract`). `quest-summary-unconfirmable-contract.ts` also needs its name examined — "unconfirmable" becomes "cant-meet" per story 27's own text |
| 7 | `orchestrator/src/statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts` | **16, 17, 18, 19, 20, 21, 28, 29, 31** | **Run LAST — and the old "AFTER 16, 17" was incomplete.** It has NINE production readers in this set, not two; the full list is under "The delete order" below. Delete the file only once every one of them is re-pointed |
| 8 | `orchestrator/src/contracts/qa-verification-unit/qa-verification-unit-contract.ts` · `orchestrator/src/transformers/qa-unit-enumerate/qa-unit-enumerate-transformer.ts` | — | **Missing from the old table entirely.** `qa-verification-unit-contract.ts:53-57` declares `trackSignoffShape` (`codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff`, all optional) and spreads it onto all four discriminated-union variants (`:66`, `:78`, `:92`, `:99`). `qa-unit-enumerate-transformer.ts:92` reads `flow.offMapSignoffs.find(…)` to populate it. Story 12 says *"CALL IT UNCHANGED"* — that is about the CALL, not the body: this transformer's own field-spread from the retiring contracts breaks the moment session 1/2 lands, so it needs an edit even though its signature does not change |
| 9 | `orchestrator/src/statics/signoff-patch-fields/signoff-patch-fields-statics.ts` | — | "The field names that make a modify-quest element a SIGN-OFF WRITE" — unchanged from the old table |
| 10 | `orchestrator/src/statics/flow-evidence-contract/flow-evidence-contract-statics.ts` | — | Its test PAIRS the field names against `byTrack`, so a stale field name fails loudly — good, unchanged from the old table |
| 11 | `orchestrator/src/statics/quest-status-input-allowlist/quest-status-input-allowlist-statics.ts` | — | Unchanged from the old table |
| 12 | `orchestrator/src/transformers/signoff-element-stamp/signoff-element-stamp-transformer.ts` | — | **Missing from the old table.** "Replaces the clock reading on whichever sign-off tracks one modify-quest element is [writing]" — this is the write-path timestamp stamper, part of the same mechanism `quest-input-server-timestamps-transformer` already in the old table sits beside |
| 13 | `orchestrator/src/transformers/quest-signoff-coupled-edit-violations/quest-signoff-coupled-edit-violations-transformer.ts` · `quest-signoff-unknown-unit-violations/quest-signoff-unknown-unit-violations-transformer.ts` | — | **Missing from the old table**, but explicitly named by the design plan's blast-radii paragraph as "both save-invariant transformers" (`scrolls/orchestrator-step-engine-plan.md:3516`) |
| 14 | `shared/src/contracts/modify-quest-input/modify-quest-input-contract.ts` | — | **Missing from the old table**, explicitly named by the same blast-radii paragraph |
| 15 | `orchestrator/src/transformers/signoff-outstanding/signoff-outstanding-transformer.ts` | — | **Delete.** Story 12's `stepOutstandingUnitsTransformer` replaces it. Story 12's own text: *"edit signoff-flow-outstanding/, signoff-outstanding/, operation-signoff-scope/ or qa-units-in-package-scope/ \| story 26. All four are live and green until then"* (`scrolls/orcha-changes/12-in-scope-set.md:275`) |
| 16 | `orchestrator/src/transformers/signoff-flow-outstanding/signoff-flow-outstanding-transformer.ts` | — | **Delete, but has ONE live caller left: `qa-checklist-build-transformer.ts:139` (session 19).** Land session 19's re-point first or in the same pass — deleting this file while `qaChecklistBuildTransformer` still imports it (`qa-checklist-build-transformer.ts:64`) breaks the typecheck for a file this session does not own |
| 17 | `orchestrator/src/transformers/operation-signoff-scope/operation-signoff-scope-transformer.ts` | — | **Delete.** Story 12 explicitly does not call it — *"`operationSignoffScopeTransformer` you READ, and do not call… So do the flow narrowing yourself"* (`12-in-scope-set.md:68-82`) — so once the `get-qa-checklist` tool itself is gone (story 24) nothing calls this either |
| 18 | `orchestrator/src/transformers/qa-units-in-package-scope/qa-units-in-package-scope-transformer.ts` | — (**BEFORE 7**, not after — the old table had this inverted) | **SURVIVES — re-point, do not delete.** Story 11 and story 12 both say so explicitly: *"Story 26 owns re-pointing its line 61 read at `stepScopeStatics`; editing it here breaks `signoffFlowOutstandingTransformer`… Do not edit that file"* (`12-in-scope-set.md:64-66`). The real lines today: `qa-units-in-package-scope-transformer.ts:45` imports `signoffTrackEligibilityStatics`, `:56` types `track` as `keyof typeof signoffTrackEligibilityStatics.byTrack`, `:60-61` reads `eligibility.packageTypes`. Re-point all three at `stepScopeStatics`, passing the family the same way story 12 does ("passing the family as `track`") |
| 19 | `orchestrator/src/transformers/qa-checklist-build/qa-checklist-build-transformer.ts` | 16 | **OPEN, see below.** Re-points its `track` param type (`:77`, currently `keyof typeof signoffTrackEligibilityStatics.byTrack`) and its `remainingItemIds` computation (`:136-139`, currently calls `signoffFlowOutstandingTransformer`) |
| 20 | `orchestrator/src/transformers/qa-checklist-to-text/qa-checklist-to-text-transformer.ts` | 18 | Reads `signoffTrackEligibilityStatics` at `:48, :58, :66, :71, :107-108, :114-117` — the `signoffField`-driven `"awaiting your \`${signoffField}\`"` rendering (`:110-117`) needs new wording once the field itself is gone |
| 21 | `orchestrator/src/transformers/quest-summary-build/quest-summary-build-transformer.ts` | — | Feeds the web COVERAGE block, which story 27 rebuilds — unchanged from the old table |
| 22 | `shared/src/transformers/flow-graph-to-text/flow-graph-to-text-transformer.ts` | — | **Missing from the old table.** Renders `codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff` directly on node, observable, edge and off-map-family lines (`flow-graph-to-text-transformer.ts:201-203, :226-228, :261-263, :336-338`) |
| 23 | `shared/src/transformers/signoff-markers-to-text/signoff-markers-to-text-transformer.ts` | — | **Missing from the old table.** "Renders every verification track's verdict on one unit as a compact suffix a graph line" |
| 24 | `shared/src/statics/text-display-symbols/text-display-symbols-statics.ts` | — | **Missing from the old table.** `signoffTrackMarks` (`:123`, three glyphs keyed by track) and `signoffVerdictMarks` (`:128`, two glyphs keyed by verdict) feed sessions 22 and 23. Three marks (`met`/`cant-meet`/`unmet`) replace two — this file needs a third glyph, not a rename of two |
| 25 | `session-forensics/src/statics/track-denominator/track-denominator-statics.ts` | 1, 2, 7 | The hand-copy. See the drift finding above before rebuilding it |
| 26 | `session-forensics/src/contracts/track-coverage/track-coverage-contract.ts` · `verification-unit/verification-unit-contract.ts` | 25 | `verification-unit-contract.ts:40-44` declares `trackVerdicts: { codeweaverSignoff, flowriderSignoff, siegemasterSignoff }` directly, each `signoffVerdictContract.optional()` |
| 27 | `session-forensics/src/guards/is-track-owed-unit/is-track-owed-unit-guard.ts` · `transformers/quest-to-units/quest-to-units-transformer.ts` · `transformers/quest-to-coverage/quest-to-coverage-transformer.ts` | 25, 26 | The computation chain. `quest-to-coverage-transformer.ts` has **no literal "signoff" anywhere** — found only by reading it: it types `tracks` off `Object.keys(trackDenominatorStatics.byTrack)` and indexes `unit.trackVerdicts[track]` (`:34-45`), so it breaks the moment session 25/26 change those keys' shape, with nothing for a text search to catch |
| 28 | `orchestrator/src/transformers/smoketest-flow-signoff-apply/smoketest-flow-signoff-apply-transformer.ts` | — | Unchanged from the old table |
| 29 | `orchestrator/src/brokers/smoketest/sign-outstanding-units/smoketest-sign-outstanding-units-broker.ts` | — | Unchanged from the old table — has a `.proxy.ts` companion too |
| 30 | `orchestrator/src/brokers/smoketest/scenario-driver/smoketest-sweep-pending-work-items-layer-broker.ts` | — | Unchanged from the old table — has a `.proxy.ts` companion too |

| 31 | `orchestrator/src/transformers/relay-tail-fan-out/relay-tail-fan-out-transformer.ts` | — (**BEFORE 7**) | **Missing from every version of this table, and it is a real production reader.** `:33` imports the statics and `:62` reads it: `const eligibility = new Map(Object.entries(signoffTrackEligibilityStatics.byTrack)).get(` — used to decide a fanned-out scope's eligibility. Story 22 also edits this file (seam units to the later cell) and story 24 re-derives its `RegistryEntry` type off `questFlowStatics` — **three stories touch one file, so whoever schedules this set must sequence it with 22 and 24 rather than dispatching it blind** |

**Thirty-one rows, thirty-one sessions.** Five of them (#1, #6, #8, #13, #27) bundle two or three
closely-coupled files under one session — the same pattern repeated across sibling contracts, or a
chain that breaks as a unit — which is what keeps every row inside the "1–3 files per session" rule
while still being one real session each.

### The delete order — session 7 is last, and here is the complete reason

`signoffTrackEligibilityStatics` has **nine production readers inside this set**, plus one that belongs
to story 24. Measured by importing the symbol, not by mentioning it in a comment:

| Reader | Session | How it reads |
|---|---|---|
| `signoff-flow-outstanding-transformer.ts` | 16 | `:50` import, `:61` `keyof typeof …byTrack`, `:65` `…byTrack[track]` |
| `operation-signoff-scope-transformer.ts` | 17 | `:37` import, `:39` type, `:65` `…byTrack[track]` |
| `qa-units-in-package-scope-transformer.ts` | 18 | `:45` import, `:56` type, `:60` `…byTrack[track]` |
| `qa-checklist-build-transformer.ts` | 19 | `:61` **type-only** import, `:77` the `track?` param type |
| `qa-checklist-to-text-transformer.ts` | 20 | `:48` import, `:58` type, `:66` `…byTrack[track].unitKinds` |
| `quest-summary-build-transformer.ts` | 21 | `:63` import, `:88` `…byTrack[track].flowTypes`, `:93` `…byTrack[track]` |
| `smoketest-flow-signoff-apply-transformer.ts` | 28 | `:34` **type-only** import, `:45` the `signoffField` type |
| `smoketest-sign-outstanding-units-broker.ts` | 29 | `:47` import, `:97` `Object.entries(…byTrack)` |
| `relay-tail-fan-out-transformer.ts` | **31** | `:33` import, `:62` `Object.entries(…byTrack)` |
| `quest-get-qa-checklist-responder.ts` | **story 24** | `:38` import, `:66` `…byTrack[track].flowTypes` — goes with the tool, not with this set |

**Eight more files name it in a COMMENT only and need no edit to compile** — `signoff-patch-fields-statics.ts:31`,
`signoff-outstanding-transformer.ts:23`, `track-denominator-statics.ts:2`, `quest-type-registry-statics.ts:30,83`,
`quest-summary-flow-contract.ts:15`, `quest-summary-track-counts-contract.ts:15`,
`signoff-denominator-track-contract.ts:17`, `flow-off-map-signoff-contract.ts:15`. They go stale rather
than red, so a typecheck will not find them — fix the prose in whichever session lands nearest each.

**Two of the nine are TYPE-ONLY imports** (19 and 28), and that is the trap in this ordering: a
type-only import does not fail at runtime and can slip through a test run that passes. `tsc` is what
catches them, which is why the gate for session 7 is a typecheck over the whole orchestrator package,
not its own colocated test.

**A note on `session-forensics`'s two remaining consumers that need NO source edit.**
`session-forensics/src/transformers/coverage-to-text/coverage-to-text-transformer.ts` and
`session-forensics/src/responders/digest/run/digest-run-responder.ts` both take a `track` string
generically and render whatever key they are handed — neither has to change. **Their TESTS do**: both
test files hardcode column headers and fixture literals like `'  codeweaverSignoff             0       0…'`
(`digest-run-responder.test.ts:256-258`, `coverage-to-text-transformer.test.ts:43-45` etc.) that go stale
the moment session 26/27 rename the keys. Fold the test fixes into session 27's pass rather than opening
two more sessions for zero source changes.

**Three shared contracts touched ONLY in a docstring, not in any functional shape — do not open a
session for these; note the stale comment in whichever session lands nearest them, or leave for a later
cleanup pass:**

| File | What's stale |
|---|---|
| `shared/src/contracts/quest/quest-contract.ts:164, :179` | comments describing coverage as `codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff` |
| `shared/src/contracts/qa-checklist/qa-checklist-contract.ts:52` | comment describing `remainingItemIds` off `flowriderSignoff`/`siegemasterSignoff` |
| `shared/src/contracts/qa-checklist-kind/qa-checklist-kind-contract.ts:11` | comment naming the same two fields |

---

## OPEN — questions the code could not answer

**Session 5: does `signoffDenominatorTrackContract` retire outright, or survive re-keyed?** The design
plan's retirement list names it (`scrolls/orchestrator-step-engine-plan.md:133-134`), but session 6's
three contracts still need SOME enum to key a summary row on "which family produced this", and nothing
in the design plan says what replaces it. A candidate exists already — `agentRoleContract` or the
family key `agentFlowStatics` uses (`codeweaver | flowrider | siegemaster`) — but wiring either in is a
design decision, not a search result. **The conductor decides**; until then, carry the enum unchanged
and let session 6 read it exactly as today, so behaviour does not shift on a guess.

**Session 19: what replaces `signoffFlowOutstandingTransformer` inside `qa-checklist-build-transformer.ts`?**
`qaChecklistBuildTransformer`'s signature is `{ flow, track?, packagesAffected?, packageNames? }`
(`qa-checklist-build-transformer.ts:66-71`) — no `step`, no `plan`, no `operationItemId`. Story 12's
replacement, `stepOutstandingUnitsTransformer`, needs all three (`{ quest, plan, operationItemId, step }`,
`12-in-scope-set.md:154-164`) to answer the same question. Either `qaChecklistBuildTransformer` grows
those parameters, or its caller (`get-quest-work`, story 18) stops asking it for `remainingItemIds` and
computes that separately. **The conductor decides which; this session cannot resolve it by reading code
that does not exist yet.**

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
| **the `reset-flow-signoffs` MCP tool, its responder, its layer-responder, `quest-reset-flow-signoffs-broker`, `reset-flow-signoffs-result-contract`, `reset-flow-signoffs-input-contract`, and the MCP-side `orchestrator-reset-flow-signoffs-adapter`** | story 24. Its own text: *"This deletes the tools that WRITE the sign-off fields; 26 deletes the fields"* (`24-the-deletions.md:12-13`). Confirmed real paths: `mcp/src/responders/quest/handle/reset-flow-signoffs-layer-responder.ts`, `mcp/src/contracts/reset-flow-signoffs-input/reset-flow-signoffs-input-contract.ts`, `mcp/src/adapters/orchestrator/reset-flow-signoffs/orchestrator-reset-flow-signoffs-adapter.ts`, `orchestrator/src/brokers/quest/reset-flow-signoffs/quest-reset-flow-signoffs-broker.ts`, `orchestrator/src/responders/quest/reset-flow-signoffs/quest-reset-flow-signoffs-responder.ts`, `orchestrator/src/contracts/reset-flow-signoffs-result/reset-flow-signoffs-result-contract.ts` |
| **the `get-qa-checklist` MCP tool, its responder, and `quest-get-qa-checklist-broker`** | story 24. Its own text: *"Its derivation brokers SURVIVE and became story 18's internals — do not delete those"* (`24-the-deletions.md:21`). The surviving derivation brokers ARE this set's sessions 19-20 (`qa-checklist-build`, `qa-checklist-to-text`) plus `qa-unit-enumerate` (session 8) — only the TOOL-facing wiring (`orchestrator/src/responders/quest/get-qa-checklist/quest-get-qa-checklist-responder.ts`, `mcp/src/flows/quest/quest-flow.ts`'s tool registration, `mcp/src/responders/quest/handle/quest-handle-responder.ts`) goes to story 24 |
| any of the eleven prompt statics files (`codeweaver-prompt-statics.ts`, `flowrider-prompt-statics.ts`, `siegemaster-prompt-statics.ts`, `siegemaster-stress-statics.ts`, `siegemaster-verifier-statics.ts` etc.) that still say `codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff` in prompt TEXT | story 25 — all nineteen prompts are rewritten there against the new step model regardless |
| `quest-modify-broker.ts`'s and `quest-handle-signal-back-responder.ts`'s incidental references | neither needs an edit. `quest-modify-broker.ts` only types a timestamp as `Signoff['at']` (`:76`) — it recompiles once session 3 lands, nothing to search-and-replace. `quest-handle-signal-back-responder.ts`'s matches are all in its `.integration.test.ts` fixtures, not its own source — verified, zero hits in the `.ts` file itself |
