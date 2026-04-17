# Validation Playbook — Full Flow with Siege + Blight

End-to-end manual validation of the quest pipeline, written as if both Per-Flow Siegemaster (Plan 2) and Blightwarden (
Plan 1) are already implemented. Orchestrator (me) runs Phase 0 checks individually, then drives Phases 1–3 as a live
quest and branches to fixer agents on red.

## Ground Rules

Static policies. These hold for every run.

- **Kickoff surfaces.** Web UI, MCP tools, server HTTP endpoints. No slash commands.
- **Single dev server policy.** Only one dev server process is up at any time across the whole run.
- **Build before dev server.** Always run `npm run build` before starting the dev server (initial start AND every
  restart after a fix). All packages run from `dist/`, so a stale build will mask or create bugs that don't reflect the
  source tree.
- **Blightwarden crash mid-run.** Relaunch the same role fresh (same pattern as pathseeker). No special resume protocol.
  Carry-over handling still applies only to the `failed-replan` → pathseeker path.
- **Ward invocation.** Orchestrator does NOT run ward directly — always delegate to a ward-runner agent. Agents use
  `npm run ward` from repo root with `timeout: 600000`. Never `cd` into a package; pass paths after `--` to scope.
- **Fix agent scope.** Every fix agent is small-scope (≤3 files), one bug per agent. Rebuild `@dungeonmaster/shared` if
  touched before ward.
- **Completion criterion.** Validation is NOT done until you can drive the full Phase 1 smoke flow end-to-end without
  hitting any blocking bug AND the working tree is clean of quest-generated artifacts. A clean Phase 1 run is the gate
  to Phase 2.

---

## Run Lifecycle

Every attempt through the smoke flow is a **run**. Runs are always on a fresh quest — never resume a prior one. Do this
each run, in order:

1. **Prep the tree.** Ensure no uncommitted quest-generated artifacts are sitting around (see *Rules for Fixes* below).
   The working tree should contain only committed bug fixes and pre-validation state.
2. **Build.** `npm run build` — packages run from `dist/`, stale builds mask or invent bugs.
3. **Start dev server.** Single process only. Leave it up for the whole run.
4. **Initialize the notes file.** `/tmp/validation-notes.md` (outside the repo so it never gets committed). Create on
   first run of a validation session; append to it on subsequent runs.
5. **Start a new quest.** Web UI (http://dungeonmaster.localhost:4751/codex/session) → "New Chat" → describe the trivial
   2-flow feature.
6. **Record the run.** As soon as the session URL appears (`/codex/session/<uuid>`), add a `## Run N` heading to
   `/tmp/validation-notes.md` with the URL. One entry per run, every run.
7. **Drive the smoke flow** through the phase's checkpoints.
8. **Record the outcome** under the `## Run N` heading when the run ends:
    - **success** — reached `complete`, all checkpoints green.
    - **blocked** — note the checkpoint and link to the bug entry.
9. **If blocked:** follow *Blocking Bug Procedure* below, then loop back to step 1 for a new run.
   **If success:** proceed to the next phase (or declare validation done if this was the final phase).

---

## Bug Procedure

The moment something is off, regardless of blocking status:

**Notate first.** Write it down in `/tmp/validation-notes.md` under the current `## Run N` heading with:

- phase / checkpoint
- what was expected
- what was observed
- session / quest IDs
- reproduction steps

**Classify.**

- **Blocking** — prevents the smoke flow from reaching `complete` (broken kickoff, drain failure, missing dispatch,
  stuck status machine, crash, etc.). Go to *Blocking Bug Procedure*.
- **Non-blocking** — cosmetic, noisy logs, minor ordering, ambiguous status. Keep driving the flow. Collect these for a
  batched fix pass AFTER a clean smoke run.
- **Unsure** — notate the ambiguity, make a defensible call, flag it for user review.

### Blocking Bug Procedure

1. Stop the current phase.
2. Notate the bug (above).
3. **Kill the dev server** (`npm run dev:kill` or equivalent). Fix agents must not race a live server; a stale server
   holds file locks / ports.
4. **Revert quest-generated artifacts.** Any uncommitted working-tree changes are almost certainly from smoke-test
   agents (codeweaver/blightwarden outputs), not the bug itself. Revert BEFORE dispatching fixers so agents work from a
   clean base.
5. **Dispatch fix agents.** One bug per agent, ≤3 files each. Rebuild `@dungeonmaster/shared` if touched.
6. **Dispatch a ward-runner agent** to run `npm run ward` (timeout 600000) and fix any failures it finds. Orchestrator
   does NOT run ward directly — keep output and fix iteration off main context. Ward-runner reports back only when ward
   is fully green.
7. **Commit the fix** — one focused commit per bug, message references phase/checkpoint.
8. Mark the current run's outcome as **blocked** in notes, then return to *Run Lifecycle* step 1.

---

## Rules for Fixes

- **One bug, one commit.** Each fix agent's changes get committed on completion. Message references phase/checkpoint.
  Never batch unrelated fixes.
- **Never commit quest-generated artifacts.** The smoke flow produces codeweaver outputs, blightwarden inline fixes,
  etc. inside the working tree. Before restarting a run OR declaring validation done, revert those changes (
  `git restore` / `git clean -fd` scoped to the generated paths). Only bug-fix commits should remain in git history;
  source tree is identical to pre-validation state apart from fixes.

## Chrome Automation Gotcha

When driving the Web UI via `mcp__claude-in-chrome__*`, sending a chat message programmatically has one trap:

- `mcp__claude-in-chrome__form_input` sets the textarea `value` via JS assignment. React does NOT observe this — its
  internal state stays empty, so a subsequent click on the Send button submits an empty form (observed: no session
  created, URL unchanged).
- **Workaround:** focus the textarea with `computer.left_click`, use `computer.type` to type the real keystrokes (fires
  native input events that React hooks into), then `computer.key Return` to submit. Confirmed round-trip: URL
  transitions to `/codex/session/<uuid>` and ChaosWhisperer responds.

---

## Phase 0 — Static Pre-Flight

All checks via Read / discover / grep. No spawning.

### 0.A — Per-Flow Siegemaster landed

| #      | Check                                        | Pass criteria                                                                                                      |
|--------|----------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| 0.A.1  | `relatedDataItemContract` regex              | includes `flows` alternation                                                                                       |
| 0.A.2  | `resolvedRelatedDataItem` flows variant      | discriminated `{ collection: 'flows', id, item: Flow }`                                                            |
| 0.A.3  | Dead plumbing deleted                        | `siegemaster-phase-result/`, `work-units-to-failed-observable-ids/`, `failed-observables-to-step-ids/` → 0 results |
| 0.A.4  | `siegemasterWorkUnitContract` new shape      | singular `flow`; no `relatedFlows`/`relatedObservables`                                                            |
| 0.A.5  | `stepsToWorkItems` per-flow                  | loop over `flows`; each siege has `relatedDataItems: ['flows/<id>']`; chained `dependsOn`                          |
| 0.A.6  | `buildWorkUnitForRole` discriminated input   | siegemaster branch live; lawbringer/spiritmender drop `quest`                                                      |
| 0.A.7  | `work-unit-to-arguments` flow-centric render | `Flow:` / `flowType` / `entryPoint` / `Nodes:` / `Edges:` / obs IDs                                                |
| 0.A.8  | `run-siegemaster-layer-broker` no flatten    | `quest.flows.flatMap` → 0 hits                                                                                     |
| 0.A.9  | `FAILURE_MARKER` sniff gone                  | zero occurrences outside fixture cleanup                                                                           |
| 0.A.10 | Prompt Phase 3 rewritten                     | `git diff main...HEAD --name-only` mentioned; skip-detection wording present                                       |

### 0.B — Blightwarden landed

| #      | Check                                          | Pass criteria                                                                                  |
|--------|------------------------------------------------|------------------------------------------------------------------------------------------------|
| 0.B.1  | `agentRoleContract` + `workItemRoleContract`   | `'blightwarden'` in both enums                                                                 |
| 0.B.2  | `signal-back-input` enum                       | `'failed-replan'` added                                                                        |
| 0.B.3  | `planningBlightReportContract` exists          | contract + test + stub; `minion` enum has 6 values                                             |
| 0.B.4  | `quest-contract` `blightReports[]`             | field + default `[]`                                                                           |
| 0.B.5  | `get-planning-notes` `'blight'` section        | enum + broker + responder + MCP adapter all include it                                         |
| 0.B.6  | `steps-to-work-items` blightwardenItem         | inserted between lawItems and finalWardItem; `finalWardItem.dependsOn = [blightwardenItem.id]` |
| 0.B.7  | Orchestration loop dispatch                    | `else if (roleName === 'blightwarden')` branch in loop broker                                  |
| 0.B.8  | `run-blightwarden-layer-broker` exists         | broker + proxy + test                                                                          |
| 0.B.9  | 6 prompt statics folders                       | synthesizer + 5 minions                                                                        |
| 0.B.10 | 5 minion names in `agent-prompt-name-contract` | present in enum                                                                                |
| 0.B.11 | `agent-name-to-prompt-transformer`             | 5 minion cases                                                                                 |
| 0.B.12 | `quest-status-input-allowlist` `in_progress`   | `blightReportsRule` scoped to `planningNotes.blightReports`                                    |
| 0.B.13 | `spiritmender-context` post-Blight             | `postBlightwardenFailure` entry present                                                        |

### 0.C — Ward fully green

`npm run ward` (timeout 600000). Zero failures. No live-quest work until this is green.

**→ FAIL Phase 0:** dispatch fixers; restart Phase 0.
**→ PASS:** proceed to Phase 1.

---

## Phase 1 — Happy Path Smoke Test

One quest, one clean run, from Web UI new chat to `complete`. Two flows (one runtime UI, one operational CLI), ~3 steps
total.

### 1.1 — Spec creation (ChaosWhisperer)

- **Action:** `npm run build` then `npm run dev`. Web UI → "New Chat". Describe a trivial 2-flow feature.
- **Assert:**
    - Status walk: `created` → `explore_flows` → `review_flows` → (approve) → `flows_approved` → `explore_observables` →
      `review_observables` → (approve) → `approved`
    - `quest.flows[]` has 2 flows, each with nodes + edges + observables on terminal nodes
    - Chat streams token-by-token in UI
    - `chaoswhisperer-gap-minion` dispatched visibly as a sub-agent

**→ FAIL:** fix chat/spec layer. Restart 1.1.
**→ PASS:** continue.

### 1.2 — Execution kickoff

- **Action:** Web UI "Start" (or `mcp__dungeonmaster__start-quest`).
- **Assert:**
    - Status → `seek_scope`
    - PathSeeker work item dispatched by orchestration loop

**→ PASS:** continue.

### 1.3 — PathSeeker phased planning

- **Assert via `mcp__dungeonmaster__get-planning-notes`:**
    - `seek_scope` → `scopeClassification` populated → `seek_synth`
    - `seek_synth` → parallel surface minions → `surfaceReports[]` + `synthesis` → `seek_walk`
    - `seek_walk` → `walkFindings` → `seek_plan`
    - `seek_plan` → `steps[]`, `reviewReport` → `in_progress`

**→ PASS:** continue.

### 1.4 — DAG shape

- **Assert via `mcp__dungeonmaster__get-quest({stage: 'implementation'})`:**
  ```
  cw1..cwN                                       (one per step)
    → ward(changed)
      → siege-flow-1 → siege-flow-2              (NEW: per-flow chained)
                           → law1..lawN          (dependsOn: ALL siegeIds)
                               → blightwarden    (NEW: dependsOn: allLawIds)
                                   → ward(full)
  ```
    - 2 siegeItems, each `relatedDataItems: ['flows/<id>']`
    - `siege-flow-2.dependsOn` contains `siege-flow-1.id`
    - Each lawbringer's `dependsOn` contains BOTH siegeIds
    - `blightwardenItem.dependsOn = allLawIds`
    - `finalWardItem.dependsOn = [blightwardenItem.id]`

**→ FAIL:** fix `steps-to-work-items-transformer`. Restart 1.3.
**→ PASS:** continue.

### 1.5 — Codeweavers

- **Assert:**
    - Up to 3 concurrent via slot manager
    - Each signals `complete`
    - Each work item has its own `sessionId`

**→ PASS:** continue.

### 1.6 — Ward (changed mode)

- **Assert:**
    - `wardMode: 'changed'`
    - Green
    - Output streams to Web UI

**→ FAIL (red):** if ward fails here, this is no longer a smoke test — abort and re-seed a clean happy path.
**→ PASS:** continue.

### 1.7 — Siege flow 1 (NEW)

- **Capture:** spawned siegemaster's `$ARGUMENTS` from session JSONL.
- **Assert args:**
    - Single `Flow:` block with `flowType` + `entryPoint`
    - `Nodes:` with IDs + labels + observable IDs
    - `Edges:` rendered
    - Observable Type Reference block present
    - No `steps` block
    - `Dev Server URL:` present
- **Assert behavior:**
    - Dev server starts → tests run → dev server stops (zero live dev servers after signal)
    - Signals `complete`
    - `siege-flow-2` still `pending`

**→ FAIL args:** fix `work-unit-to-arguments-transformer` siegemaster branch. Restart 1.7.
**→ FAIL dev server leak:** fix `dev-server-stop-broker` call path. Restart 1.7.
**→ PASS:** continue.

### 1.8 — Siege flow 2 (NEW — sequential chain, single dev server)

- **Assert:**
    - Starts only after 1.7 signals `complete`
    - Only one dev server process is ever up at once (check OS ps list during transition)
    - Receives the second flow in its args
    - Signals `complete`

**→ FAIL parallel sieges:** fix `dependsOn` chaining in `steps-to-work-items-transformer`. Restart 1.3.
**→ FAIL two dev servers:** fix layer broker dev server lifecycle. Restart 1.7.
**→ PASS:** continue.

### 1.9 — Lawbringers

- **Assert:**
    - Start only after both sieges complete
    - Up to 3 concurrent
    - All signal `complete`

**→ PASS:** continue.

### 1.10 — Blightwarden (NEW)

- **Capture session JSONL.**
- **Assert sequence:**
    1. Parallel Task dispatches: 5 minions (security, dedup, perf, integrity, dead-code)
    2. Each minion commits to `planningNotes.blightReports[]` via `modify-quest`
    3. Synthesizer synthesizes → signals `complete` (clean diff assumption)
- **Assert data:**
    - 5 `blightReports` entries, distinct `minion` values
    - Allowlist holds: `in_progress` rejects any modify-quest attempt outside `planningNotes.blightReports`

**→ FAIL minions not parallel:** fix synthesizer prompt dispatch section. Restart 1.10.
**→ FAIL allowlist breach:** fix `quest-status-input-allowlist-statics`. Restart 1.10.
**→ PASS:** continue.

### 1.11 — Final Ward (full) + complete

- **Assert:**
    - Spawned only after blightwarden complete
    - `wardMode: 'full'`, green
    - Status → `complete`
    - WS `quest-modified` broadcast
    - Web UI shows quest "Complete"

**→ PASS:** Phase 1 complete.

---

## Phase 2 — Easy Fault Tests

Each uses a fresh quest. Keep each deliberately simple — one failure per quest.

### 2.1 — Siegemaster fails → drain reaches blightwarden

- **Seed:** force `siege-flow-1` to signal `failed`.
- **Assert:**
    - `siege-flow-2`, all lawbringers, `blightwardenItem`, `finalWardItem` → all `skipped`
    - PathSeeker replan spawns
    - Drain uses `signal.signal === 'failed'` only (no `FAILURE_MARKER` sniff)

**→ FAIL blightwarden not skipped:** fix drain logic in `run-siegemaster-layer-broker`.
**→ PASS:** continue.

### 2.2 — Siegemaster `complete` with literal `FAILED OBSERVABLES: none`

- **Seed:** spawn a siege that completes with that exact text in its summary.
- **Assert:** work item → `complete` (not misclassified).

**→ FAIL:** sniff still present — finish removing it from `run-siegemaster-layer-broker`.
**→ PASS:** continue.

### 2.3 — Siegemaster Phase 3 skip wording

- **Seed:** a slice with no changed files in `flows/` or `startup/` folder types.
- **Assert:** siegemaster summary contains the exact string
  `"Phase 3 skipped: no flow/startup files changed in this slice"`.

**→ FAIL:** fix siegemaster prompt Phase 3 section.
**→ PASS:** continue.

### 2.4 — Blightwarden `failed-replan` → pathseeker

- **Seed:** plant a semantic finding the perf minion can't auto-fix (genuine N+1 in a codeweaver output).
- **Assert:**
    - perf minion flags with file:line evidence
    - Synthesizer signals `failed-replan` via `signal-back` MCP
    - `run-blightwarden-layer-broker` drains pending (finalWard → `skipped`)
    - PathSeeker replan spawns
    - Report carries `status: 'blocking-carry'` for use by the next blightwarden

**→ FAIL signal-back rejects `failed-replan`:** fix `signal-back-input-contract` + consumers.
**→ FAIL drain incomplete:** borrow drain pattern from `run-siegemaster-layer-broker`.
**→ PASS:** continue.

### 2.5 — Blightwarden carry-over on replan

- **Continuing from 2.4:** let PathSeeker replan emit a new step, codeweaver runs, second blightwarden fires.
- **Assert:**
    - Second blightwarden calls `get-planning-notes({section: 'blight'})` as part of its Resume Protocol
    - For each carry-over finding: if still present → `blocking-carry` + `reviewedOn` appended; if fixed → `resolved` +
      `reviewedOn` appended
    - Fresh minions dispatch after the carry-over review

**→ FAIL no carry-over review:** fix synthesizer prompt Resume Protocol.
**→ FAIL `reviewedOn` not appended:** check `questArrayUpsertTransformer` for `blightReports` field.
**→ PASS:** continue.

### 2.6 — Blightwarden inline mechanical fix (dead export)

- **Seed:** plant an unused exported constant in a codeweaver output.
- **Assert:**
    - dead-code minion flags it
    - Synthesizer deletes it inline (file actually modified)
    - Report status → `resolved`
    - Final ward stays green after deletion

**→ FAIL synthesizer doesn't delete:** fix inline-fix rules in synthesizer prompt.
**→ PASS:** continue.

### 2.7 — Blightwarden crash mid-run (relaunch, not resume)

- **Seed:** kill blightwarden process partway through.
- **Assert:**
    - Orchestration loop relaunches blightwarden (same pattern as pathseeker retry)
    - Fresh run — no special resume logic expected
    - Quest eventually proceeds to final ward

**→ FAIL no relaunch:** check layer broker's maxAttempts + relaunch path (mirror pathseeker).
**→ PASS:** continue.

### 2.8 — Final ward fails after Blightwarden

- **Seed:** let a blightwarden delete break final ward.
- **Assert:**
    - Spiritmender spawns
    - Spiritmender's prompt includes `postBlightwardenFailure` preamble ("check `git log` before re-adding deletions")
    - Spiritmender fixes forward; quest eventually `complete`

**→ FAIL preamble missing:** fix `spiritmender-context-statics` post-Blight entry.
**→ PASS:** continue.

### 2.9 — Small-scope skip

- **Seed:** quest where `planningNotes.scopeClassification.size === 'small'`.
- **Assert:** blightwarden runs solo — zero minion Task tool_uses in session JSONL.

**→ FAIL minions dispatched anyway:** fix synthesizer prompt small-scope branch.
**→ PASS:** continue.

---

## Phase 3 — Final Ward

`npm run ward` (timeout 600000). Zero failures. Gates declaring the combined feature-set green.

**→ FAIL:** route back to whichever phase introduced the regression.
**→ PASS:** both features validated end-to-end.

---

## Execution Order

1. Run Phase 0 in its entirety (static checks).
2. Run Phase 1 as a single unbroken live quest. Branch to fixers on red, restart from failing checkpoint.
3. Run Phase 2 scenarios one by one, each on its own quest. Branch to fixers on red.
4. Run Phase 3.

Only after Phase 3 passes do I declare the two features green.
