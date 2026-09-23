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

---

## Owner decision added mid-run — remove the `glyphsmith` role

The owner ruled: remove the `'glyphsmith'` role value itself, not only the design chat that used it.
It comes out of `packages/shared/src/statics/work-item-role/work-item-role-statics.ts`, the HOMEBASE row in
`execution-floor-config-statics.ts`, and every place that lists it alongside `chaoswhisperer` / `bughunt`.

| ID | Goal | Runs |
|---|---|---|
| T3-16a | Survey every `glyphsmith` reference repo-wide and split the removal into 1-3 file units | read-only, any time |
| T3-16b+ | The removal units the survey defines | after the orchestrator T3-15 / T3-20 / T4-10b agents land; the `shared` edit runs with nothing else in flight |

---

## T3-16 — glyphsmith role removal, units

107 occurrences of `glyphsmith` (case-insensitive) found under `packages/**`, `docs/**`, `playbook/**`
and the root `CLAUDE.md`s. None in `.claude/` (only generated settings there, skipped) and none in the
root `CLAUDE.md` itself. Classified: the enum source (`work-item-role-statics.ts`); three maps/lists
keyed by role that a colocated test pins to an exact shape (`role-to-model-statics.ts`,
`execution-step-status-config-statics.ts`, `execution-floor-config-statics.ts`); one live functional
comparison in a test proxy (`chat-spawn-broker.proxy.ts`'s `setupGlyphsmithSession`); a long tail of
`WorkItemRoleStub`/`WorkItemStub` literals and `describe`/`it` blocks across orchestrator and server
tests; and prose — purpose-comments, package `CLAUDE.md`s, and `docs/`/`playbook/` narrative.

**Surprising finding:** the three "map keyed by role" statics are **not** typecheck-forced the way the
task brief expected. `role-to-model-statics.ts` is checked via
`roleToModelStatics satisfies Record<ClaudeSpawnRole, ClaudeModel>` in
`role-to-model-transformer.ts:30-31` — but `satisfies`'s excess-property check only fires on a *fresh*
object literal written at the checked position, and here the checked expression is an identifier
reference to a `const` declared elsewhere. A stale `glyphsmith: 'opus'` left behind after the enum
shrinks is an allowed *extra* property, not a compile error — `Record<K,V>` assignability doesn't forbid
extra keys structurally. Same reasoning for `executionStepStatusConfigStatics.roleColors[role]` and
`executionFloorConfigStatics.floors.find(f => f.role === role)` in
`role-to-config-index-transformer.ts:29-31`: indexing/comparing with the *narrower*, post-shrink
`WorkItemRole` union against an object/array that still carries an extra `glyphsmith` entry typechecks
fine either way. What actually breaks if these three are left stale is their own **colocated unit
test** (`toStrictEqual` against a hand-written literal, or an exact-length array comparison) — a
test-green concern, not a typecheck one, and satisfied by editing each statics file together with its
own `.test.ts` in one unit, independent of when the enum itself moves.

What **is** unavoidably typecheck-forced, the moment `work-item-role-statics.ts` loses the `'glyphsmith'`
member: every `WorkItemRoleStub({ value: 'glyphsmith' })` / `WorkItemStub({ role: 'glyphsmith' })` /
`role === 'glyphsmith'` literal anywhere in the tree, because each compares or assigns the string literal
against a position typed `WorkItemRole`, and ward's `tsc --noEmit` grades a touched package **whole**
(per `<dungeonmaster-ward>`) — so one straggler anywhere in a package fails that package's typecheck the
moment the enum unit lands, even in a file this pass never touched.

### Units

| ID | Files | Package | Depends on | Ward command |
|---|---|---|---|---|
| T3-16b | `execution-step-status-config-statics.ts`, `execution-step-status-config-statics.test.ts` | web | none | `npm run ward -- --only lint,typecheck,unit -- packages/web/src/statics/execution-step-status-config/execution-step-status-config-statics.ts packages/web/src/statics/execution-step-status-config/execution-step-status-config-statics.test.ts` |
| T3-16c | `widgets/chat-message/chat-message-widget.test.tsx` | web | none | `npm run ward -- --only lint,typecheck,unit -- packages/web/src/widgets/chat-message/chat-message-widget.test.tsx` |
| T3-16d | `statics/role-to-model/role-to-model-statics.ts`, `role-to-model-statics.test.ts` | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/statics/role-to-model/role-to-model-statics.ts packages/orchestrator/src/statics/role-to-model/role-to-model-statics.test.ts` |
| T3-16e | `statics/tavernkeeper-prompt/tavernkeeper-prompt-statics.ts` | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/statics/tavernkeeper-prompt/tavernkeeper-prompt-statics.ts` |
| T3-16f | `transformers/quest-active-session/quest-active-session-transformer.ts`, `.test.ts` | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/transformers/quest-active-session/quest-active-session-transformer.ts packages/orchestrator/src/transformers/quest-active-session/quest-active-session-transformer.test.ts` |
| T3-16g | `transformers/chat-prompt-build/chat-prompt-build-transformer.test.ts` (delete the `'glyphsmith role'` describe block — the source `.ts` has no literal to touch, its error message interpolates `${role}` generically) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/transformers/chat-prompt-build/chat-prompt-build-transformer.test.ts` |
| T3-16h | `transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts`, `.test.ts` | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.test.ts` |
| T3-16i | `brokers/agent/launch/agent-launch-broker.ts` (purpose-comment only) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/agent/launch/agent-launch-broker.ts` |
| T3-16j | `brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts`, `.test.ts` | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts packages/orchestrator/src/brokers/quest/build-relay-graph/quest-build-relay-graph-broker.test.ts` |
| T3-16k | `brokers/quest/find-by-session-id/quest-find-by-session-id-broker.ts` (comment only) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/find-by-session-id/quest-find-by-session-id-broker.ts` |
| T3-16l | `brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts`, `.proxy.ts` (both comment only) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy.ts` |
| T3-16m | `brokers/quest/orchestration-loop/quest-orchestration-loop-broker.test.ts` (4 `WorkItemStub({role: 'glyphsmith'})` sites) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.test.ts` |
| T3-16n | `brokers/quest/orchestration-loop/run-chat-layer-broker.test.ts` | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/quest/orchestration-loop/run-chat-layer-broker.test.ts` |
| T3-16o | `brokers/chat/stream-process-handle/chat-stream-process-handle-broker.ts` (comment only) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/chat/stream-process-handle/chat-stream-process-handle-broker.ts` |
| T3-16p | `brokers/chat/spawn/chat-spawn-broker.test.ts`, `chat-spawn-broker.proxy.ts` (delete `setupGlyphsmithSession` and its `'glyphsmith has no chat prompt'` describe block — this proxy method is the one place a `role === 'glyphsmith'` comparison is live code, not prose) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.test.ts packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.proxy.ts` |
| T3-16q | `brokers/chat/spawn/resolve-chat-quest-layer-broker.test.ts` (comment only) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/chat/spawn/resolve-chat-quest-layer-broker.test.ts` |
| T3-16r | `responders/followup-chat/start/followup-chat-start-responder.proxy.ts` (comment only) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/responders/followup-chat/start/followup-chat-start-responder.proxy.ts` |
| T3-16s | `responders/chat/replay/chat-replay-responder.ts` (comment only) | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts` |
| T3-16t | `responders/orchestration/start/orchestration-start-responder.ts`, `.test.ts` | orchestrator | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.ts packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.test.ts` |
| T3-16u | `packages/orchestrator/CLAUDE.md` (prose: `## Callouts` roster note, the two-source-correlation "legacy spawn path" line, the ledger-seeding paragraph, the Agent Roles table's `Glyphsmith` row and the status-table `explore_design`/`review_design` rows) | orchestrator (doc) | none | `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/CLAUDE.md` (doc-only; expect a no-op/skip) |
| T3-16v | `brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker.ts` (comment), `.test.ts` (test-name string only, no literal role value constructed) | server | none | `npm run ward -- --only lint,typecheck,unit -- packages/server/src/brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker.ts packages/server/src/brokers/quest/wait-for-session-stamp/quest-wait-for-session-stamp-broker.test.ts` |
| T3-16w | `flows/quest/quest-flow.integration.test.ts` (test-name string only) | server | none | `npm run ward -- --only lint,typecheck,integration -- packages/server/src/flows/quest/quest-flow.integration.test.ts` |
| T3-16x | `responders/quest/chat/quest-chat-responder.ts`, `responders/server/init/server-init-responder.ts` (both comment only) | server | none | `npm run ward -- --only lint,typecheck,unit -- packages/server/src/responders/quest/chat/quest-chat-responder.ts packages/server/src/responders/server/init/server-init-responder.ts` |
| T3-16y | `responders/quest/comment-batch/quest-comment-batch-responder.test.ts` (`WorkItemStub({role: 'glyphsmith', sessionId})`) | server | none | `npm run ward -- --only lint,typecheck,unit -- packages/server/src/responders/quest/comment-batch/quest-comment-batch-responder.test.ts` |
| T3-16z | `brokers/ask/user-question/ask-user-question-broker.ts` (comment only) | mcp | none | `npm run ward -- --only lint,typecheck,unit -- packages/mcp/src/brokers/ask/user-question/ask-user-question-broker.ts` |
| T3-16aa | `brokers/quest/ingredient/quest-ingredient-broker.ts` (comment only) | hydration-recipes | none | `npm run ward -- --only lint,typecheck,unit -- packages/hydration-recipes/src/brokers/quest/ingredient/quest-ingredient-broker.ts` |
| T3-16ab | `packages/testing/CLAUDE.md` (prose: the `activeSessionId` lookup note and the feature-quest matching example) | testing (doc) | none | `npm run ward -- --only lint,typecheck,unit -- packages/testing/CLAUDE.md` (doc-only; expect a no-op/skip) |
| T3-16ac | `docs/quest-role-paths.md` (prose: the ENTRY-family comment, the Agent Roles table's `Glyphsmith` row, the status-transition line) | docs | none | `npm run ward -- --only lint,typecheck,unit -- docs/quest-role-paths.md` (doc-only; expect a no-op/skip) |
| T3-16ad | `playbook/smoketest-mcp-orchestration.md` (role list + count — update "11" to "10"; and the `glyphsmith-prompt` mention, which names no file that exists on disk and may already be stale independent of this removal), `playbook/quest-lifecycle.md` (the intake force-complete line) | playbook | none | `npm run ward -- --only lint,typecheck,unit -- playbook/smoketest-mcp-orchestration.md playbook/quest-lifecycle.md` (doc-only; expect a no-op/skip) |
| T3-16ae | `statics/execution-floor-config/execution-floor-config-statics.ts` (drop the `{ name: 'HOMEBASE', role: 'glyphsmith', type: 'entrance' }` row), `.test.ts` | shared | none | `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/statics/execution-floor-config/execution-floor-config-statics.ts packages/shared/src/statics/execution-floor-config/execution-floor-config-statics.test.ts` |
| T3-16af | `guards/is-chat-work-item-role/is-chat-work-item-role-guard.ts`, `guards/has-incomplete-quest-work/has-incomplete-quest-work-guard.ts` (both comment only — neither hardcodes the roster, both derive from `workItemRoleStatics.chat`) | shared | none | `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/guards/is-chat-work-item-role/is-chat-work-item-role-guard.ts packages/shared/src/guards/has-incomplete-quest-work/has-incomplete-quest-work-guard.ts` |
| T3-16ag | `contracts/work-item/work-item-contract.ts` (comment only) | shared | none | `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/contracts/work-item/work-item-contract.ts` |
| **T3-16ah** | `statics/work-item-role/work-item-role-statics.ts` **(the enum — drop `'glyphsmith'` from both `names` and `chat`, and its Role-semantics doc-comment bullet)**, `work-item-role-statics.test.ts`, `contracts/work-item-role/work-item-role-contract.test.ts` (drop the `'VALID: glyphsmith => parses successfully'` case) | shared | **T3-16b through T3-16ag, all of them** | `npm run ward -- --only lint,typecheck,unit -- packages/shared/src/statics/work-item-role/work-item-role-statics.ts packages/shared/src/statics/work-item-role/work-item-role-statics.test.ts packages/shared/src/contracts/work-item-role/work-item-role-contract.test.ts`, then a bare `npm run ward` as the regression pass |

**Not touched — not about the role:**

- `playbook/e2e-flakiness-log.md:754` — a dated incident writeup ("In the failure log, server
  timestamps..." / "**Fix location:**") describing `quest-wait-for-session-stamp-broker`'s poll
  condition *as it stood when that fix landed*. It's a historical record of a specific past bug, the
  same category the task brief exempts for `scrolls/` — editing it to retroactively read
  "chaoswhisperer/bughunt" would misreport what the fix actually checked at the time. Leave it.

### Ordering rationale

**Consumers first, enum last, as one serial unit — not interleaved.** The brief offered two options;
this plan takes the first for everything except the enum's own file pair, and folds *that* into the
second option's shape for just those three files.

Reasoning: per the surprising finding above, none of the b..ag units are actually order-coupled to the
enum at the *typecheck* level — a stale `'glyphsmith'` key left in a `satisfies`-checked map, or a
stale array entry compared with `===`, does not fail `tsc`. What DOES fail once the enum shrinks is any
file — anywhere in the touched package — still holding a bare `'glyphsmith'` string literal in a
position typed `WorkItemRole` (a stub call, a direct comparison), because ward's typecheck grades a
touched package whole. Since T3-16b through T3-16ag between them remove *every* such literal across
every package that has one, landing all of them before T3-16ah guarantees the enum edit is the single
commit where the union actually shrinks — and because nothing typed against the old, wider
`WorkItemRole` is left anywhere in the tree at that point, the repo typechecks at every commit,
including the one that removes `'glyphsmith'` itself. Doing it the other way — shrinking the enum
first — would leave every one of those ~15 not-yet-cleaned files red the moment T3-16ah lands, for
however many waves it takes the rest to catch up.

T3-16ae (`execution-floor-config-statics.ts`) is listed among the consumer units rather than bundled
into T3-16ah despite being named explicitly in the owner's decision — it has no typecheck coupling to
the enum (same `satisfies`/`===` reasoning), only a test-shape coupling to its own colocated `.test.ts`,
so it is safe and simpler to land on its own.

Units b..ag carry no `depends-on` among each other — none share a file, and package-scoped `tsc --noEmit`
means a straggler in package X only threatens package X's own typecheck, not a sibling's. They can run
in any order or concurrently. T3-16ah is the sole hard dependency: run it last, after every other unit
in this section has landed, then close with a bare `npm run ward` regression pass per
`<dungeonmaster-wardDiscipline>`'s "who owns a FULL run" (that pass belongs to whoever dispatches these
units, not to T3-16ah itself).

---

## T5-1 — role-path coverage for the step graph

Source: `packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts` (`agentFlowStatics`) —
the step graph inside each of the six families. `docs/quest-role-paths.md` was read in full (1118
lines). Coverage was checked against every `*.integration.test.ts` under `packages/orchestrator`
(39 files); `*.test.ts` unit tests of `nextActionTransformer` and its neighbours are NOT counted —
they exercise the router's pure logic in isolation, never a real dispatch through a persisted
`quest.json`, so they cannot stand in for "an integration test exercises this path end to end."

**Every step declares `wall: '@blocked'`; that route is identical everywhere (§ (d) of the doc) and is
folded into each step's row rather than argued per family.** An outcome word a step's `routes` object
does not list is not absent from the graph — it returns automatically to the step that minted the
work item (`mintedBy`) — so a `—` in the table below means "return-to-minter," a real, load-bearing
edge, not a hole.

### Coverage table — every step, every family

32 steps, 89 declared `(step, outcome)` routes (the `wall: '@blocked'` edge counted once per step).

| Family.step | Role | Kind | Prompt / handler | `done` → | `unmet` → | `empty` → | Doc status | Behavioural integration coverage |
|---|---|---|---|---|---|---|---|---|
| codeweaver.plan | planner | prompt | `codeweaver-planner` | work | — | `@done` | documented | **YES** — `quest-flow.integration.test.ts:1383` |
| codeweaver.work | worker | prompt | `codeweaver-worker` | review | work | — | documented | none |
| codeweaver.review | reviewer | prompt | `codeweaver-reviewer` | commit | work | — | documented | none |
| codeweaver.commit | worker | deterministic (`commit`) | — | ward | — | ward | documented | none |
| codeweaver.ward | reviewer | deterministic (`ward`, `--committed --uncommitted`) | — | `@done` | repair | `@done` | documented | **PARTIAL, flagged** — see note 1 |
| codeweaver.repair | worker | prompt | `spiritmender` | — | repair | — | documented | none |
| flowrider.recipe | planner | prompt (on-request) | `recipe-maker` | — | — | — | documented | none |
| flowrider.plan | planner | prompt | `flowrider-planner` | work | — | `@done` | documented | none |
| flowrider.work | worker | prompt (maxConcurrent 4, browser-pieces) | `flowrider-worker` | review | work | — | documented | none |
| flowrider.review | reviewer | prompt | `flowrider-reviewer` | commit | work | — | documented | none |
| flowrider.commit | worker | deterministic (`commit`) | — | ward | — | ward | documented | none |
| flowrider.ward | reviewer | deterministic (`ward`) | — | `@done` | repair | `@done` | documented | none |
| flowrider.repair | worker | prompt | `spiritmender` | — | repair | — | documented | none |
| siegemaster.sweepIn | worker | deterministic (`cleanup`) | — | plan | — | plan | documented | none |
| siegemaster.recipe | planner | prompt (on-request) | `recipe-maker` | — | — | — | **missing** | none |
| siegemaster.read | worker | prompt (on-request) | `siegemaster-reader` | — | — | — | **missing** | none |
| siegemaster.plan | planner | prompt | `siege-planner` | happyWalk | — | sweepOut | documented | none |
| siegemaster.happyWalk | reviewer | prompt (needsLane) | `siege-happy-walker` | adversarial | fixHappy | — | documented (step named; prompt name absent) | none |
| siegemaster.fixHappy | worker | prompt | `siege-happy-fixer` | — | fixHappy | — | documented (step named; prompt name absent) | none |
| siegemaster.adversarial | reviewer | prompt (needsLane) | `siege-adversarial-walker` | commit | fixAdversarial | — | documented (step named; prompt name absent) | none |
| siegemaster.fixAdversarial | worker | prompt | `siege-adversarial-fixer` | — | fixAdversarial | — | documented (step named; prompt name absent) | none |
| siegemaster.commit | worker | deterministic (`commit`) | — | ward | — | ward | documented | none |
| siegemaster.ward *(CLOSE_OUT overridden)* | reviewer | deterministic (`ward`) | — | sweepOut | repair | sweepOut | documented (only via the E2E ASCII diagram — no prose states the override) | none |
| siegemaster.repair | worker | prompt | `spiritmender` | — | repair | — | documented | none |
| siegemaster.sweepOut | worker | deterministic (`cleanup`) | — | `@done` | — | `@done` | documented | none |
| wardFull.gate | reviewer | deterministic (`ward`, no args) | — | `@done` | repair | `@done` | documented | none |
| wardFull.repair | worker | prompt | `spiritmender` | commit | repair | — | documented | none |
| wardFull.commit | worker | deterministic (`commit`) | — | gate | — | gate | documented | none |
| riftcarver.carve | reviewer | deterministic (`riftcarver`) | — | `@done` | repair | — | documented | none — see note 2 |
| riftcarver.repair | worker | prompt | `spiritmender` | commit | repair | — | documented | none — see note 2 |
| riftcarver.commit | worker | deterministic (`commit`) | — | carve | — | carve | documented | none — see note 2 |
| warpgate.merge | worker | prompt | `warpgate` | `@done` | merge | — | documented | none |

**Totals** — 89 `(step, outcome)` routes; **87 documented**, **2 missing** (`siegemaster.recipe`,
`siegemaster.read` — never named anywhere in `docs/quest-role-paths.md`, not even as "siege also has
an on-request recipe/reader step" by cross-reference to flowrider's own paragraph, which DOES name
`recipe`); **3 have real behavioural `*.integration.test.ts` coverage** (`codeweaver.plan`'s `done`
route, and two of `codeweaver.ward`'s routes under note 1's caveat) out of 89. **Every siege-family
route — the exact gap the plan's loose ends named — has zero integration coverage**; the only siege
material any `*.integration.test.ts` file touches is `quest-handle-signal-back-responder.integration.test.ts`'s
`siegemasterSignoff`-gate-removal cases (`role: 'siegemaster'`, no `step` field), which assert the
sign-off gate, never step routing — see note 3.

**Note 1 — `codeweaver.ward`'s test may not be testing the step this table names it against.**
`quest-flow.integration.test.ts`'s `'ward operation item — green advances the relay'` (line 1697) and
`'ward operation item — red inserts a spiritmender then a fresh ward'` (line 1782) seed a STANDALONE
operation item with `role: 'ward', text: 'ward (committed)'` and a work item with `role: 'ward'` — NOT
a work item with `step: 'ward'` nested inside a `role: 'codeweaver'` scope, which is the actual shape
`agentFlowStatics.codeweaver.steps.ward` describes (CLAUDE.md: "a `commit` step inside a codeweaver
scope reads `role: 'codeweaver'`" — the same is true of `ward`). The red-ward case's own assertion —
"the fresh ward is the SAME scope continued, which its `pt N:` text is what now says" — mints a BRAND
NEW operation item (`pt 2: ward (committed)`) rather than looping `repair` back to the SAME operation
item's `ward` step the way `agentFlowStatics.codeweaver.steps.repair` (no `done` route, returns to its
minter) says it should. This test drives a REAL responder against REAL disk and DOES prove some ward
gate's `done`→advance and `unmet`→repair(+refresh) behaviour — it is not wiring-only — but whether it
is proving `agentFlowStatics.codeweaver.steps.ward`'s OWN route, or a separate, older "family-less
committed-ward-with-pt-continuation" mechanism the current step graph has since superseded, was not
resolved in this pass. Flagged for whoever picks up T5-1e below to settle before extending it.

**Note 2 — riftcarver's underlying git mechanics ARE integration-tested; its step-graph ROUTING is
not.** `worktree-prepare-broker.integration.test.ts`, `worktree-ensure-quest-branch-broker.integration.test.ts`,
`worktree-populate-node-modules-broker.integration.test.ts` and `worktree-resume-restore-broker.integration.test.ts`
drive the real `git worktree add` / mirror / resume mechanics `stepHandlerRunBroker`'s `riftcarver`
handler calls — real coverage of RIFT-1/RIFT-2's done-check discipline. None of them go through
`questRouteScopeBroker` or assert that a `carve` outcome mints a `repair` work item on the SAME
operation item, or that `repair`'s `done` returns to `carve` and `carve` re-runs — the ROUTING this
table is about. "none" in the table means no test proves the ROUTE; it does not mean riftcarver is
untested.

**Note 3 — wiring-only / off-target tests that were ruled out, not silently skipped.**
`quest-handle-signal-back-responder.integration.test.ts` seeds `role: 'codeweaver'` / `'flowrider'` /
`'siegemaster'` operation items with a single work item carrying **no `step` field at all** and signals
`operationStatus: 'done'` directly — proving the (now-removed) blight-ledger and sign-off completion
gates don't block completion. That is real, valuable coverage of a DIFFERENT surface (the gates
`QuestHandleSignalBackResponder` itself enforces), and it was read in full before being excluded here —
it asserts real persisted values, so it is not "wiring-only" in the sense the brief means, but it does
not exercise `agentFlowStatics` routing at all (no step, no `nextActionTransformer` decision to make),
so it cannot be quoted as coverage of any row in the table above.

### Units to close the gaps

Doc unit first (single file, so it cannot collide with anything), then four integration-test units —
each a NEW file so no two units in this section touch the same path, and each independently
dispatchable/parallel. Naming follows the "related-but-separate spec file" precedent the orchestrator
package's own CLAUDE.md documents for `chat-streaming-subagent-grouping.spec.ts` /
`chat-replay-subagent-grouping.spec.ts`, applied to `quest-route-scope-broker` — the broker
`questRouteScopeBroker` (`packages/orchestrator/src/brokers/quest/route-scope/`) is the direct,
un-wrapped surface for this: it takes a quest + scope and returns/persists exactly the `NextAction`
`nextActionTransformer` computed, which is the router decision this whole table is about. Driving IT
directly (real testbed, real `quest.json`, no HTTP/MCP layer in between) is a smaller, more targeted
integration surface than routing every case through `QuestFlow`.

| ID | Goal | Files | Deps | Ward |
|---|---|---|---|---|
| T5-1b | Fill the two doc gaps: name `siegemaster.recipe`/`siegemaster.read` (never mentioned) in the siegemaster paragraph, and name each siege step's PROMPT (`siege-happy-walker`, `siege-happy-fixer`, `siege-adversarial-walker`, `siege-adversarial-fixer`, `siegemaster-reader`) the way the doc already names `spiritmender`/`warpgate` for their steps. State the `ward` CLOSE_OUT override in prose, not only in the ASCII diagram | `docs/quest-role-paths.md` | none | n/a (docs) |
| T5-1c | Siege step-chain integration coverage — the gap the plan's loose ends named. Drive `questRouteScopeBroker` against a real testbed quest seeded at each of: `sweepIn`(done/empty)→`plan`; `plan`(done)→`happyWalk`, `plan`(empty)→`sweepOut`; `happyWalk`(unmet)→`fixHappy`, `fixHappy`(unmet loop), a `fixHappy` `done`-equivalent (no route) returning to `happyWalk`; `happyWalk`(done, ALL pieces drained)→`adversarial` — the phase-order rule SIEGE tests nothing else proves end to end; `adversarial`(unmet)→`fixAdversarial`, loop, return-to-`adversarial`; `adversarial`(done)→`commit`; the overridden `ward`(done/empty)→`sweepOut`, `ward`(unmet)→`repair`; `sweepOut`(done/empty)→`@done`. Assert the MINTED work item's step, role, `assignedUnitIds`/`pieceId` and the operation item's status — not that a callback fired | NEW `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-siegemaster.integration.test.ts` | none | `npm run ward -- --only lint,typecheck,integration -- packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-siegemaster.integration.test.ts` |
| T5-1d | Flowrider step-chain integration coverage — `recipe` minted on-request and returning to its requester; `plan`(done)→`work`, `plan`(empty)→`@done`; `work`(unmet loop), `work`(done)→`review`; `review`(unmet)→`work`, `review`(done)→`commit`; `commit`(done/empty)→`ward`; `ward`(done/empty)→`@done`, `ward`(unmet)→`repair`→ returns to `ward` | NEW `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-flowrider.integration.test.ts` | none | `npm run ward -- --only lint,typecheck,integration -- packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-flowrider.integration.test.ts` |
| T5-1e | Codeweaver's remaining step-graph gaps (`plan`'s `done` route and one flavor of `ward` are already covered — see the coverage table and note 1). Cover: `work`(unmet loop), `work`(done)→`review`; `review`(unmet)→`work`, `review`(done)→`commit`; `commit`(done/empty)→`ward`; and — the part that makes this unit worth doing before T5-1c/d get trusted as a pattern — settle note 1: seed `codeweaver.ward`'s `unmet` route as a work item with `step: 'ward'` NESTED in a `role: 'codeweaver'` operation item (not a standalone `role: 'ward'` scope) and confirm whether `repair` returns to the SAME operation item's `ward` step, or whether the existing `'ward operation item — red …'` test's `pt N:`-continuation shape is what actually runs in production for this case. Record the finding as a comment on whichever test asserts it | NEW `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-codeweaver.integration.test.ts` | none | `npm run ward -- --only lint,typecheck,integration -- packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-codeweaver.integration.test.ts` |
| T5-1f | wardFull, riftcarver and warpgate ROUTING (distinct from riftcarver's already-covered git mechanics — see note 2): `gate`(done/empty)→`@done`, `gate`(unmet)→`repair`→`commit`→`gate`; `carve`(unmet)→`repair`→`commit`→`carve`, `carve`(done)→`@done`; `merge`(unmet loop), `merge`(done)→`@done`. Three small families sharing one file is deliberate — each alone is too small (7 steps, ~25 routes combined) to justify its own file | NEW `packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-wardfull-riftcarver-warpgate.integration.test.ts` | none | `npm run ward -- --only lint,typecheck,integration -- packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker-wardfull-riftcarver-warpgate.integration.test.ts` |

T5-1b carries no dependency and no file overlap with T5-1c..f, so all five units run in parallel.
None of T5-1c..f share a file with each other or with T5-1b. Close with `npm run ward -- --only
integration -- packages/orchestrator/src/brokers/quest/route-scope` as the section's own regression
pass once all five land, per `<dungeonmaster-wardDiscipline>`'s scoping rule.

---

## Track 2 — the execution panel, units

Verified against current code, not against `27-ui.md` or the handoff's own re-statement of it — both
predate part of what has since landed. **Headline finding: Track 2 is not "0 of 13" any more.** Track 1's
summary-widget rewrite silently finished two of these units as a side effect, and the operation-item
shape it and an earlier, larger step-graph landing left behind means a third unit (the ward-mode half of
T2-7) now has zero remaining scope. All three are struck below with evidence, not assumed.

### Already done — strike from the remaining count

| Unit | Evidence |
|---|---|
| **T2-6** (UNCONFIRMABLE debt list) | `packages/web/src/widgets/quest-summary/quest-summary-widget.tsx:154-173` renders `QUEST_SUMMARY_SECTION_DEBT` mapping `data.debt` through `DebtRowLayerWidget`; `packages/web/src/widgets/quest-summary/debt-row-layer-widget.tsx:38-79` renders `[mark] [track] unitId`, the evidence line, and branches on `entry.toSettle === undefined` between `QUEST_SUMMARY_DEBT_SUCCESSOR` ("nothing hands this over…") and `QUEST_SUMMARY_DEBT_TO_SETTLE` — exactly R17's "two marks" and the three-verdict vocabulary. The file is not named `unconfirmable-row-layer-widget.tsx` any more (see stale-premise #6 below) |
| **COVERAGE section** (originally T2-5, already retired by R23 as a dup of T1-9 — confirmed, not just trusted) | `quest-summary-widget.tsx:110-129` renders `QUEST_SUMMARY_SECTION_COVERAGE`; `flow-row-layer-widget.tsx:24-41` renders one row per flow; `track-row-layer-widget.tsx:32-82` renders all FOUR counts per track — `met`, `cantMeet`, `unmet`, `outstanding`, each its own testid/colour, matching R1 and R2 exactly |
| **T2-7's ward-mode half** | Only ONE of the two sites `27-ui.md` names still exists. `ward-result-row-layer-widget.tsx:40-41` — `` Ward exit code: {exitCode}{wardMode ? ` (${wardMode})` : ''} `` — is verbatim what `27-ui.md:149-150` and the handoff both cite, and it is real. The OTHER site, `operation-row-layer-widget.tsx:104-112` (`OPERATIONS_LEDGER_ROW_WARD_MODE`), does not exist in current code — the file (read in full) has no `operation.wardMode` reference anywhere, its own test file (`operation-row-layer-widget.test.tsx`, read in full) asserts no such testid, and `operationItemContract` (`packages/shared/src/contracts/operation-item/operation-item-contract.ts:25-70`) carries no `wardMode` field at all. Under the family-graph now live (`packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts`), only `wardFull` is ever `role: 'ward'` on the ledger — a per-family committed ward is a STEP inside another scope's own operation item, not a second ledger row — so there is nothing left for an operation-row ward-mode tag to disambiguate. **This half of the unit has zero remaining scope.** |
| **T2-7's retry-badge half** | `execution-row-layer-widget.tsx:337-350` — `data-testid="execution-row-retry-badge"`, `` retry {attempt}/{maxAttempts} ``. Confirmed live, matching the handoff |
| **T2-8** (already merged into T2-7 by R8) | `operations-ledger-widget.tsx` and `operation-row-layer-widget.tsx` (both read in full) already render against the current `OperationItem` shape with no legacy field references, and `execution-panel-widget.tsx`'s own imports (lines 43-64) confirm the EXECUTION tab no longer imports `OperationsLedgerWidget` at all — matching `27-ui.md:158-160`'s own claim exactly |

**T2-7 is therefore reduced to nothing.** Its remaining scope after subtracting the above is empty — do
not dispatch it. If a future ward-mode disambiguator turns out to be wanted on the ledger row after all,
that is a new unit against a design question ("what distinguishes two ledger rows of the same scope now
that `wardMode` is gone"), not a continuation of T2-7 as scoped.

### The forced serial chain — confirmed, and tighter than stated

The handoff names one shared file (`execution-row-layer-widget.tsx`). Reading all five units' owning
files shows **two** shared files force the same order, not one: `execution-row-layer-widget.tsx` AND
`execution-work-item-row-layer-widget.tsx` — 27a's own OWNS block (`27-ui.md:31-40`) names both as row-identity
files, and T2-3/T2-11 read/write the work-item widget too (it is where `depLabels`, `observablesSatisfied`
wiring and the scope-label derivation all live). The order itself is confirmed correct:

`T2-1` (execution-panel-widget.tsx, execution-work-item-row-layer-widget.tsx, execution-row-layer-widget.tsx)
→ `T2-11` (execution-row-layer-widget.tsx, execution-work-item-row-layer-widget.tsx)
→ `T2-10` (execution-row-layer-widget.tsx's `EXPANDABLE_STATUSES` array, execution-step-status-config-statics.ts)
→ `T2-3` (execution-row-layer-widget.tsx, execution-work-item-row-layer-widget.tsx)
→ `T2-9` (execution-row-layer-widget.tsx, execution-row-subtitle-transformer.ts, execution-step-status-config-statics.ts, execution-work-item-row-layer-widget.tsx)

No two of these five can run concurrently with each other. T2-9 itself exceeds the 1-3-files rule (4
files) and splits below into T2-9a/T2-9b, which do NOT share a file with each other and so are the one
place in the chain where two "chain" units can run in the same wave.

### T2-1 — row identity, reworked to decision 2's four-tier rule

**Goal:** replace the existing scope-plus-parenthesized-disambiguator naming in the execution panel with
the four-tier label decision 2 and the handoff specify (bare / step / `step - piece` / `step pt: N`),
using real `agentFlowStatics` step keys.

**Files (all confirmed to exist):** `packages/web/src/widgets/execution-panel/execution-panel-widget.tsx`,
`packages/web/src/widgets/execution-panel/execution-work-item-row-layer-widget.tsx`,
`packages/web/src/widgets/execution-panel/execution-row-layer-widget.tsx`.

**Deps:** none upstream in Track 2; first in the forced chain.

**NOT DONE — confirmed, and the gap is structural, not cosmetic.** Current code (read in full) already
groups visible work items by scope (an `operations/<id>` ref, or the role) and, within a scope holding 2+
items, sub-groups by `step`, escalating to the live `sessionId`/work-item id only when two siblings share
BOTH scope and step (`execution-panel-widget.tsx:276-312`). But the rendered name is always
`` `${scopeLabel}${sessionDisambiguator ? ` (${sessionDisambiguator})` : ''}` `` —
`execution-work-item-row-layer-widget.tsx:135-140` — i.e. the scope name repeats on every row, with the
step (or a raw session/work-item id) parenthesized after it. Decision 2's worked example instead shows
the scope name carried ONCE (an "operation row") with child rows underneath reading the step alone,
`work - login broker`, or `walk pt: 1` — a real-vs-piece-name tier and a `pt: N` numeric tail that
nothing in current code produces (the escalation tier renders `wi.sessionId ?? wi.id`, not `pt: N`).
**Flag to whoever picks this up:** decision 2's worked example is ambiguous about whether "the operation
row carries the piece name once" means a genuinely nested/indented render (a nesting the panel's own
docstring — "the execution tab is ONE numbered list" — does not currently have) or a flat list where only
the FIRST row of a scope shows the full name. Dry-run both readings against a real multi-work-item scope
before committing; this is exactly 27a's own warning that a row-identity defect "passes the repo's own
browser-is-the-verdict check" silently.

**e2e:** high regression risk, no new spec strictly required by the row-uniqueness assertion itself (27a
says a unit test on `ExecutionPanelWidgetProxy().getStepRows()` suffices for the invariant), but the
RENDERED TEXT changes, and these existing specs assert against it and must be re-verified/updated:
`carved-quest-session-cwds.e2e.ts`, `dispatch-survives-unparseable-quest-file.e2e.ts`,
`resume-execution-row-runs-again.e2e.ts`, `resume-starts-dispatch.e2e.ts`, `quest-replay-execution-rows.e2e.ts`,
`quest-replay-subagent-execution-rows.e2e.ts`, `quest-replay-subagent-row-isolation.e2e.ts`,
`quest-streaming-subagent-execution-rows.e2e.ts`, `warpgate-row-and-header.e2e.ts`,
`warpgate-followup-transcript.e2e.ts`, `abandoned-quest-chaos-only-transcript.e2e.ts`,
`dispatch-resumes-retained-session.e2e.ts`, `operations-partial-continuation.e2e.ts`,
`bughunt-begin-transition.e2e.ts`, `quest-begin-transition.e2e.ts`.

### T2-0 — the projection endpoint (NEW, R7)

**Goal:** an orchestrator broker that walks `agentFlowStatics` forward from a quest's current
scopes/work-items to the likely remainder, served through a new server HTTP endpoint — the piece
`27-ui.md` scoped to `@dungeonmaster/web` (which cannot build it) and the handoff's R7 added back.

Confirmed nothing of this exists yet: `discover({ grep: "projection" })` returns zero hits under
`packages/{orchestrator,server,shared,web}/src/**` — every match is either an unrelated use of the word
or a historical planning doc (`scrolls/orcha-changes/*.md`, `scrolls/orchestrator-step-engine-plan.md`).

Exceeds 3 files as one unit once modelled on the existing summary endpoint's own shape (contract in
`shared`, transformer/broker in `orchestrator`, adapter+responder+route in `server`) — split in two:

- **T2-0a** — `packages/shared/src/contracts/quest-projection/quest-projection-contract.ts` (NEW),
  `packages/orchestrator/src/brokers/quest/projection/quest-projection-build-broker.ts` (NEW). No deps.
- **T2-0b** — `packages/server/src/adapters/orchestrator/get-quest-projection/orchestrator-get-quest-projection-adapter.ts` (NEW),
  `packages/server/src/responders/quest/projection/quest-projection-responder.ts` (NEW),
  `packages/server/src/statics/api-routes/api-routes-statics.ts` (edit — add the route, mirroring
  `questSummary`). Deps: **T2-0a**. Modelled directly on the confirmed-live pair
  `packages/server/src/responders/quest/summary/quest-summary-responder.ts` →
  `orchestratorGetQuestSummaryAdapter` (read in full).

**e2e:** none existing; not required for the endpoint itself (server responder + orchestrator broker get
unit/integration coverage the same way `quest-summary-responder.test.ts` does).

**Projection contract — sketched from what T2-2 and T2-4 need, not invented wholesale.** Built only from
fields already confirmed live on `WorkItem`/`OperationItem`/`agentFlowStatics`:

```ts
QuestProjection = {
  questId: QuestId,
  scopes: Array<{
    operationId: OperationItem['id'],
    role: WorkItemRole,          // == agentFlowStatics family key for every family but wardFull
    text: OperationItem['text'],
    status: OperationItem['status'],
    steps: Array<{
      step: StepName,            // real agentFlowStatics step key — decision 2 requires this, not a label
      kind: 'actual' | 'planned',// 'actual' = a real work item exists; 'planned' = projected forward
                                  // from agentFlowStatics[family].steps[step].routes, never yet dispatched
      workItemId?: QuestWorkItemId,   // present iff kind === 'actual'
      pieceId?: PieceId,              // present iff kind === 'actual' and the step carries pieces
      status?: ExecutionStepStatus,   // present iff kind === 'actual'
      mintedBy?: QuestWorkItemId,     // T2-11's back-edge badge reads this straight off WorkItem.mintedBy
    }>,
  }>,
  totalPlannedSteps: number,     // T2-4's denominator — grows as unmet marks route new work; never shrinks
  completedSteps: number,        // T2-4's numerator — ratio may fall, must never exceed 1 (27d's own ASSERT)
}
```

`kind: 'planned'` rows are what makes 27b's DONE criterion ("renders the likely remainder... REDRAWS on a
back-edge") buildable at all: they come from walking `routes.done`/`routes.unmet` forward from the last
`kind: 'actual'` step per scope, using the SAME `agentFlowStatics` the router itself reads, so the
projection can never disagree with what the router will actually do next.

### T2-2 — the projection binding (web)

**Goal:** a web broker + binding mirroring `use-quest-summary-binding.ts`'s exact shape (seed from GET,
resubscribe to that quest's `quest-modified` broadcast, refetch, re-render — no new websocket type).

**Files:** `packages/web/src/brokers/quest/projection/quest-projection-broker.ts` (NEW),
`packages/web/src/bindings/use-quest-projection/use-quest-projection-binding.ts` (NEW),
`packages/web/src/statics/web-config/web-config-statics.ts` (edit — add the route entry).

**Deps:** T2-0 (both halves) — the endpoint must exist to fetch from.

Confirmed pattern to mirror: `packages/web/src/bindings/use-quest-summary/use-quest-summary-binding.ts`
(read in full) — seeds via `questSummaryBroker`, subscribes `webSocketChannelState.questUpdated$()`
filtered on `quest.id === questId`, refetches on each match. The original plan's "a new transformer" for
this unit is now misleading: the graph-walk logic lives in T2-0's orchestrator broker, so this unit's own
transformer (if any) is only thin response-shaping, not a second graph walk — do not re-derive
`agentFlowStatics` traversal on the web side.

**e2e:** none existing (no consumer widget yet — T2-11 is the first renderer of this data).

### T2-3 — churn view and units readout

**Goal:** a legible per-unit churn sequence, and wiring the ALREADY-DECLARED `observablesSatisfied` prop
to real data instead of leaving it dead.

**Files:** `packages/web/src/widgets/execution-panel/execution-row-layer-widget.tsx`,
`packages/web/src/widgets/execution-panel/execution-work-item-row-layer-widget.tsx`.

**Deps:** T2-10 (forced chain, position 4 of 5).

**NOT DONE, confirmed, and the specific gap 27-ui.md names is real today.**
`ExecutionRowLayerWidgetProps.observablesSatisfied?: ObservableId[]` exists at
`execution-row-layer-widget.tsx:69` and renders at `:420-431`
(`data-testid="execution-row-observables"`, `` Satisfies: {observablesSatisfied.join(', ')} ``) — but
`ExecutionWorkItemRowLayerWidget`'s prop spread onto `<ExecutionRowLayerWidget>` (read in full,
lines 143-161) has no `observablesSatisfied` entry anywhere. The slot is genuinely dead in production,
exactly as claimed. Unit id shape is confirmed `<flowId>:<kind>:<id>` with kinds `terminal`/`branch`/
`observable`/`off-map` — `qa-unit-enumerate-transformer.ts:48-98`, read in full, matches `27-ui.md`
exactly, no correction needed there. The data this unit needs (`WorkItem.assignedUnitIds`,
`WorkItem.observations: UnitObservation[]` with `mark`/`evidence`/`toSettle`/`at`) is confirmed present
on `workItemContract` (`work-item-contract.ts:91,99`) and `unitObservationContract`.

**e2e:** none existing asserts `execution-row-observables` today (only
`execution-row-layer-widget.test.tsx:1156-1192`, a unit test, and the test-only `quest.harness.ts:413`
fixture) — no regression risk from existing specs, new coverage recommended but not mandatory.

### T2-4 — unclaimed-operations tail and progress counter

**Goal:** keep the unclaimed-operations tail (already sound) and make the progress counter read off the
projection rather than the raw ledger, capped so it never exceeds 1.

**Files:** `packages/web/src/transformers/unclaimed-operations/unclaimed-operations-transformer.ts`,
`packages/web/src/widgets/execution-panel/execution-status-bar-layer-widget.tsx`,
`packages/web/src/widgets/execution-panel/execution-panel-widget.tsx` (the `totalOperations`/
`completedOperations` computation, lines 219-221, needs to source from the projection instead).

**Deps:** T2-0 + T2-2 (needs the projection to recompute against). Shares `execution-panel-widget.tsx`
with T2-1 — run after T2-1's wave, not inside it.

**PARTIALLY DONE.** `unclaimed-operations-transformer.ts` (read in full) already works cleanly against the
current `operations/<id>` ref shape and needs no rework — 27d's "deliberately removed, with the reason
written down" branch does not apply; keep it as-is. `execution-status-bar-layer-widget.tsx` (read in
full) renders `` {completedCount}/{totalCount} OPERATIONS `` or `AWAITING PLAN`, but
`execution-panel-widget.tsx:219-221` computes both counts straight off `quest.operations` (the LEDGER),
not a projection — 27d's "recomputed from the PROJECTION rather than the ledger" requirement is
confirmed NOT met today.

**e2e:** no existing spec asserts on `execution-status-bar-layer-widget` by testid in the grep taken
across `packages/web/src/flows/**/*.e2e.ts` — new coverage recommended, no confirmed regression risk.

### T2-9 — rework rather than rebuild (split into two, over the 3-file cap)

**Goal:** concurrent-row auto-expand/scroll, dependency labels keyed on session identity rather than
role, and role-colour keyed on step rather than family.

Both sub-units confirmed NOT DONE, with fresh line numbers:

- **T2-9a — dependency labels.** Files: `packages/web/src/widgets/execution-panel/execution-work-item-row-layer-widget.tsx`,
  `packages/web/src/transformers/execution-row-subtitle/execution-row-subtitle-transformer.ts`. Deps:
  T2-3 (forced chain, position 5). Confirmed: `depLabels` (`execution-work-item-row-layer-widget.tsx:104-106`)
  maps `workItem.dependsOn` through `workItemIdToLabel`, which is built at `execution-panel-widget.tsx:225-228`
  as `WorkItem['id'] -> WorkItem['role']` — a ROLE, not a session identity, so it still collapses the
  instant two dependencies share a role, exactly as `27-ui.md` describes.
- **T2-9b — auto-expand/scroll and role colour.** Files:
  `packages/web/src/widgets/execution-panel/execution-row-layer-widget.tsx` (the three `useEffect`s,
  now at lines 154-186), `packages/web/src/statics/execution-step-status-config/execution-step-status-config-statics.ts`
  (`roleColors`, still keyed on family names at lines 10-21). Deps: T2-3 (forced chain, position 5 — runs
  alongside T2-9a; the two do not share a file with each other).

**e2e:** touches the widest surface of any unit here. Existing specs at risk: every
`elapsed-duration-*.e2e.ts` file (absent, bands, finished, pause, tick — all select rows via
`execution-row-layer-widget`/`execution-row-duration`), `execution-panel-active-row-collapse.e2e.ts`,
`execution-panel-paused-row-expandable.e2e.ts`, and every `subagent-duration-*.e2e.ts` file
(frozen-figure, live-tick, nested, notification-arrives, placement, row-status-gate) plus
`subagent-duration-session-no-tick.e2e.ts`. Cap concurrent e2e runs at 3 (existing ward e2e port-pairing
rule) when re-verifying this batch — do not run the whole set at once.

### T2-10 — retire PARTIAL and pt-N (footprint is 3 files, not 2, and one is new to the finding)

**Goal:** delete the now-dead `partially_complete` work-item status from the web.

**Files:** `packages/web/src/contracts/execution-step-status/execution-step-status-contract.ts` (the
enum itself — NOT named by `27-ui.md`, found by this pass), `packages/web/src/statics/execution-step-status-config/execution-step-status-config-statics.ts`
(the `PARTIAL` display config), `packages/web/src/widgets/execution-panel/execution-row-layer-widget.tsx`
(`EXPANDABLE_STATUSES` array). **`operations-partial-continuation.e2e.ts` is explicitly OUT of this
unit's scope** — confirmed below, this is the handoff's fourth correction, re-verified against current
code rather than trusted.

**Deps:** T2-11 (forced chain, position 3).

**Confirmed triple-dead, not just "no trap":**
1. `packages/orchestrator/src/contracts/stream-signal/stream-signal-contract.test.ts:88-91` — `` it('INVALID: {signal: "partially-complete"} => throws for removed signal type' ``. The orchestrator's own signal contract REJECTS it.
2. `packages/shared/src/contracts/work-item-status/work-item-status-contract.ts:11-18` — the persisted enum is `['pending', 'queued', 'in_progress', 'complete', 'failed', 'skipped']`. No `partially_complete` member ever reaches disk.
3. `packages/orchestrator/CLAUDE.md`'s own Signal System section: `` `signal-back`... `complete` is the SOLE signal kind — a session-terminal marker and nothing more. ``. There is no partial outcome left to produce this status.

Yet the WEB's own separate `execution-step-status-contract.ts` still enumerates `'partially_complete'`,
`execution-step-status-config-statics.ts` still carries its `PARTIAL`/`warning`/`◇` display row, and
`execution-row-layer-widget.tsx`'s `EXPANDABLE_STATUSES` still includes it — three sites of dead code the
orchestrator can never again produce.

**`operations-partial-continuation.e2e.ts` re-verified, not just trusted from the handoff:** its
`describe` block is titled **"Operations duplicate-on-red (pt-N continuation)"** (line 28) — not
"duplicate-on-partial" as `27-ui.md:194-201` claims — and its own header comment (lines 22-27) states
outright that the outcome minting a pt-continuation is an EXIT CODE from a COMMAND role (`ward`'s red),
never a `signal-back` outcome word, because `signal-back`'s two input contracts are `.strict()` and carry
no outcome word at all. The continuation TEXT format this test asserts is `` pt 2: Ward gate (full
monorepo) `` (`PT2_TEXT`, operation-item-level, prefix form) — textually distinct from decision 2's
work-item-level `step pt: N` (suffix form, e.g. `walk pt: 1`). **Confirmed: no collision, two genuinely
separate mechanisms, at two different data levels (operation item text vs. work-item display label).**
This file needs no edit for T2-10.

**e2e:** zero existing spec references `partially_complete`/`PARTIAL` anywhere under
`packages/web/src/flows/**` (confirmed by grep) — no regression risk, safe isolated cleanup.

### T2-11 — back-edge badge, unmet list, fallback

**Goal:** render `workItem.mintedBy` as a back-edge badge, a live near-row `unmet` list, and a guarded
fallback for a step/role the display config doesn't recognise.

**Files:** `packages/web/src/widgets/execution-panel/execution-row-layer-widget.tsx`,
`packages/web/src/widgets/execution-panel/execution-work-item-row-layer-widget.tsx`.

**Deps:** T2-1 (forced chain, position 2). The "unmet list" half benefits from T2-2's projection once it
exists, but the back-edge badge alone needs only `WorkItem.mintedBy`, already on disk.

**NOT DONE, confirmed on both halves:**
- `mintedBy: questWorkItemIdContract.optional()` is confirmed live on `workItemContract`
  (`work-item-contract.ts:100-105`), deliberately distinct from `insertedBy` (documented in the same
  file, lines 100-104) for exactly the reason `27-ui.md` gives. Neither widget (both read in full)
  references `mintedBy` anywhere today.
- The fallback risk is real and reproducible from current code: `execution-row-layer-widget.tsx:215-216`
  indexes `executionStepStatusConfigStatics.statusConfig[status]` and `.roleColors[role]` UNGUARDED, then
  immediately dereferences `.color`/`.label` off the result (lines 269-270, 296, 385, 390). `stepNameContract`
  (`step-name-contract.ts:18`) is confirmed a free-form branded string, not a closed enum, specifically so
  a `quest.json` holding a step/role a newer family added still LOADS — so an unrecognised value reaching
  either lookup throws `Cannot read properties of undefined`, a crash, not a blank, exactly as claimed.

**e2e:** no existing spec exercises an unrecognised step/role or asserts `mintedBy` rendering — new
coverage required once built, no existing regression risk.

### T2-12 — SPEC-tab recipe callout

**Goal:** show the recipes a flow's walk starts from, on the flow diagram / node detail panel.

**Files:** `packages/web/src/widgets/react-flow-diagram/react-flow-diagram-widget.tsx`,
`packages/web/src/widgets/react-flow-diagram/flow-node-detail-panel-layer-widget.tsx`.

**Deps:** none in Track 2 — independent of the forced chain, no shared file with any other unit here.

**NOT DONE, confirmed, and now buildable.** `discover({ grep: "recipe", glob: "packages/web/src/widgets/react-flow-diagram/**" })`
returns zero hits — nothing renders a recipe today. The blocking data IS present now:
`flowContract` (`packages/shared/src/contracts/flow/flow-contract.ts:35-39`) carries
`recipes: z.array(flowRecipeContract).default([])`, with its own JSDoc reading "story 27 renders it" —
confirming the handoff's correction #1 to `27-ui.md:245-249` directly against the contract file itself,
not just by citation.

**e2e:** the natural place to extend is `packages/web/src/flows/quest-chat/flow-diagram-interaction.e2e.ts`
(confirmed to exist) rather than a new spec file — it already drives the diagram's real-browser sizing
and panel behaviour this callout would sit inside.

### 27-ui.md errors beyond the four the handoff already found

| # | Claim | Current code | Evidence |
|---|---|---|---|
| 5 | `:104-112` — the ward-mode tag has TWO sites, `operation-row-layer-widget.tsx` among them | Only ONE site exists. `operation-row-layer-widget.tsx` (read in full) has no `wardMode` reference; `operationItemContract` carries no `wardMode` field | `packages/web/src/widgets/operations-ledger/operation-row-layer-widget.tsx` (full file); `packages/shared/src/contracts/operation-item/operation-item-contract.ts:25-70`; the widget's own `.test.tsx` asserts no such testid |
| 6 | `:44` — names `widgets/quest-summary/unconfirmable-row-layer-widget.tsx` as part of the "verified safe" blast-radius survey | That file does not exist. It is `debt-row-layer-widget.tsx` now, part of Track 1's rename | `packages/web/src/widgets/quest-summary/debt-row-layer-widget.tsx` (exists); `discover({glob:"packages/web/src/widgets/quest-summary/**"})` lists no `unconfirmable-*` file |
| 7 | `:42-47` — the whole blast-radius survey is scoped by `discover({ grep: "signoff", strict: true })` over `packages/web/**` | That grep returns **zero** hits today. Track 1 renamed the vocabulary to `met`/`cant-meet`/`unmet`/`debt`/`observations` throughout the web package, so this verification method itself is stale, not just its one cited file | `discover({ grep: "signoff", glob: "packages/web/src/**", strict: true })` → 0 matches, 1380 files scanned |
| 8 | The whole file's framing (echoed by the handoff's "0 of 13 done") | Two full units (T2-6, and T2-8 as merged into T2-7) and half of a third (T2-7's ward-mode half, now scopeless) are already done — landed as a side effect of Track 1's summary-widget rewrite and the operation-item's `wardMode` removal, neither of which `27-ui.md` or the handoff's Track 2 section could have known about when written | See "Already done" table above |

### Waves (≤3 concurrent, no file overlap within a wave)

| Wave | Units | Notes |
|---|---|---|
| 1 | T2-0a, T2-1, T2-12 | T2-1 is chain position 1. T2-0a and T2-12 touch none of T2-1's files |
| 2 | T2-0b, T2-11 | T2-0b depends on T2-0a (wave 1). T2-11 is chain position 2 |
| 3 | T2-2, T2-10 | T2-2 depends on T2-0a+T2-0b (both landed by end of wave 2). T2-10 is chain position 3 |
| 4 | T2-4, T2-3 | T2-4 depends on T2-0+T2-2 (landed by end of wave 3) and shares `execution-panel-widget.tsx` with T2-1 — safe now that T2-1 is long landed. T2-3 is chain position 4 |
| 5 | T2-9a, T2-9b | Both depend on T2-3 (wave 4). They share no file with each other, so both close the chain in one wave |

T2-6, T2-7 and T2-8 need no wave — already done. When re-verifying e2e regressions for wave 1 (T2-1) or
wave 5 (T2-9), cap concurrent Playwright runs at 3 per the existing ward e2e port-pairing rule; never run
the full affected-spec list from either unit's section above in one pass.

---

## Owner decision added mid-run — delete the design-phase quest statuses

The owner ruled: delete `explore_design`, `review_design` and `design_approved`. They served glyphsmith's design
phase, which is gone, and nothing sets them. They come out of `questStatusContract`, the transition statics, the
gate-content requirements, every status-keyed map and test, and `packages/orchestrator/CLAUDE.md`'s lifecycle diagram
and status table.

| ID | Goal | Runs |
|---|---|---|
| T3-17 | Remove every consumer first, then the enum members last, in one serial unit | when a slot frees; the enum edit touches a `shared` contract every package reads |
