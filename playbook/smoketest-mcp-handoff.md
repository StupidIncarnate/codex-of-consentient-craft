# Smoke Test (MCP Orchestration) — Session Handoff

Status as of the first smoke-test session driving `playbook/smoketest-mcp-orchestration.md`.
Detailed per-probe findings log: `/tmp/smoke-mcp-notes.md` (may not survive a reboot — the essentials are here).

## Session 5 (2026-05-31) — PW fixes committed; Flows 1/2/3 re-validated on the committed build

- **Committed** the prompt-walk fixes as `39f839ad` (19 source/test files + the 2 playbook docs).
- **Flow 1** = PASS (committed quest `83628747` from Session 4; re-confirmed).
- **Flow 2 Part A** = PASS (quest `5a49a9f8`): `get-next-step` returned all **3 `pathseeker-surface` in ONE same-role
  batch** (legal parallel); on disk all 3 `complete` with **distinct `agentId`s** but a **shared parent `sessionId`**
  (the B4 dup-log trap); UI showed **3 distinct DONE rows**. Then dedup + assertion-correctness came back as a
  **mixed-role batch** — serialized one-at-a-time (new finding; HARD RULE in the orchestration doc updated to cover it).
- **Flow 2 Part B** = PASS (quest `1e695f73`): 2 codeweaver chunks, step-gated → `get-next-step` returned **only cw1**,
  then **only cw2** (serialized, not batched); ward gated until both terminal; exit 0; quest derived `complete`.
- **Flow 3 codeweaver BLOCK** = PASS (quest `38e317f7`): codeweaver `failed` (sessionId stamped, no errorMessage),
  blightwarden `skipped`, quest `blocked`, `get-next-step` idle; UI FAILED row + skipped hidden + no banner + RESUME +
  "0/1 COMPLETE".
- **Flow 3 lawbringer RECOVER** = PASS (quest `ab3aa249`): splice = 1 spiritmender (insertedBy, dependsOn failed law) +
  1 lawbringer retry (attempt 1, insertedBy, dependsOn spiritmender); blightwarden **rewired** onto the retry; sidecar
  `spiritmender-batches/<id>.json` written; quest stayed `in_progress`. Drove spiritmender → law-retry → blightwarden →
  ward(full, exit 0) → **quest `complete` while the original lawbringer stays `failed`** (F5 superseded-by-retry, live).
- **Flow 3 ward sad paths** (budget-splice + exhaustion): NOT re-driven live (a failing real ward can exceed the 5-min
  MCP `run-ward` timeout, and the pre-edit lint hook blocks writing an obvious defect file). Per user decision, treated
  as covered by Session 2 (validated live then, on code this commit didn't touch) + re-confirmed green via
  `quest-run-ward-broker.test.ts` (479 tests pass; covers RECOVER attempt-0 splice and EXHAUSTION attempt-2 block).
- **Process note:** repeatedly hit cascade failures from batching a long pipeline against a *guessed* quest id (the
  first scratch `python3` fails `FileNotFoundError` and cancels the batch). Discipline reaffirmed in G7: one logical
  step per turn; only ever use the `questId`/`workItemId` the tool just echoed.

## Outcome so far

**Flow 1 (happy-path execution chain) = PASS.** Every transition validated live (MCP + web):
codeweaver → ward(changed) → siegemaster → lawbringer → blightwarden → ward(full) → quest `complete`
+ terminal banner. Identity stamping, G1 (`summary`/`actualSignal` dropped), B1/B2/B3 ward rendering,
ward-fail → RECOVER splice — all confirmed.

**7 real bugs found and fixed (TDD, diffs verified, committed).** Two are critical: on the live
`/dumpster-launch` path, **no quest (feature or bug-hunt) could ever reach `complete`** — every quest
ends in a ward, and the completion transition was never derived (F6), and recovered quests were
additionally blocked by the superseded `failed` item (F5).

| # | Sev | Bug | Fix (file) |
|---|-----|-----|------------|
| F2 | was-blocking | Ward not green via MCP: `DUNGEONMASTER_HOME` leaks from the prod server into the MCP-spawned ward subprocess; ~14 broker tests aren't hermetic to it. Plus a dead `run-siegemaster-layer-broker` whose test failed. | `dungeonmaster-home-find-broker.proxy.ts` `setupHomePath` clears the env first (fixes all consumers); deleted the dead siege-layer-broker triplet (zero live importers). |
| F3 | real prod | `ward --changed` crashes (eslint "No files matching pattern" / jest "No tests found") when the git diff contains **deleted** files — hits any quest where a role deletes a source file. | `git-diff-files-broker.ts` adds `--diff-filter=d` to both `git diff --name-only` calls. |
| F6 | **critical** | Live completion paths (`signal-back` complete, `run-ward` exit-0) mark the item complete but never re-derive quest status → quest never reaches `complete`. | `quest-modify-broker.ts`: when `workItems` present and `status` absent, re-derive and apply **only** a derived `complete`. |
| F5 | **critical** | Once F6 derives, a recovered quest (ward/lawbringer failed → retry succeeded) was still blocked by the original `failed` item ("none failed" gate). | `work-items-to-quest-status-transformer.ts`: a `failed` item is resolved if some item has `insertedBy === its id` (a fixer/retry was spliced). |
| F1 | cosmetic | Execution status bar counted `quest.steps.length` (showed `1/1 COMPLETE` with items pending), not work items. | `execution-panel-widget.tsx`: count non-skipped work items. |

(F6 had a transient over-reach — the broad derive set `blocked` prematurely during the failure/splice
sequence; caught by `quest-flow.integration.test.ts` and narrowed to apply only `complete`.)

## Non-code findings (NOT yet fixed)

- **F4 (pre-existing e2e flake):** `@dungeonmaster/testing` e2e `WS Reconnect … chat keeps streaming after reconnect`
  flakes under full-suite load (passes in isolation 3/3, incl. with `DUNGEONMASTER_HOME`/`DUNGEONMASTER_PORT` set).
  Makes the **final ward(full)** intermittently red. Orthogonal to orchestration. Not yet de-flaked.
- **ENV-1:** agent `isolation: "worktree"` is broken in this repo — the WorktreeCreate hook runs `npm run build`
  in a worktree with no `node_modules` → tsc exits 2. Run fix/RCA agents in the **main tree** with tight allowlists.
- **Build-vs-MCP gotcha:** `npm run build` overwrites `packages/mcp/dist`, which the running MCP stdio child loaded
  at boot → orchestrator-code fixes only take effect after a rebuild **and** an MCP reconnect (`/mcp` → reconnect).
  Documented in `packages/mcp/CLAUDE.md` and the playbook §1.

## Playbook doc updates made

- `smoketest-mcp-orchestration.md` §5: ward-failure paths now use "break a real ward-catchable defect in a
  git-changed file + run real ward" instead of the fake-CLI approach (per user direction).
- §1: added the build-kills-MCP gotcha.
- `packages/mcp/CLAUDE.md`: added the rebuild+reconnect requirement.

## Session 2 (2026-05-30) — Flow 2, Flow 3, Prompt-walk = ALL DONE

Driven on the live MCP path against the same prod testbed. The 7 Session-1 fixes all held (F5/F6 completion
derivation re-confirmed live). **No new orchestration bugs.** Full per-probe log appended to `/tmp/smoke-mcp-notes.md`.

- **Flow 2 = PASS.** Part A: 3× pathseeker-surface parallel + dedup/assertion-correctness parallel — every row shows
  its **own** distinct transcript keyed by `workItemId` even though all siblings share one parent `sessionId` (the B4
  dup-log bug is NOT present). Part B: codeweaver chunks dispatched **one-at-a-time** (serialized), ward gated until
  all chunks terminal; ran to `complete` + terminal banner; B3 Stage-1 "Ward exit code: 0 (changed)" green.
- **Flow 3 = PASS (all roles, all paths).** 9 agent roles → BLOCK (codeweaver full-rigor + 8 via direct signal-back);
  lawbringer → RECOVER (spiritmender + retry spliced, blightwarden rewired, sidecar, AD-HOC + `retry 1/1` rows live,
  then drove to `complete` re-validating F5); ward budget (attempt 0) → splice spiritmender + ward `retry 1/3`, B3
  Stage-1 "Ward exit code: 1 (changed)" red + Stage-2 detail breakdown (real TS2322 from a deliberate defect);
  ward exhausted (attempt 2) → BLOCK, no splice. Defect file restored; tree clean.
  - **UI nuance (NOT a bug, confirmed in `execution-panel-widget.tsx`):** ward exit-code + detail render **only** in
    the normal/stepped branch. `isPlanning = steps.length===0 && !terminal`; a quest with workItems but **no `steps[]`**
    renders in the isPlanning branch which passes `errorMessage` but not `wardResults`/`questId` → only "Error: ..."
    shows. Real quests always have steps. Direct `quest.json` edits don't fire the outbox; force a refresh with an MCP
    `modify-quest` (an allowed field) to make the web re-read.
- **Prompt-walk = DONE (19 prompts).** Surfaced prompt/contract DRIFT (not runtime bugs). Verified-against-source holes:
  - **PW-1 [HIGH]** `packagesAffected` is not a field on `modifyQuestInputContract` (`.strict()`); `dumpster-create`
    (and optionally `dumpster-hunt`) instruct `modify-quest({packagesAffected})` → rejected → never persists →
    orchestrator falls back to whole-monorepo single slice.
  - **PW-2 [MED]** `stepAssertionContract` makes `field` **optional** for `INVALID_MULTIPLE` (required only for
    `INVALID`); pathseeker-surface/assertion-correctness/walk prompts wrongly say "required".
  - **PW-3 [HIGH]** `in_progress.allowedPlanningNotesFields = ['blightReports']`; `walkFindings` is only allowed at the
    **dead** `seek_walk` status. pathseeker-walk runs at `in_progress` and its terminal commit writes
    `planningNotes.walkFindings` → rejected by the allowlist. (Also gates Flow P's walk commit.)
  - **PW-4 [LOW]** surface + assertion-correctness banned-matcher lists omit `.includes(` (present in
    `bannedJestMatchersStatics`).
  - Plausible (agent-reported, confirm before fixing): PW-5 orphaned `postBlightwardenFailure` spiritmender context;
    PW-6 blightwarden `failed-replan` prose claims a replan splice but the handler routes `failed-replan`→BLOCK;
    PW-7 dedup-minion "shell out to duplicate-detection broker" has no CLI entrypoint; PW-8 dumpster-hunt lacks the
    browser-open step; PW-9 stale "spawn a Claude CLI subprocess" JSDoc; PW-10 glyphsmith missing
    approved→explore_design self-transition. See `/tmp/smoke-mcp-notes.md` for full detail.

## Session 4 (2026-05-31) — Flow-1 re-run = PASS (clean, quest `83628747`); three process errors caught + corrected

**Result:** Flow 1 passes on the post-fix MCP child — the prompt-walk fixes did NOT regress the execution dispatch
chain. Staleness probe confirmed the live child runs current `dist/`: `modify-quest({packagesAffected})` on a `created`
quest returns the NEW gate `"Field 'packagesAffected' not allowed in status 'created'"`, not the stale
`"Unrecognized key(s)"`. Prod restarted (4800/4801).

**Authoritative clean run = quest `83628747-d149-4e48-83b8-e39b3719b73b`** — pre-seeded Flow-1 chain, driven strictly
ONE `get-next-step` per dispatch (one tool call per turn; no running ahead of the graph; no cross-role batching), every
beat verified on disk before advancing:
- codeweaver → ward(changed, **exit 0**) → siegemaster → lawbringer → blightwarden → ward(full, **exit 0**) → **quest
  derived `complete`** (F5/F6 live) → `get-next-step` `idle`. Each `get-next-step` returned exactly the next single
  ready item, proving dependency gating (siege only after ward1, law only after siege, blight only after law).
- Each agent item: `complete` + `sessionId`/`agentId`/`startedAt`/`completedAt`; `summary`/`actualSignal` absent (G1).
  Each ward item: `relatedDataItems:['wardResults/<id>']` + matching `wardResults[]` ref (B3 Stage-1), `startedAt`
  absent (no get-agent-prompt for ward), no `errorMessage`.
- **UI = PASS** (live, no refresh): "EXECUTION COMPLETE", all 6 rows `DONE` across
  FORGE/MINI BOSS/ARENA/TRIBUNAL/QUARANTINE/FLOOR BOSS; both ward results green (changed exit 0, full exit 0).

**Three process errors made earlier this session (NOT product bugs) — recorded so they aren't repeated:**
1. **`run-ward` param is `mode` (`'changed'|'full'`), NOT `wardMode`.** A first attempt (quest `940e5e04`) passed
   `wardMode` → `Unrecognized key(s): wardMode`, so the ward never ran; I then mis-drove downstream stubs by hand.
2. **Never parallel-dispatch different roles.** A second attempt batched siege+law+blight `Task()`s concurrently;
   `signal-back` doesn't gate on readiness so they force-completed out of dependency order, invalidating the run.
   **Codified as a HARD RULE in `smoketest-mcp-orchestration.md` REFERENCE C** (only same-role batches a single
   `get-next-step` returns may run in parallel).
3. **Hallucinated quest ids in batched scratch commands** (twice) — typed a `questId` `create-quest` had not returned,
   so the first `python3` failed `FileNotFoundError` and cancelled the whole batch. Fix: one logical step per turn; use
   only the `questId`/`workItemId` echoed back by the tool.

All polluted/abandoned quests were wiped; `83628747` is the only valid run, left `complete` (terminal). Queue clean.

Remaining: Session-3 fixes are still **uncommitted** (user has not asked to commit). Flow P remains optional.

## Session 3 (2026-05-30) — Prompt-walk holes FIXED; full ward green; Flow-1 re-run PENDING

All actionable prompt-walk findings are fixed in the working tree. **`npm run ward` is fully green (exit 0)** —
lint, typecheck, unit, integration, e2e (incl. the previously-flaky WS-reconnect e2e). Changes are **uncommitted**
(19 source/test files + this doc). Nothing is git-committed yet — the user has not asked to commit.

Fixed (verified against source, TDD where it applies):
- **PW-1** — `packagesAffected` added to `modifyQuestInputContract` (plain string-brand array, whole-list replace) +
  `quest-modify-broker` handling + `inspectableModifyQuestInputFieldsStatics` + allowlist (`flows_approved`,
  `explore_observables`, `review_observables` back-transition). `dumpster-create` writes it at `explore_observables`;
  the prompt was already correct.
- **PW-2** — INVALID_MULTIPLE `field` corrected from "required" to **optional** in pathseeker-surface / -assertion-correctness / -walk prompts (contract: `field` required only for `INVALID`).
- **PW-3** — `in_progress.allowedPlanningNotesFields` now `['blightReports','walkFindings']`, and the
  `quest-input-forbidden-fields-transformer` carveout was **generalized** (was blight-only) so a planningNotes write
  whose sub-fields are all in the allowlist passes at a `blightReportsRule:'full'` status. This unblocks
  pathseeker-walk's terminal `walkFindings` commit (it runs at `in_progress`).
- **PW-4** — `.includes` added to the banned-matcher lists in surface + assertion-correctness prompts (+ test needle).
- **PW-6** — blightwarden `failed-replan` prose corrected: it routes to BLOCK (no auto replan splice).
- **PW-7** — dedup-minion "shell out to duplicate-detection broker" reworded to "read its source as a reference"
  (the broker has no CLI entrypoint).
- **PW-8** — dumpster-hunt now has the `get-server-config` + browser-open step (parity with dumpster-create).
- **PW-9** — codeweaver/lawbringer JSDoc "spawn a Claude CLI subprocess" → "served via get-agent-prompt to a
  Task-dispatched sub-agent … signal-back". (The same stale JSDoc phrasing may linger in other statics — cosmetic,
  not runtime; a full sweep was out of scope.)

FALSE findings (verified, NOT changed):
- **PW-5** — `postBlightwardenFailure` spiritmender context is **live** (`quest-run-ward-broker.ts:185`,
  `run-ward-layer-broker.ts:247` — ward-fail-after-blightwarden path). Not orphaned.
- **PW-10** — glyphsmith does NOT need an `approved→explore_design` self-transition; `design-start-responder` sets
  `explore_design` before glyphsmith is spawned.

## What REMAINS (do this FIRST next session)

1. **Re-run Flow 1 against the fixes (the user's explicit ask: "make sure nothing broke").** The prod server was
   restarted on the new `dist/` (4800/4801) and the quest queue was wiped at the end of Session 3. **The MCP stdio
   child is STALE** — it still holds the pre-fix `dist/` from session boot (confirmed: it rejects `packagesAffected`
   with "Unrecognized key(s)"). A new session boots a fresh MCP child against current `dist/`, so this resolves
   automatically — but **re-`npm run build` is NOT needed unless you edit source again** (dist already current).
   Staleness probe: `create-quest` then `modify-quest({ packagesAffected: ['orchestrator'] })` on the `created` quest
   → NEW code returns "Field 'packagesAffected' not allowed in status 'created'" (gate); STALE returns "Unrecognized
   key(s)". Then seed + drive Flow 1 (pre-seeded chain, §"Flow 1" in `smoketest-mcp-orchestration.md`) to `complete`.
2. **Flow P** — pathseeker + post-walk hook (optional). **PW-3 is now fixed**, so the walk's `walkFindings` terminal
   commit should land at `in_progress` — Flow P is unblocked. Still needs a completeness-passing spec (borrow from a
   `complete` quest). All execution roles are already covered by Flows 1–3, so this remains lowest priority.
3. **(Optional) commit** the Session-3 fixes once Flow 1 confirms no regression.

## How to resume (next session)

1. Read `playbook/smoketest-mcp-orchestration.md` (procedure) + `playbook/quest-lifecycle.md` (model) + this file.
2. **Setup (§1):** `npm run prod:kill`; wipe quests
   (`rm -rf .dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests`); `npm run build`; `npm run prod`
   (server 4800 / web 4801). Open a fresh browser tab on `http://dungeonmaster.localhost:4801/codex/quest/<id>`.
3. The dungeonmaster MCP child runs the orchestrator **in-process** — `signal-back`/`run-ward`/`get-next-step`
   status derivation happens there, NOT in the prod server. After ANY rebuild, `/mcp` → reconnect.
4. **Seeding gotchas** (cost real debugging time):
   - work-item `id` + `dependsOn` entries must be **UUIDs**; step `id` must be **prefixed with its `slice`**
     (e.g. slice `orchestrator` → id `orchestrator-...`); step assertions use `{prefix, input, expected}`
     (NOT the doc's old `{channel,...}` placeholder).
   - Before each flow, **abandon all other non-terminal quests** (`modify-quest status: abandoned`) — `get-next-step`
     is FIFO-oldest, so a stale in_progress quest steals dispatch.
   - A direct `quest.json` disk seed needs ~3s for the web fallback poll; MCP reads disk fresh immediately.
5. Stub-agent recipe: a real `Task()` that calls `get-agent-prompt` then `signal-back` (real Task needed for
   identity resolution). Dispatch with `model: sonnet`.

## Testbed state at handoff

- Branch: `master`. All 7 fixes + docs + this handoff committed.
- prod may still be running on 4800/4801 (the next session's §1 kill+restart handles it).
- Leftover quests under the codex guild (one `complete`, one `abandoned`) — wipe in §1.
