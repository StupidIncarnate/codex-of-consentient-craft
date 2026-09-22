# Consolidated Plan

## Opening

Master is the starting point. A full ward run passes all 17 packages there. Every worktree from the
previous run is retired; carve a fresh one with `mcp__dungeonmaster__create-worktree` before starting.
Five design decisions were settled by the repo owner; they are recorded below as settled, not open.

## Settled Decisions

These decisions drive the work. Each carries enough explanation for the reader to understand the
change without reading anything else.

1. **Sign-offs move from the observable to the work item.** A flow observable is an acceptance
   criterion attached to a flow. A work item is one unit of dispatched work assigned to a reviewer
   role. Sign-off props are removed from flow observable objects — that part already landed. A work
   item now links to the observable it verifies and carries the sign-off itself. Two flowriders (a
   reviewer role) dispatched against the same flow produce two work items against the same observable,
   so two independent LLM sign-offs exist where the old shape held only one — that is why it matters.
   Per-track counts and the QA checklist measure work-item sign-offs. The web display replaces its
   current per-observable sign-off view with per-work-item granularity. The consequence:
   `signoffContract`, `signoffTracksStatics` and `signoffTrackContract` survive, re-keyed onto work
   items — they are not retired.

2. **Execution panel row labels.** The operation row carries the piece name once. Work item rows carry
   the declared step name alone, using the real step names from `agent-flow-statics.ts`, not friendlier
   display labels. Three tiers apply: one work item on a scope renders bare; several with distinct
   steps render the step in parentheses; a true duplicate — same scope and same step — renders `pt: 1`,
   `pt: 2`. The worked example:

   ```
     build the login broker                       codeweaver    complete
       plan                                                     complete
       work - login broker                                      complete
       work - session adapter                                   complete
       review                                                   complete
       ward                                                     complete
       commit                                                   complete

     walk login-flow                              flowrider     in_progress
       plan                                                     complete
       walk pt: 1                                               complete
       walk pt: 2                                               in_progress
   ```

   `ward` is a step under code, flow and siege operations, so it renders as `ward` under each rather
   than repeating its scope. Riftcarver's `carve` operation holds a single work item and stays bare.
   The owner will tweak the display after seeing it run.

3. **verifyByHuman is prompt text, not machinery.** It is a bare optional boolean on a flow observable,
   the same shape as the existing `verifyByReading`. It is NOT author-only: any role may set it,
   including a codeweaver that cannot verify something itself. Agents are told in their prompts what it
   means — an observable marked true must be confirmed by a human after the quest is done. There is no
   write guard and no Zod refinement. The enforcement is a filter: an observable marked
   `verifyByHuman` is removed from the observable list handed to every LLM doing its job, and a
   mid-quest flip drops it from every other role's list from that point. Provenance needs no mechanism
   — work items dispatched after the flip simply do not carry that observable, so the gap shows who set
   it.

4. **The `recording` hydration route is deleted.** A hydration route is how a recipe seeds the app into
   a starting state before a test runs. `api` drives the real API and `write` writes state directly;
   both work. `recording` was declared as a third — replaying bytes captured off a real system — but no
   document ever states WHAT it records, no ingredient declares one, and it has never executed. It is a
   broken copy of `write` that claims to need a server and reports null failures. It comes out of
   `hydrationRouteContract`, `hydrationRoutesContract`, `RoutesFor`'s third branch, the route-select and
   failure-classification branches, and one row of the diagnosis table in
   `packages/hydration/CLAUDE.md`. The owner may reintroduce it once the gap it fills is clear.

5. **The `docs` call's scopes.** `dungeonmaster siegelense docs --for <scope>` serves role-specific
   reference text. Delete the `operating` and `operational` scopes — each briefs a role the current
   design no longer dispatches. Five remain: `planning`, `walking`, `attacking`, `fixing`, `driving`.
   Separately, the general "what is siegelense" text lives in `docsStatics.about` at
   `docs-statics.ts:23-31` and is served only as a preamble to a scope's answer, so no session can
   simply ask what the tool is. Make `about` reachable on its own — `docs` with no `--for`.
   Discoverability is part of the task: the `docs` help entry and any prompt that reaches for `docs`
   must say the overview exists and how to fetch it.

## Work

The work is organized as four tracks. For each unit: what it does, the files, and its source document.
Dependencies are marked explicitly where they exist. A unit is one to three files, sized for a single
agent.

### Track 1 — Sign-off Re-homing

Derived from decision 1; no existing document covers it. This is the highest-value track, and Track
2's units 5 and 6 depend on it.

The shape of the work, not a file-path breakdown, since no document specifies one:

- the work-item contract gains the sign-off link
- `quest-summary-build-transformer.ts` computes per-track counts from work-item sign-offs instead of
  returning hardcoded zeros
- `qa-checklist-build-transformer.ts` gates on work-item sign-offs instead of returning every unit as
  remaining
- the three sign-off contracts are re-keyed
- the web summary display shows per-work-item granularity

A planning agent must survey these files first and produce the unit breakdown, because no document
specifies it.

### Track 2 — The Execution Panel

Source: `scrolls/orcha-changes/27-ui.md`. Unit 1 (row identity) is DONE, but decision 2 changes its
output, so the first job in this track is reworking unit 1's labels to the three-tier rule given in
decision 2.

| Unit | What it does | Files | Source |
|---|---|---|---|
| 2 | projection transformer and binding, mirroring use-quest-summary-binding.ts | a new transformer and a new binding | 27b |
| 3 | churn view and units readout | execution-row-layer-widget.tsx, execution-work-item-row-layer-widget.tsx | 27c |
| 4 | unclaimed-operations tail and progress counter | unclaimed-operations-transformer.ts, execution-status-bar-layer-widget.tsx | 27d |
| 5 | COVERAGE section | quest-summary-widget.tsx, flow-row-layer-widget.tsx, track-row-layer-widget.tsx | 27d |
| 6 | UNCONFIRMABLE debt list | quest-summary-widget.tsx, unconfirmable-row-layer-widget.tsx | 27d |
| 7 | ward-mode tag and retry badge | operation-row-layer-widget.tsx, ward-result-row-layer-widget.tsx, execution-row-layer-widget.tsx | 27d |
| 8 | DETAILS-tab ledger | operations-ledger-widget.tsx, operation-row-layer-widget.tsx | 27d |
| 9 | auto-expand and scroll, dependency labels, role colour | execution-row-layer-widget.tsx, execution-row-subtitle-transformer.ts, execution-step-status-config-statics.ts | 27e |
| 10 | retire PARTIAL and pt-N | execution-step-status-config-statics.ts, operations-partial-continuation.e2e.ts | 27e |
| 11 | back-edge badge, unmet list, fallback | execution-row-layer-widget.tsx, execution-work-item-row-layer-widget.tsx | 27f |
| 12 | SPEC-tab recipe callout | react-flow-diagram-widget.tsx, flow-node-detail-panel-layer-widget.tsx | 27g |

Ordering: unit 2 runs first, because units 3 through 12 build on the row shapes it establishes. Units 5
and 6 both edit `quest-summary-widget.tsx`, so they run one after the other, and both wait for Track 1.

FLAG CLEARLY: unit 10 retires the `pt-N` notation from its existing meaning (a partial continuation of
one work item) while decision 2 introduces `pt: N` for duplicate work items. The same token carries two
meanings during the changeover — whoever takes unit 10 must reconcile them, not just delete the old
one.

### Track 3 — The Independent Work

Source: `scrolls/orcha-changes/28-independent.md`. Decision 3 unblocks the whole 28c group.

| Unit | What it does | Files | Source |
|---|---|---|---|
| 13 | glyphsmith prefix and spawn logic | chat-spawn-broker.ts, run-chat-layer-broker.ts, chat-prompt-build-transformer.ts | 28a |
| 14 | glyphsmith responder branch | resolve-chat-quest-layer-broker.ts, design-chat-start-responder.ts, design-session-broker.ts | 28a |
| 15 | delete glyphsmith-prompt-statics, add riftcarver to the floor list | glyphsmith-prompt-statics.ts and test, execution-floor-config-statics.ts and test | 28a, 28b |
| 18 | the verifyByHuman flag | flow-observable-contract.ts with test and stub | 28c-1 |
| 19 | human-check verificationMethods value | step-scope-statics.ts and test, session-forensics/track-denominator-statics.ts | 28c-2 |
| 20 | the automatability prompt block and the observable-list filter | a new shared statics file, the get-quest-work filter site | 28c-3 |
| 21 | video citation kind, end-of-quest list, human verdict panel | siegelense citation-kind-contract.ts, a new panel widget | 28c-4 |

Numbering skips units 16 and 17; those units are already done.

Ordering: units 13, 14 and 15 all touch glyphsmith and run one after the other. Unit 18 comes before
19, 20 and 21. Unit 20 carries decision 3's filter and is the load-bearing piece of the whole group —
the flag does nothing without it.

### Track 4 — Siegelense and Hydration

Source: `scrolls/seigelense/remaining-build-items.md`.

The spelling here is not a typo: the docs folder is `scrolls/seigelense/`, while the package is
`packages/siegelense/` — both exist exactly as spelled, and `scrolls/siegelense/` and
`packages/seigelense/` do not.

| Unit | What it does | Files | Source |
|---|---|---|---|
| 3 | catch a bare @scope/name in the lint rule | see the note below | item 11 |
| 4 | element delta on an acting step | step-reading-contract.ts, key-read-layer-adapter.ts | |
| 5 | wire compare's elements field | compare-answer-contract.ts, the compare broker | |
| 6 | settle detector for click, then propagate | step-click-broker.ts, step-paste/type/wait-for brokers | |
| 7 | convert quest and session harnesses, then drop the raw fs fallback | quest.harness.ts, session.harness.ts | |
| 8 | fix the quest-completed, guild-mid-execution and nested-chain recipes | recipes-quest-completed-broker.ts, recipes-guild-mid-execution-broker.ts, session-with-nested-chain-broker.ts | |
| 9 | wire or delete the ninth recipe | recipes-catalog-broker.ts and test | |
| 10 | caller-supplied guild and work-item ids, and timestamps | guild-add-broker.ts, quest-hydrate-broker.ts | |
| 11 | quest two-route comparison browser test | a new spec under web/src/flows/home | |
| 12 | write-route storage cross-check, the mkdir ruling, delete RecipePackageMissingError, add an unusable instance state | guild-write-route-broker.ts, quest-write-route-broker.ts, instance-state-contract.ts | |
| 13 | sweep the rename leftovers | package-lock.json, siegelense-recipes-not-shipped.integration.test.ts, hydration-recipes/CLAUDE.md | |
| 15 | the oddities file and the .dungeonmaster-assets move | locations-statics.ts, a new oddities file, .gitignore | |
| 16 | delete the recording hydration route | hydrationRouteContract, hydrationRoutesContract, RoutesFor, the route-select and failure-classification branches, packages/hydration/CLAUDE.md | decision 4 |
| 17 | delete the operating and operational docs scopes, make `about` reachable with no `--for`, and say so in the help text | docs-statics.ts, siegelense-call-statics.ts, siegelense-help-statics.ts | decision 5 |

Numbering skips units 1, 2 and 14; those units are already done. Units 16 and 17 are new, added from
decisions 4 and 5, not a gap in the source document's numbering.

Ordering: unit 4 before 5; unit 7's two halves in order; everything else independent.

#### Unit 3's Note

The lint rule `banned-package-path-names-transformer` does not catch a bare `@scope/name` used as data.
The fix does NOT belong in the transformer: `rule-no-hardcoded-package-names-broker.ts` hands it only
the literal's own text, so `'@dungeonmaster/web'` written as data and the same string written as an
import source are byte-identical. A transformer-only fix was built and empirically flagged legitimate
imports, so it was reverted. The fix belongs in the broker: withhold literals whose parent is an
ImportDeclaration, an ImportExpression or a require call.

## How to Run This

- One to three files per agent. Agents handed large batches invent evasions that pass lint without
  improving anything.
- Dispatch a planning agent per track before execution agents, so the orchestrator's own context stays
  clear of file reads.
- Tell every agent to report pointers with one verbatim line each, never file bodies, diffs or full
  test output.
- Tell every agent to believe the code over the document. Several premises in these documents are
  already stale, and agents found four of them in one night.
- Tell every agent that reporting BLOCKED beats guessing. Three did, and each was right.
- The orchestrator owns builds and the full ward. A dispatched agent must never build — a build in
  flight breaks every other agent's checks.

## Two Traps

1. Lint reads compiled output. The ESLint rules import `@dungeonmaster/shared/statics` when they load
   and ESLint sets no source condition, so a worktree whose `dist` trails its source fails rules the
   source already relaxed. One run showed 13 files failing a rule master had already changed; building
   cleared all 13 and two integration failures with them.
2. Browser tests serve the compiled bundle. Playwright serves `packages/web/dist`, so an uncommitted
   widget change is invisible to a browser test until that package is built. A layout assertion
   measured a 37.875px failure against a fix already sitting in the source. Build the web package
   before trusting any UI verification.

## Known Loose Ends

- Roughly a dozen siegelense files carry provenance comments citing a retired prototype's line numbers;
  those citations point at nothing.
- `packages/siegelense/src/statics/driver/driver-statics.ts` names a deleted path in a comment.
- `docs/quest-role-paths.md` does not list `siege-adversarial-walker`, though the project guide makes
  per-role path coverage mandatory.
- `scrolls/orcha-changes/25-prompts.md` and `scrolls/orchestrator-step-engine-plan.md` describe intended
  states that the code has not reached; treat them as intent, not as fact.
