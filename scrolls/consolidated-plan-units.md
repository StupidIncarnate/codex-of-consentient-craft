# Consolidated plan — remaining units, verified against code

Rebuilds the sub-ID breakdown the previous session lost. Every unit below was checked against current
source (not the stale docs) by dispatched research forks. Where a document and the code disagreed, it's
in **Stale premises**. Where the orchestrator's own remaining-unit list needed sub-splitting because a
file count exceeded 1-3, the split is defined here and flagged.

**Two units the code shows are ALREADY DONE and should be struck from the remaining list:**
- **T4-4b** — item 13a (element delta) is fully shipped (commits `b95e45df4`, `7d0e3e722`); `look` already
  gets a delta via `step-dispatch-broker.ts`, and `run` deliberately returns no payload by design. No
  files remain.
- **T4-10a / T4-12a** — both landed inside `beadbededd4ca`, whose commit message frames itself as a
  path-escape fix and buries the id-supply and cross-check work. This is why the remaining list only
  names `T4-10b`/`T4-12b` — there was never an "a" left to do.

**One open design question, not a stale premise — flag to the orchestrator before dispatching T1-13:**
`questLoadBroker` (session-forensics) returns `readonly Flow[]` only, never `workItems`, so
`trackVerdicts`/`unitMark` can **never hold a real mark** under any reading — the mechanism is
structurally inert today. T1-13 below is scoped as the literal vocabulary rename (2-value →3-value enum,
still permanently `{}`), matching the handoff's own phrasing ("`trackVerdicts` → `unitMark`"). Rewiring
it to compute real per-unit marks from `workItem.observations[]` (mirroring what `51c62c4172` did for
orchestrator's `questSummaryBuildTransformer`) is a materially larger unit the orchestrator has not
asked for and this file does not scope.

---

## Track 1

| ID | Goal | Files | Deps | Barrel? | e2e? | Ward |
|---|---|---|---|---|---|---|
| T1-13a | Rename the sign-off vocabulary on the two session-forensics contracts from the 2-value verdict shape to `unitMarkContract`'s 3-value shape | `packages/session-forensics/src/contracts/verification-unit/verification-unit-contract.ts`(+.test+.stub), `packages/session-forensics/src/contracts/track-coverage/track-coverage-contract.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T1-13b | Propagate the T1-13a rename through the transformers and renderer that consume it | `packages/session-forensics/src/transformers/quest-to-units/quest-to-units-transformer.ts`(+.test), `.../quest-to-coverage/quest-to-coverage-transformer.ts`(+.test), `.../coverage-to-text/coverage-to-text-transformer.ts`(+.test), `packages/session-forensics/src/responders/digest/run/digest-run-responder.ts` (verify signature only) | **T1-13a** | no | no | `--only lint,typecheck,unit -- <files>` |
| T1-15a | Delete `signoffContract`, `signoffTrackContract`, `signoffVerdictContract` and fix their one live consumer | `packages/shared/src/contracts/signoff/signoff-contract.ts`(+.test+.stub, delete), `.../signoff-track/signoff-track-contract.ts`(+.test+.stub, delete), `.../signoff-verdict/signoff-verdict-contract.ts`(+.test+.stub, delete), `packages/shared/src/contracts/quest-summary-unconfirmable/quest-summary-unconfirmable-contract.ts` (drop the `signoff` field/import), `packages/shared/contracts.ts` (remove 3 export lines) | none | **YES — nothing else in flight, solo wave** | no | `--only lint,typecheck,unit -- <files>` |
| T1-15b | Delete `signoffTracksStatics`, `signoffTrackMarks`, rename `signoffDenominatorTrackContract` and `questSummaryLimitsStatics.maxUnconfirmable` | `packages/shared/src/statics/signoff-tracks/signoff-tracks-statics.ts`(+.test, delete), `packages/shared/src/statics/text-display-symbols/text-display-symbols-statics.ts`(+.test, drop `signoffTrackMarks`), `packages/shared/src/contracts/signoff-denominator-track/signoff-denominator-track-contract.ts`(+.test+.stub, RENAME not delete), `packages/shared/src/statics/quest-summary-limits/quest-summary-limits-statics.ts` (rename `maxUnconfirmable`, fix JSDoc at ~:19-21), `packages/orchestrator/src/transformers/quest-summary-build/quest-summary-build-transformer.test.ts` (drop stale import), `packages/shared/statics.ts` (remove export line) | **T1-15a** | **YES — nothing else in flight, solo wave** | no | `--only lint,typecheck,unit -- <files>` |
| T1-15c | Rewrite the e2e that still asserts the retired testids/text, and strip the history comment from `unit-mark-contract.ts` | `packages/web/src/flows/quest-chat/quest-summary-under-raccoon.e2e.ts`, `packages/shared/src/contracts/unit-mark/unit-mark-contract.ts` (strip lines 3-4) | none | no | **yes — this is the e2e file** | `--only lint,typecheck,e2e -- <files>` |

---

## Track 3 — glyphsmith deletion (T3-13, T3-14, T3-15)

T3-13a (`chat-spawn-broker.ts`, `run-chat-layer-broker.ts`, `chat-prompt-build-transformer.ts`) and T3-14a
(server's `design.session` route + responder + adapter) are done, via `eaeb928455` and
`aac8a8f7111`/`babe65eb25`. What's left:

| ID | Goal | Files | Deps | Barrel? | e2e? | Ward |
|---|---|---|---|---|---|---|
| T3-13b | Delete the last two `role === 'glyphsmith'` branches (two throws) | `packages/orchestrator/src/brokers/chat/spawn/resolve-chat-quest-layer-broker.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-14b1 | Delete the dead design-chat-start responder and its flow whole — `DesignChatStartResponder` now always throws (`design-chat-start-responder.test.ts:7` pins the rejection) and nothing but the flow below calls it | `packages/orchestrator/src/responders/design-chat/start/design-chat-start-responder.ts`(+.proxy+.test, delete), `packages/orchestrator/src/flows/design-chat-start/design-chat-start-flow.ts`(+.integration.test, delete) | none | no | no | `--only lint,typecheck,unit,integration -- <files>` |
| T3-14b2 | Remove `StartOrchestrator.startDesignChat`, the flow's only caller | `packages/orchestrator/src/startup/start-orchestrator.ts` (remove method ~:369-378 + its import ~:66) | **T3-14b1** | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-14b3 | Drop the now-dead `startDesignChat: jest.fn()` mock entry | `packages/server/src/responders/quest/chat/quest-chat-responder.proxy.ts`, `.../quest/clarify/quest-clarify-responder.proxy.ts` | **T3-14b2** | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-14b4 | Same mock cleanup, disjoint files from T3-14b3 | `packages/server/src/responders/quest/comment-batch/quest-comment-batch-responder.proxy.ts`, `.../quest/followup/quest-followup-responder.proxy.ts` | **T3-14b2** | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-14c | Delete the dead web-side design chat broker and both orphan route strings it and the server declare | `packages/web/src/brokers/design/session/design-session-broker.ts`(+.proxy+.test, delete), `packages/web/src/statics/web-config/web-config-statics.ts`(+.test, drop the route), `packages/server/src/statics/api-routes/api-routes-statics.ts`(+.test, drop `design.session` ~:55) | none | no | no — pure dead-code removal, file-scoped ward is enough | `--only lint,typecheck,unit -- <files>` |
| T3-15a | Delete `glyphsmith-prompt-statics` — confirmed zero importers | `packages/orchestrator/src/statics/glyphsmith-prompt/glyphsmith-prompt-statics.ts`(+.test, delete) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-15b | Add the missing `riftcarver` floor entry. Do **not** remove glyphsmith's own HOMEBASE row — 28a's own file list never named this as one of the 6 files carrying real logic, it's an inert list entry | `packages/shared/src/statics/execution-floor-config/execution-floor-config-statics.ts`(+.test) | none | no (leaf statics file, not the barrel) | no | `--only lint,typecheck,unit -- <files>` |
| T3-15c | Remove the now-producerless `'design'` value from the process-id-prefix enum | `packages/orchestrator/src/contracts/process-id-prefix/process-id-prefix-contract.ts`(+.test+.stub) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-15d | Remove the matching `'design-'` entry, web side | `packages/web/src/statics/chat-process-id-prefixes/chat-process-id-prefixes-statics.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |

---

## Track 3 — the `verifyByHuman` filter (T3-20) and verdict panel (T3-21)

R26's three filter sites, corrected (one of the handoff's own three citations is wrong — see stale
premises): `step-in-scope-units-transformer.ts` and `quest-summary-build-transformer.ts` in orchestrator,
and `quest-to-units-transformer.ts` in session-forensics (**not** `is-track-owed-unit-guard.ts`, which
needs no edit).

| ID | Goal | Files | Deps | Barrel? | e2e? | Ward |
|---|---|---|---|---|---|---|
| T3-20a | New shared markdown block, same shape as `standardsReviewConcernsStatics` | NEW `packages/orchestrator/src/statics/observable-automatability/observable-automatability-statics.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-20b | Add `verifyByHuman` to the get-quest-work-facing contract and resolve it to `'human-check'` at the site `questGetQuestWorkBroker` actually calls | `packages/orchestrator/src/contracts/qa-verification-unit/qa-verification-unit-contract.ts`, `packages/orchestrator/src/transformers/qa-unit-enumerate/qa-unit-enumerate-transformer.ts`, `packages/orchestrator/src/transformers/step-in-scope-units/step-in-scope-units-transformer.ts` (+ their tests) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-20c | Interpolate T3-20a's block into both intake prompts | `packages/orchestrator/src/statics/dumpster-create-prompt/dumpster-create-prompt-statics.ts`, `packages/orchestrator/src/statics/dumpster-hunt-prompt/dumpster-hunt-prompt-statics.ts` (+ tests) | **T3-20a** | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-20d | Resolve the filter at the two remaining sites: the summary-count transformer, and session-forensics' own verification-method resolution | `packages/orchestrator/src/transformers/quest-summary-build/quest-summary-build-transformer.ts`, `packages/session-forensics/src/contracts/verification-unit/verification-unit-contract.ts`, `packages/session-forensics/src/transformers/quest-to-units/quest-to-units-transformer.ts` (+ tests) | **T3-20b**; **file-lock: must run after T1-13b** (same 2 session-forensics files) | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-20e | Interpolate T3-20a's block into both siege walker prompts | `packages/orchestrator/src/statics/siege-happy-walker/siege-happy-walker-statics.ts`, `packages/orchestrator/src/statics/siege-adversarial-walker/siege-adversarial-walker-statics.ts` (+ tests) | **T3-20a**; **file-lock: must run before T4-17f** (same 2 files) | no | no | `--only lint,typecheck,unit -- <files>` |
| T3-21b1 | Widen `questNoteKind` with a verdict kind, teach `unjudged-screencast` to check for it | `packages/shared/src/contracts/quest-note-kind/quest-note-kind-contract.ts`(+.test), `packages/siegelense/src/brokers/citation/resolve/unjudged-screencast-layer-broker.ts`(+.test) | none | no (leaf contract, no export-line change) | no | `--only lint,typecheck,unit -- <files>` |
| T3-21b2 | New server responder (+ orchestrator broker if needed) so the browser can write a human verdict — the actual "write path" R13 calls for. **Exact files not yet chosen** — pattern to follow: `packages/server/src/responders/quest/summary/quest-summary-responder.ts`. Flag to whoever picks this up: may split into a server-responder unit and an orchestrator-broker unit if it exceeds 3 files once drafted | NEW server responder (+colocated), possibly NEW orchestrator broker | **T3-21b1** | no (planned) | no | TBD once drafted |
| T3-21c | The end-of-quest human-check panel widget, wired into `quest-summary-widget.tsx` | NEW `packages/web/src/widgets/quest-summary/human-check-panel-widget.tsx`(+.proxy+.test), edit `packages/web/src/widgets/quest-summary/quest-summary-widget.tsx` | **T3-21b2**; **gated behind D1-D8 landing** (new web UI surface) | no | **yes** | `--only lint,typecheck,unit,e2e -- <files>` |

---

## Track 4 — tool and recipe items

| ID | Goal | Files | Deps | Barrel? | e2e? | Ward |
|---|---|---|---|---|---|---|
| T4-5 | Wire `compare`'s `elements` field (still `.strict()`, still rejects it) | `packages/siegelense/src/contracts/compare-answer/compare-answer-contract.ts`(+.test), `packages/siegelense/src/brokers/compare/read/compare-read-broker.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-7a | Drop `quest.harness.ts`'s silent raw-fs fallback in `writeQuestFile`, convert `patchQuestStatus` off direct HTTP | `packages/web/test/harnesses/quest/quest.harness.ts` | none | no | no (harness file, no e2e of its own) | `--only lint,typecheck,unit -- <files>` |
| T4-7b | Convert `session.harness.ts`'s ~21 still-raw methods through the hydration framework | `packages/web/test/harnesses/session/session.harness.ts` | recommended after T4-7a (same directory, avoid compounding churn — not a file conflict) | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-8 | Fix `quest-completed` (never sets operation status), `guild-mid-execution` (two byte-identical rows), `session-with-nested-chain` (undocumented depth) | `packages/hydration-recipes/src/brokers/recipes/quest-completed/recipes-quest-completed-broker.ts`, `.../guild-mid-execution/recipes-guild-mid-execution-broker.ts`, `.../session-with-nested-chain/recipes-session-with-nested-chain-broker.ts` (+ their `.integration.test.ts`) | none | no | no | `--only lint,typecheck,unit,integration -- <files>` |
| T4-10b | Let `QuestBlueprint` supply the first work item's id, and let `questHydrateBroker` take caller-supplied `createdAt`/`updatedAt` | `packages/orchestrator/src/contracts/quest-blueprint/quest-blueprint-contract.ts`, `packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.ts` (+ tests) | none | no | no | `--only lint,typecheck,unit,integration -- <files>` |
| T4-11 | New quest two-route comparison e2e, mirroring the existing guild one | NEW `packages/web/src/flows/home/quest-two-route-comparison.e2e.ts` | **T4-7a, T4-7b**; **gated behind D1-D8 landing** | no | **yes** | `--only e2e -- <file>` |
| T4-12b | Delete dead `RecipePackageMissingError` (singular) — the live path uses the plural pair | `packages/siegelense/src/errors/recipe-package-missing/recipe-package-missing-error.ts`(+.test, delete) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-12c | Add an `unusable` instance state and mark it on a mid-batch seed failure (the halt already exists; nothing marks the instance) | `packages/siegelense/src/contracts/instance-state/instance-state-contract.ts`(+.test), `packages/siegelense/src/brokers/instance/state-resolve/instance-state-resolve-broker.ts`(+.test), `packages/siegelense/src/brokers/step/seed/step-seed-broker.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |

---

## Track 4 — housekeeping (T4-13, T4-16d, T4-15, T4-17)

**T4-13a is the operator's alone** (`npm install` regenerates `package-lock.json`, rewrites `node_modules`
under every running agent — run with nothing else in flight). The remaining rename-leftover items (10b-10g
of the source doc) split into T4-13b through T4-13f; **10f (`tmp/siegelense-wiring/recipes.md`) does not
exist and is dropped** — see stale premises.

| ID | Goal | Files | Deps | Barrel? | e2e? | Ward |
|---|---|---|---|---|---|---|
| T4-13a | Regenerate the lockfile, clearing the stale `packages/siegelense-recipes` extraneous entry | `package-lock.json` | none | no | no | **operator-only, `npm install`, nothing else in flight** |
| T4-13b | Rename the pinning test off the old package name, fix the CLAUDE.md pointer to it | `packages/hydration-recipes/src/siegelense-recipes-not-shipped.integration.test.ts` (rename), `packages/hydration-recipes/CLAUDE.md` (fix ~:106) | none | no | no | `--only lint,typecheck,integration -- <files>` |
| T4-13c | Fix stale example strings | `packages/hydration-recipes/src/guards/has-package-json-dependency/has-package-json-dependency-guard.ts`(+.test), `packages/hydration-recipes/.../package-json-read-broker.test.ts` | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-13d | Fix stale paths in the eslint plugin's own JSDoc/examples | `packages/eslint-plugin/src/statics/ingredient-declaration/ingredient-declaration-statics.ts`, `.../guards/is-ingredient-declaration-file/is-ingredient-declaration-file-guard.ts` | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-13e | Fix stale fixture paths in two rule tests | `.../rule-ban-nondeterminism-in-ingredients-broker.test.ts`, `.../rule-ban-dom-handles-in-ingredients-broker.test.ts` | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-13f | Fix two comments claiming delivered `SavedOf<Ops>` threading is still "scheduled" | `packages/hydration/src/contracts/hydration-plan/hydration-plan-contract.ts`, `.../hydration-run-result/hydration-run-result-contract.ts` | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-16d | Type `availableRoutes` as `readonly HydrationRoute[]` instead of `readonly string[]` — the exact hole that let a stale `'recording'` fixture compile clean through the whole deletion | `packages/hydration/src/errors/hydration-route-unavailable/hydration-route-unavailable-error.ts`(+.test if a fixture breaks) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-15a | Split the flat `.siegelense` literal into a `dungeonmasterAssets` dirname + the existing link name | `packages/shared/src/statics/locations/locations-statics.ts`(+.test) | none | no (not a barrel export-line change; operator-only for a *different* reason — see note) | no | **operator-only** — ESLint loads `@dungeonmaster/shared/statics` at load time with no source condition, so `npm run build --workspace=@dungeonmaster/shared` must follow before lint on T4-15b/c/d can be trusted |
| T4-15b | Move the three install responders onto the new nested path | `packages/siegelense/src/responders/install/install-link-create-responder.ts`, `.../install-ignore-write-responder.ts`, `.../array-entry-anchor-insert-layer-responder.ts` | **T4-15a** | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-15c | Update the path-composition broker and its contract's stale JSDoc example | `packages/siegelense/.../locations-repo-link-path-find-broker.ts`, `packages/siegelense/.../repo-local-path-contract.ts` | **T4-15a** | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-15d | Rewrite the CLAUDE.md section heading and fix `.gitignore` — **the trap: ignore only the `siegelense-assets` child, never the `.dungeonmaster-assets` parent**, since the oddities file there must stay committed | `packages/siegelense/CLAUDE.md`, root `.gitignore` | **T4-15a** | no | no | n/a (docs + config) |
| T4-15h *(flagged, not independently verified)* | Update the three test fixtures hardcoding `/repo/.siegelense/...` as stub paths — named in the source doc (`shot-path-find`, `run-paths-find`, `snapshot-paths-find`) but not individually confirmed by this pass; locate via `discover glob` before dispatching | TBD | **T4-15a** | no | no | TBD |
| T4-15e | New oddities-entry contract — testId/route key, the line, quirk-vs-defect flag | NEW `packages/siegelense/src/contracts/driving-oddity/driving-oddity-contract.ts`(+.stub+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-15f | New read broker for the committed oddities file | NEW read broker under `packages/siegelense/src/brokers/driving-oddity/`(+.test) | **T4-15e** | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-15g | New append broker for the committed oddities file | NEW append broker under `packages/siegelense/src/brokers/driving-oddity/`(+.test) | **T4-15e** | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-17a | Delete `operating`/`operational` from the scope list (7→5) | `packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-17b | Delete the `operating`/`operational` scope bodies, rewrite the `about` line off "all seven roles" | `packages/siegelense/src/statics/docs/docs-statics.ts`(+.test) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-17c | Make `--for` optional so `docs` with none is reachable. **Open design call, not mechanical**: `docsAnswerComposeTransformer` already supports `scope: null`, but that path dumps *every* scope's text, not `about` alone — decide which decision 5 means and record it | `packages/siegelense/src/contracts/docs-args/docs-args-contract.ts`, `packages/siegelense/src/transformers/docs-args-parse/docs-args-parse-transformer.ts` (+ tests — flag: may need its own split if this grows past 3 files once drafted) | none | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-17d | Flip the `docs` call's `--for` flag off `required: true` in the help text, matching T4-17c's resolution | `packages/siegelense/src/statics/siegelense-help/siegelense-help-statics.ts`(+.test) | **T4-17c** | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-17e | Add the discoverability line to both fixer prompts | `packages/orchestrator/src/statics/siege-adversarial-fixer/siege-adversarial-fixer-statics.ts`, `.../siege-happy-fixer/siege-happy-fixer-statics.ts` (+ tests) | **T4-17c** | no | no | `--only lint,typecheck,unit -- <files>` |
| T4-17f | Add the discoverability line to both walker prompts | `packages/orchestrator/src/statics/siege-adversarial-walker/siege-adversarial-walker-statics.ts`, `.../siege-happy-walker/siege-happy-walker-statics.ts` (+ tests) | **T4-17c**; **file-lock: must run after T3-20e** (same 2 files) | no | no | `--only lint,typecheck,unit -- <files>` |

---

## Cross-track file locks (not obvious from track boundaries)

1. **T1-13b before T3-20d** — both write `packages/session-forensics/src/contracts/verification-unit/verification-unit-contract.ts` and `.../transformers/quest-to-units/quest-to-units-transformer.ts`.
2. **T3-20e before T4-17f** — both write `siege-happy-walker-statics.ts` and `siege-adversarial-walker-statics.ts`.
3. **T3-14b1 → T3-14b2 → {T3-14b3, T3-14b4}** — a forced serial chain (delete the responder, then its only caller, then the caller's stale mock entries in 4 disjoint proxy files).

---

## D1-D8 (web e2e debt, from the handoff — taken as-is, not re-derived)

Each is its own unit; 3 concurrent at most. `packages/web` is already built.

| ID | Specs |
|---|---|
| D1 | `dispatch-pause-between-specs.e2e.ts`, `bughunt-begin-transition.e2e.ts` |
| D2 | `execution-queue-streaming.e2e.ts`, `guild-delete.e2e.ts` |
| D3 | `guild-two-route-comparison.e2e.ts`, `quest-start.e2e.ts` |
| D4 | `chat-send-auto-resumes.e2e.ts`, `elapsed-duration-finished.e2e.ts` |
| D5 | `elapsed-duration-tick.e2e.ts`, `execution-panel-pause-button.e2e.ts`, `multi-widget-coexistence.e2e.ts` |
| D6 | `pause-resume-emits-lifecycle-event.e2e.ts`, `pause-resume-status-matrix.e2e.ts`, `quest-pause-resume.e2e.ts` |
| D7 | `quest-ws-update.e2e.ts`, `resume-execution-row-runs-again.e2e.ts`, `resume-starts-dispatch.e2e.ts` |
| D8 | `subagent-duration-notification-arrives.e2e.ts`, `ward-execution-streaming.e2e.ts`, `warpgate-queue-listing.e2e.ts` |

**Finding for the orchestrator to weigh, not a hard blocker:** D1-D8 fix specs that route through
`quest.harness.ts`/`session.harness.ts`. T4-7a's target (`writeQuestFile`'s silent raw-fs fallback) means
a D-unit routed through that method today can pass its lint check while still resting on the fallback
rather than the real framework path. Not a technical dependency — the lint rule grades the spec file's
own body, not the harness — but landing T4-7a/T4-7b first makes the D-unit fixes actually trustworthy
rather than merely lint-clean. Reflected in the wave order below; overridable since the handoff already
green-lit dispatching D1-D8 immediately.

---

## Stale premises found

| Document | Says | Code says | Where |
|---|---|---|---|
| `scrolls/consolidated-plan-handoff.md:217` (R26) | The third `verifyByHuman` filter site is `session-forensics/src/guards/is-track-owed-unit/is-track-owed-unit-guard.ts:49`, hardcoding the ternary | `is-track-owed-unit-guard.ts:55` is `return eligibleMethods.has(unit.verificationMethod);` — no ternary, needs no edit. The real third site is `session-forensics/src/transformers/quest-to-units/quest-to-units-transformer.ts:74` — `verificationMethod: observable.verifyByReading === true ? 'reading' : 'test',` | `packages/session-forensics/src/guards/is-track-owed-unit/is-track-owed-unit-guard.ts:55`; `packages/session-forensics/src/transformers/quest-to-units/quest-to-units-transformer.ts:74` |
| `28-independent.md` R12 / original plan 28c-3 | "Both siege walkers" are `siegemaster-verifier-statics.ts` and `siegemaster-stress-statics.ts` | Those files don't exist. `packages/orchestrator/CLAUDE.md`'s own prompt roster table names them but maps to directories absent on disk. The real files are `siege-happy-walker-statics.ts` and `siege-adversarial-walker-statics.ts` | `packages/orchestrator/src/statics/siege-happy-walker/`, `packages/orchestrator/src/statics/siege-adversarial-walker/` (confirmed via `discover glob`; `siegemaster-verifier/`, `siegemaster-stress/` return nothing) |
| `scrolls/consolidated-plan-handoff.md:184-191` (T1-15 checklist) | Lists the full T1-15 file set | Omits `packages/shared/src/contracts/quest-summary-unconfirmable/quest-summary-unconfirmable-contract.ts`, a live direct importer of `signoffContract` (`:47,60`) that breaks the build if not fixed alongside the deletion | `packages/shared/src/contracts/quest-summary-unconfirmable/quest-summary-unconfirmable-contract.ts:47,60` |
| `scrolls/consolidated-plan-handoff.md:185` | `quest-summary-build-transformer.test.ts:10` reads `signoffTracksStatics` | It's imported at **line 12**, not 10 | `packages/orchestrator/src/transformers/quest-summary-build/quest-summary-build-transformer.test.ts:12` |
| `scrolls/consolidated-plan-handoff.md:188-189` | "rewrite [`quest-summary-under-raccoon.e2e.ts`] **BEFORE** the fix lands" — implies the rename is still pending | The rename (commits `51c62c4172`, `dd9ac633d9`) already landed. The e2e is **currently red today**, for an already-shipped reason, not a future one | `packages/web/src/flows/quest-chat/quest-summary-under-raccoon.e2e.ts:164-165,194-196` vs. `packages/web/src/widgets/quest-summary/track-row-layer-widget.tsx:54-75` |
| `scrolls/seigelense/remaining-build-items.md` items 8a/8b | Both described as open findings needing a decision | Both resolved and documented in the file's own header comment, landed via `beadbededd4ca` | `packages/hydration-recipes/src/brokers/guild/write-route/guild-write-route-broker.ts:10-22,64-75` |
| `scrolls/seigelense/remaining-build-items.md` item 4a and part of 4c | Guild id and quest-route timestamps listed as unbuilt | Both done, also via `beadbededd4ca` — its subject line ("a write route cannot escape the target it was handed") frames it as a path-escape fix, burying the id-supply work in the body | `packages/hydration-recipes/src/brokers/guild/write-route/guild-write-route-broker.ts:71-75`; `.../quest/write-route/quest-write-route-broker.ts:53,55-57` |
| `scrolls/seigelense/remaining-build-items.md` item 13a | Called "the largest functional gap in the tool" | Fully shipped; `step-dispatch-broker.ts` computes the delta on every capturing verb including `look`, across all three result branches | `packages/siegelense/src/brokers/step/dispatch/step-dispatch-broker.ts:171-181,258-271,327-337` |
| `scrolls/seigelense/remaining-build-items.md` item 10f | `tmp/siegelense-wiring/recipes.md` needs fixing | Path doesn't exist (`ls` exit 2) and isn't tracked (`git ls-files tmp/` empty) — not a real unit | n/a — confirmed absent |
| `scrolls/seigelense/remaining-build-items.md` item 3 / `19a` | Pointing the guide's TRAPS heading at the oddities file is scoped together with building it | That wiring is explicitly the orchestrator plan's §9b — a different track's work, not this housekeeping unit | `scrolls/seigelense/remaining-build-items.md:145` |
| `scrolls/consolidated-plan-handoff.md` T4-15a description | Implies T4-15a needs the same "nothing else in flight" treatment as a `packages/shared` barrel unit | It's operator-only for a narrower reason (ESLint loads `@dungeonmaster/shared/statics` with no source condition, so lint needs a rebuild) — it doesn't add/remove a barrel export line, so it can run alongside other non-lint-dependent work; only lint-grading of T4-15b/c/d must wait for the rebuild | `packages/shared/src/statics/locations/locations-statics.ts:60` |
| Original `consolidated-plan.md` Track 4 unit 10 | Files `guild-add-broker.ts`, `quest-hydrate-broker.ts` | `guild-add-broker.ts`'s id-supply half is done (T4-10a); what remains (T4-10b) is entirely inside `packages/orchestrator` — `quest-blueprint-contract.ts` and `quest-hydrate-broker.ts` | `packages/orchestrator/src/contracts/quest-blueprint/quest-blueprint-contract.ts`; `packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.ts:93,150,159,180` |

---

## Dispatch order

**Operator-only, run with nothing else in flight, before or between waves:**
- **O1 — T4-13a**: `npm install` (regenerates `package-lock.json`)
- **O2 — T1-15a**: barrel deletion (signoff/signoff-track/signoff-verdict contracts) — solo wave, nothing else in the repo running
- **O3 — T1-15b**: barrel deletion (signoff-tracks-statics + renames) — solo wave, after O2
- **O4 — T4-15a**: `locations-statics.ts` edit, operator-authored, then `npm run build --workspace=@dungeonmaster/shared`

**Waves (≤3 concurrent, no file overlap within a wave):**

| Wave | Units |
|---|---|
| 1 | T1-13a, T3-13b, T4-8 |
| 2 | T1-13b, T3-14b1, T4-5 |
| 3 | T3-14b2, T3-14c, T4-10b |
| 4 | T3-14b3, T3-14b4, T3-15a |
| 5 | T3-15b, T3-15c, T3-15d |
| 6 | T3-20a, T3-20b, T4-12b |
| 7 | T3-20c, T3-20e, T4-12c |
| 8 | T3-20d, T3-21b1, T4-13b |
| 9 | T3-21b2, T4-13c, T4-13d |
| 10 | T4-13e, T4-13f, T4-16d |
| 11 | T1-15c, T4-7a, T4-7b |
| 12 | T4-15b, T4-15c, T4-15d |
| 13 | T4-15e, T4-15f, T4-15g |
| 14 | T4-17a, T4-17b, T4-17c |
| 15 | T4-17d, T4-17e, T4-17f |
| 16 | D1, D2, D3 |
| 17 | D4, D5, D6 |
| 18 | D7, D8 |
| 19 | T3-21c, T4-11 |

**Then Track 2** (0 of 13 done, entirely unstarted, out of scope for this document) **begins.**

T4-15h (the three stale-fixture test files) is unscheduled — its exact files weren't confirmed by
research; locate via `discover` before slotting it into a wave alongside T4-15b/c/d.
