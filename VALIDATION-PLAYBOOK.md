# Validation Playbook — Full Flow with Siege + Blight

End-to-end manual validation of the quest pipeline, written as if both Per-Flow Siegemaster (Plan 2) and Blightwarden (
Plan 1) are already implemented. Orchestrator (me) runs Phase 0 checks individually, then drives Phases 1–3 as a live
quest and branches to fixer agents on red.

---

## Picking Up Mid-Validation (New Session Handoff)

If you're a fresh Claude session resuming this smoke test, read these in order before doing anything else:

1. **This file** (the full playbook) — for rules, run lifecycle, bug procedure.
2. **`/tmp/validation-notes.md`** — per-run log. Find the last `## Run N` heading with `Outcome: in_progress` or
   `blocked` → that's where you pick up. Each entry has:
    - session / quest IDs
    - phase / checkpoint where it stopped
    - bugs filed (blocking vs non-blocking) and fix commit SHAs if already addressed
3. **`git log --oneline -30`** — recent bug-fix commits. Each validation-driven fix has a message prefixed with
   "Phase N checkpoint X.Y fix:" — these landed because a prior run blocked on them.
4. **`~/.claude/plans/we-need-to-add-generic-dream.md`** and **`~/.claude/plans/lets-do-this-as-misty-gray.md`** — only
   if you need context on WHY Siegemaster is per-flow or WHY Blightwarden exists. Both plans' progress trackers are
   fully checked (Plan A: 9 groups, Plan B: 10 groups); both features are merged to `master`.

**Resumption rules:**

- Continue from the last non-success run's phase/checkpoint. Do not re-run earlier successful checkpoints.
- If the last run was `blocked` AND the fix was committed, start a fresh run at the phase where it blocked (new
  quest, per Run Lifecycle).
- If the last run was `in_progress` with no blocker filed, the prior session may have just stopped mid-run — restart
  with a new quest on the same phase.
- **Abandon any non-terminal quests from prior runs before starting a new run.** Leftover in-flight quests dilute
  the repo: on dev-server restart, orchestration recovers them and their agents resume writing codeweaver outputs
  / blight reports / ward artifacts into the working tree, contaminating the new run. Abandon them via
  `mcp__dungeonmaster__modify-quest` (set `status: 'abandoned'`) — do not just park them.

---

## Ground Rules

Static policies. These hold for every run.

- **NEVER manually refresh the browser. EVER.** This includes F5, Ctrl+R, Cmd+R, right-click-reload, clicking the browser reload button, `page.reload()`, `mcp__claude-in-chrome__navigate` to the current URL, `key: "F5"`, `key: "ctrl+r"`, or ANY other mechanism that reloads the page. Manually refreshing **kills any agent currently running in the quest session** (PathSeeker, codeweaver, blightwarden, etc.) and corrupts the orchestration state. The UI manages its own state end-to-end: panels swap, statuses update, clarifications appear, execution progress renders — all via WebSocket. If something doesn't show up live, **that is a bug to file** — not something to work around with a refresh. If you see yourself about to refresh for any reason (including the phrase "refresh test"), stop, screenshot the current state, and describe what's missing. Refreshing is a destructive action on live runs. This rule supersedes any step in this playbook that appears to request a refresh; if you find such wording, treat it as a doc bug and edit it out before proceeding.
- **Autonomy: fix, then restart — do NOT ask for approval between runs.** After a blocking bug is fixed and committed, immediately follow Run Lifecycle step 1 for the next run. Do not pause to ask the user "should I start Run N?" or "do you want me to proceed?". The user will intervene if they want you to stop. Same rule applies mid-run: keep driving through checkpoints, branching to fixers on red, without checking in at every checkpoint. Only stop-and-ask when you genuinely cannot decide (ambiguous bug classification, missing context for a fix).
- **Orchestrator (you) does NOT edit source code or run ward directly.** Fix work and ward invocation MUST be delegated to sub-agents via the `Agent` tool. The orchestrator's job is to drive the flow, observe outcomes, classify bugs, dispatch agents, and commit results. Exceptions: the orchestrator may freely edit `VALIDATION-PLAYBOOK.md`, `/tmp/validation-notes.md`, and update task lists — those are process artifacts, not codebase changes. Everything else — contract edits, prompt edits, guard fixes, broker fixes, widget fixes, test updates, rebuilds — goes to an agent. This protects the orchestrator's context window for the full end-to-end validation run.
- **Kickoff surfaces.** Web UI, MCP tools, server HTTP endpoints. No slash commands.
- **Single dev server policy.** Only one dev server process is up at any time across the whole run.
- **Build before dev server.** Always run `npm run build` before starting the dev server (initial start AND every
  restart after a fix). All packages run from `dist/`, so a stale build will mask or create bugs that don't reflect the
  source tree.
- **Build before ward.** The orchestrator MUST run `npm run build` before every ward invocation (scoped or full). Ward
  resolves cross-package types and imports through each package's `dist/`, so a stale build surfaces as TS2339
  "property X does not exist" on cross-package APIs even when the source is correct. This is NOT optional — a fix agent
  that added a new export (e.g. `StartOrchestrator.resumeQuest`) will pass its own scoped ward inside its worktree
  (which ran its own build) but fail on master until the main tree rebuilds. Run `npm run build` at the repo root
  immediately after applying any sub-agent's patch, before handing off to the ward-runner agent.
- **Two dev servers: dev (manual) and prod (siege-spawned).** The validation orchestrator (you) runs `npm run dev` on
  ports 4750/4751 for the UI you drive. Siegemaster spawns its OWN test server via `npm run prod` on ports 4800/4801
  per `.dungeonmaster.json`. The two MUST NOT overlap; `devServerStartBroker` kills whatever is on its configured
  ports before binding, so a misaligned config would murder the main dev server mid-quest. Current config is correct
  out of the box.
- **MANDATORY: `npm run build` before every `npm run prod`.** Unlike `npm run dev` which uses `tsx watch` and runs from
  source, `npm run prod` runs the compiled server from `dist/` and serves the built web bundle via `vite preview`.
  ANY source change — contracts, statics, prompts, responders, brokers, widgets — is invisible to prod until `npm run
  build` is re-run. This applies to:
  - Your own edits between validation runs
  - Every fix-agent patch before the next siege phase can exercise it
  - Siegemaster's build preflight (already wired via `.dungeonmaster.json.devServer.buildCommand`) — confirmed on spawn,
    but if you ever trigger prod manually for debugging, run `npm run build` first or stale behavior WILL confuse you.
  Shortcut: `npm run prod:build-and-serve` does both in order. Use it whenever unsure whether dist is current.
- **Ports:** dev = 4750/4751 (manual, `.env` sourced). prod = 4800/4801 (siege + manual prod, `.env.prod` sourced).
  `DUNGEONMASTER_HOME` is shared across both modes; the subdirectory split comes from `DUNGEONMASTER_ENV`
  (`dev` → `.dungeonmaster-home/.dungeonmaster-dev/`, `production` → `.dungeonmaster-home/.dungeonmaster/`).
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
2. **Kill all background processes and running commands from prior runs.** Before (re)starting the dev server or
   kicking off a new run, terminate:
  - Any leftover `npm run dev` / vite / tsx server processes (ports 4750, 4751, or whatever your `.env` assigns).
  - Any orchestrator-owned background `Bash` tool tasks (polling loops, dev server bg processes).
  - Any child Claude CLI processes still running from prior orchestration (`pgrep -af claude`).
  - Any leftover test dev servers started by a prior siege run.
    Use `npm run dev:kill` for the primary server; use `jobs` / `kill %N` for orchestrator-owned bg bash; use
    `pkill -f <pattern>` as a last resort. A stale background process will hold ports, file locks, or keep emitting
    output that confuses the next run.

3. **Abandon any non-terminal prior-run quests.** Enumerate with `mcp__dungeonmaster__list-quests` and abandon every
   quest whose status is not already `complete` / `abandoned` / `blocked` via `mcp__dungeonmaster__modify-quest`
   (set `status: 'abandoned'`). Without this, dev-server startup recovery will re-register those quests and their
   agents will resume writing codeweaver outputs / blight reports into the working tree during the new run.
4. **Build.** `npm run build` — packages run from `dist/`, stale builds mask or invent bugs.
5. **Start dev server.** Single process only. Leave it up for the whole run.
6. **Initialize the notes file.** `/tmp/validation-notes.md` (outside the repo so it never gets committed). Create on
   first run of a validation session; append to it on subsequent runs.
7. **Start a new quest.** Web UI (http://dungeonmaster.localhost:4751/codex/session) → "New Chat" → describe the trivial
   2-flow feature.
8. **Record the run.** As soon as the session URL appears (`/codex/session/<uuid>`), add a `## Run N` heading to
   `/tmp/validation-notes.md` with the URL. One entry per run, every run.
9. **Drive the smoke flow** through the phase's checkpoints.
10. **Record the outcome** under the `## Run N` heading when the run ends:
    - **success** — reached `complete`, all checkpoints green.
    - **blocked** — note the checkpoint and link to the bug entry.
11. **If blocked:** follow *Blocking Bug Procedure* below, then loop back to step 1 for a new run.
    **If success:** proceed to the next phase (or declare validation done if this was the final phase).

---

## Spec Snapshot — Reuse Clean Spec Across Runs

ChaosWhisperer's spec phase (flow exploration, observable embedding, gap-minion, clarifications) is expensive and
deterministic in outcome for a fixed prompt. A bug encountered later in the pipeline (Phase 1.2+) does not invalidate a
good spec. Snapshot the quest the moment Phase 1.1 reaches a clean Gate #2 so the next run can skip straight to the
Begin Quest click.

**When to snapshot:** Phase 1.1 has reached status `review_observables` with the APPROVE button visible, all
clarifications resolved, observables embedded, contracts populated. ChaosWhisperer is idle. No pending spec work.

**Snapshot procedure (run once per clean Gate #2, before clicking APPROVE):**

Copy the entire quest folder (named by UUID, containing `quest.json`) into `tmp/smoke-test-quest/`, preserving the
folder name so restore is a one-shot copy back into the guild's `quests/` dir.

```
rm -rf tmp/smoke-test-quest/*
cp -r .dungeonmaster-home/.dungeonmaster-dev/guilds/<guildId>/quests/<questId> tmp/smoke-test-quest/
```

After snapshot, `tmp/smoke-test-quest/<questId>/quest.json` exists.

- **Always overwrite.** The newest clean spec wins — no snapshot history.
- **Keep the UUID-named folder.** Restore is `cp -r tmp/smoke-test-quest/<questId> .dungeonmaster-home/...quests/` with
  no path surgery.
- **Snapshot goes in `<repoRoot>/tmp/smoke-test-quest/`**, not `~/tmp` (permission issues) and not `/tmp` (outside repo
  permission scope; survives wipes). The `tmp/` dir is already git-ignored.

**How to restore (on a blocked-run restart that wants to skip spec):**

1. With the dev server stopped, copy the snapshotted folder back:
   ```
   cp -r tmp/smoke-test-quest/<questId> .dungeonmaster-home/.dungeonmaster-dev/guilds/<guildId>/quests/
   ```
2. Start the dev server — startup recovery picks up the quest.
3. Navigate to the quest's bound `activeSessionId` URL (from the snapshotted `quest.json`). The UI should land on
   `review_observables` with APPROVE visible. Click APPROVE, then Begin Quest — resumes at Phase 1.2 with zero
   ChaosWhisperer re-work.

**Cleanup:** delete `tmp/smoke-test-quest/` contents once Phase 1 is declared done (no longer needed, and a stale
snapshot is worse than no snapshot).

---

## Fix Agent Launch Protocol (MANDATORY)

Fix agents without these rules scope-creep, patch symptoms instead of roots, and justify messes as "pre-existing" or
"unrelated." These rules are NON-NEGOTIABLE and must be present verbatim in every fix-agent prompt. If a rule is
missing from the prompt, the agent WILL violate it — this has been empirically demonstrated.

### Orchestrator duties when launching a fix agent

1. **Default to `isolation: "worktree"`.** Every fix agent runs in a throwaway worktree unless the fix is docs-only or
   you can name the exact ≤1 file it'll touch. Scope creep in a worktree is cleanup-by-`rm`; scope creep in the main
   tree is what happened in Run 7 (25 modified + 15 new files, 512 insertions).
2. **Pre-declare the allowlist.** Before dispatching, read the bug site yourself enough to name the specific file(s)
   the fix should touch, and put that list in the prompt as a hard ceiling. Don't outsource *understanding* — "find
   the guard that…" invites the agent to substitute its own target.
3. **Verify the diff before accepting the report.** Run `git diff --stat HEAD` yourself after the agent returns. If
   the delta exceeds the allowlist or the line count looks wrong, reject the work, do not try to salvage — revert and
   redispatch with a tighter prompt.
4. **Include the Fix Agent Prompt Requirements below verbatim** in every fix-agent prompt.

### Fix Agent Prompt Requirements (paste into every fix-agent prompt)

```
You are a fix agent. The following rules are NON-NEGOTIABLE. Violating any of them means your work is rejected.

1. ROOT CAUSE, NOT SYMPTOM. Trace the bug to the FIRST line of code that caused the bad state, not to the most
   convenient read-site. Your report MUST include a one-sentence "Root cause:" line naming a specific file:line.
   - Render/UI bug: find the MUTATOR (useState setter, useEffect, reducer, WS handler) that caused the bad state.
     Gating the render is a band-aid; fix the mutator. If you can't explain which mutator fires and why, you haven't
     diagnosed yet.
   - API/network bug: find the PRODUCER of the bad payload, not the consumer.
   - Test failure: find the PRODUCTION-CODE change that broke the assertion, not the assertion itself.

2. ASSUME NOTHING.
   - Dependencies don't exist until proved. If a symbol/file you need seems missing, `grep` / `discover` to confirm
     absence, then STOP and report back. DO NOT build the missing dependency to unblock yourself.
   - Run `git status` and `git diff --stat HEAD` at the START of your work and quote the output in your final report.
     No "already there before I started" claims allowed — they will be fact-checked.
   - "Pre-existing" / "unrelated" ward failures are rejected by default. If you want to call a failure pre-existing,
     include `git log -S '<failing symbol>'` output proving the failure exists on master at HEAD before your session.

3. HARD SCOPE ALLOWLIST. You may edit ONLY the files the orchestrator pre-declared in the prompt. Anything else is
   scope creep. If the fix requires editing a file not in the allowlist, STOP and report back with the reason — do
   NOT edit it. "My tests needed a broker that doesn't exist, so I built it" is the exact failure mode this rule
   prevents.

4. DIFF SUMMARY BEFORE DONE. Before claiming completion, run `git diff --stat HEAD` and paste the output verbatim into
   your report. Also list every untracked file (`git status --porcelain | grep '^??'`). This catches silent scope
   creep.

5. FULL-REPO WARD. Run `npm run ward` from the repo root with no path scoping, `timeout: 600000`. A scoped ward
   passes while the repo is broken. If any package fails, it is YOUR problem until you prove otherwise per rule #2.

6. TDD-FIRST (see "TDD-First Fix Process" below). Failing tests land BEFORE source edits. Your report names the
   tests, the failing assertion messages before the fix, and the passing assertions after.
```

---

## TDD-First Fix Process (MANDATORY for every fix agent)

Every fix agent dispatched from this playbook MUST follow this order. No exceptions. If an agent starts editing source
before it has a failing test that proves the bug, it has failed its task — dispatch a replacement.

1. **Explore.** Before touching any source, the agent reads the surrounding code to understand how the feature is
   supposed to work end-to-end: which widget renders it, which binding wires it up, which HTTP/MCP endpoint the UI
   calls, which broker does the work, which status transitions are involved, how tests in the area are structured.
   `git log -S "<keyword>"` / `git show` is fair game to see how a missing feature used to be built. This phase
   produces *understanding*, not code.
2. **Enumerate the behavior matrix.** List every state/input combination the fix has to satisfy — the full truth
   table, not the one happy path. If the user already gave you the matrix (e.g., the list of quest statuses where
   the pause button should/shouldn't render), that matrix is the contract. Each row is a future test case.
3. **Write the failing tests that prove the bug exists.** Landed tests only — no mock patches to make them green,
   no `.skip`, no `.todo`. They must run against the real current code and fail for the right reason. The agent
   reports which tests it wrote and which exact assertion fails in each (e.g., `expect(find('PAUSE_BUTTON')).toBeVisible() — currently fails: element not found`).
4. **Fix the code until every test passes.** Minimal change. Do not refactor surrounding code. Do not add tests for
   things outside the matrix.
5. **Run ward.** Green gate. Agents use `npm run ward` from repo root with `timeout: 600000`. Never `cd` into
   a package. If ward catches something outside the fix's footprint, diagnose — don't hand-wave as "pre-existing."
6. **Report back.** Explicit list: which tests were written, which assertion failed before, which passes now, what
   files changed, ward status. No commits — the orchestrator commits after receiving the report.

When the orchestrator (you) writes a fix-agent prompt, include step 1 (what to explore), step 2 (the behavior matrix,
spelled out), and an explicit instruction that step 3 (failing tests) MUST land before step 4 (source fix). If the
agent returns saying "I just fixed it, here's ward green," reject the work — the regression proof (failing-then-passing
test) is the point.

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

### Root Cause Analysis (required before any fix agent dispatch)

**Rule:** The orchestrator MUST fully understand a bug — to the level of naming the causal file:line — BEFORE
dispatching a fix agent. Fix agents given a symptom description instead of a root-cause pointer balloon their scope,
patch the wrong layer, and rationalize the mess (see Run 7: agent was asked "find the guard that opens the modal,"
substituted its own target, built an entire abandon-quest feature, and patched a render symptom while leaving the
causal `useEffect` untouched).

**When the bug was REPORTED BY THE USER (symptom-only description):**

1. **Dispatch an RCA sub-agent — research only, NO source edits.** The agent's job is to trace the user's reported
   symptom back to the first line of code that produces the bad state. Prompt must forbid all file edits; permitted
   actions are `discover`, `Read`, `git log -S`, `git blame`. Report must include:
    - The exact causal file:line (e.g., `quest-chat-widget.tsx:108 — useEffect uses isGateApprovedQuestStatusGuard
      which matches flows_approved, causing setApprovedModalOpen(true) to fire at the wrong gate`).
    - The mutator chain (which state changes, driven by which effect/handler/broker).
    - What the correct behavior should be, with evidence from adjacent code / contract / status machine.
    - Any ambiguities the orchestrator needs to resolve before a fix can be scoped.
      Use `isolation: "worktree"` so the agent can't accidentally edit; scope to exploration-only in the prompt.
2. **Review the RCA report.** The orchestrator must be able to answer, in one sentence each: (a) where does this bug
   originate? (b) what's the mutator? (c) what's the minimal fix? (d) what files should the fix touch? If any of
   these answers is "I'm not sure," the RCA is incomplete — either redispatch with a tighter question, or go to step 3.
3. **If ambiguities remain, question the USER before dispatching a fix agent.** Do NOT guess. Examples of ambiguities
   that warrant asking:
    - Multiple plausible root causes — ask which one matches the user's observation.
    - Expected behavior is disputed or undocumented — ask for the correct semantics.
    - Scope is uncertain — ask what should/shouldn't change.
    - The fix implies a contract change — ask for approval before proceeding.
      Ask direct questions with concrete options. Do not proceed until the user resolves each ambiguity.
4. **Only after full understanding, dispatch the fix agent** per the Fix Agent Launch Protocol with a tight allowlist
   derived from the RCA findings. The fix-agent prompt must cite the causal file:line from the RCA — NOT just restate
   the symptom.

**When the orchestrator DIRECTLY OBSERVED the bug and can cite the causal file:line already:** the orchestrator's own
observation IS the RCA. Skip the RCA agent. Proceed to ambiguity-check (step 3) and then fix dispatch (step 4). The
test: if you can't write down "Root cause: path/to/file.ts:<line> — <one-sentence explanation>" from your own context,
you do NOT have the RCA yet and must use the agent.

### Blocking Bug Procedure

1. Stop the current phase.
2. Notate the bug (above).
3. **Kill the dev server** (`npm run dev:kill` or equivalent). Fix agents must not race a live server; a stale server
   holds file locks / ports.
4. **Revert quest-generated artifacts.** Any uncommitted working-tree changes are almost certainly from smoke-test
   agents (codeweaver/blightwarden outputs), not the bug itself. Revert BEFORE dispatching fixers so agents work from a
   clean base.
5. **Do Root Cause Analysis first** (see that section above). No fix agent is dispatched until the orchestrator can
   cite the causal file:line from its own observation or from an RCA sub-agent's report, AND every material ambiguity
   has been resolved with the user. Skip this step only if you directly observed the bug and can write
   `Root cause: path/to/file.ts:<line> — <one-sentence explanation>` from your own context.
6. **Dispatch fix agents per the Fix Agent Launch Protocol** (see that section above). One bug per agent, hard file
   allowlist pre-declared by the orchestrator (derived from the RCA), `isolation: "worktree"` by default, Fix Agent
   Prompt Requirements pasted verbatim into the prompt. Rebuild `@dungeonmaster/shared` if touched.
7. **Verify the diff before accepting the report.** Run `git diff --stat HEAD` after the agent returns. If the delta
   exceeds the pre-declared allowlist or contains untracked files outside it, REJECT the work — `git reset --hard` +
   `git clean -fd`, then redispatch with a tighter prompt. Do NOT try to salvage a ballooned agent response.
8. **Dispatch a ward-runner agent** to run `npm run ward` (timeout 600000, full repo, no path scoping) and fix any
   failures it finds. Orchestrator does NOT run ward directly — keep output and fix iteration off main context.
   Ward-runner reports back only when ward is fully green.
9. **Commit the fix** — one focused commit per bug, message references phase/checkpoint.
10. Mark the current run's outcome as **blocked** in notes, then return to *Run Lifecycle* step 1.

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
  native input events that React hooks into), then `computer.key Return` to submit. Confirmed round-trip: ChaosWhisperer
  responds, and after a couple of minutes the UI will auto-navigate the URL to `/codex/session/<uuid>`.

## Never Manually Navigate the Session URL

**Do NOT manually navigate the browser to `/codex/session/<uuid>` by grabbing the session id via MCP `list-quests` and
calling `navigate`.** The UI owns the URL transition. It will auto-navigate on its own — but the session id takes a
couple of minutes to surface after ChaosWhisperer finishes its first turn. Be patient. Manually navigating corrupts the
session state and the run will need to be restarted.

**Procedure:**

- After submitting the first chat message, stay on `/codex/session` (no uuid) in the browser.
- Poll quest status via MCP `list-quests` / `get-quest` and/or watch the on-page chat stream to observe ChaosWhisperer's
  progress.
- The URL will transition to `/codex/session/<uuid>` on its own within ~2 minutes of the first turn completing.
- Known non-blocking issue: the transition takes a couple of minutes; fix is out of scope for the smoke test.

## Polling for Quest Status Transitions

Use the MCP tool `mcp__dungeonmaster__get-quest` (passing the quest id) to check status. Do NOT write a bash background
loop that greps the on-disk `quest.json` — the pre-bash hook can block inner searches, and the file layout has subtle
multi-line escaping that makes `grep -oE '"status":"..."'` silently match empty strings (observed during Run 3, which
then idled for 2+ minutes with no STOP trigger and no notification). If you need a timer, set one for a fixed short
interval (e.g. 60–120 seconds), then re-call `get-quest` in the main thread.

**Gate states to stop at:** `review_flows`, `review_observables`, `approved`, `seek_scope`, `seek_synth`, `seek_walk`,
`seek_plan`, `in_progress`, `complete`, `blocked`, `abandoned`. The first three require a user action (approve /
begin-quest). The rest are pipeline status changes.

## Clarification Questions (Blocking) — ChaosWhisperer only

**Only ChaosWhisperer emits clarification questions. PathSeeker is autonomous and never asks.**

During the spec phase, ChaosWhisperer may surface clarification questions in a dedicated CLARIFICATION panel in the
Web UI. Each question has multiple pre-written answer options plus an "Other..." free-text option. ChaosWhisperer is
**blocked** until the orchestrator (me) picks an answer — it will not proceed to the next question, the next phase,
or any gate until the answer is selected.

**Procedure during spec phase (between "New Chat" and Gate #2 approve):**

- While watching the chat, also watch for a CLARIFICATION panel appearing in the Web UI.
- Each question shows "Question N of M". Answer them in order.
- For smoke tests, pick the **most testable / unambiguous** option (usually the first DOM-order / exact-text option).
  If no option fits, use "Other..." with a terse literal assertion the Siegemaster can check.
- Only after every question is answered will ChaosWhisperer move to the next status.

**After Gate #2 (approved / seek_scope onward):** ignore any leftover CLARIFICATION panel — PathSeeker is autonomous
and will not emit new questions.

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

### 1.2 — Execution kickoff (MUST go through the UI, not MCP)

**Critical:** After approving observables at Gate #2, a "Begin Quest" popup/modal surfaces in the Web UI. Click it. Do
NOT bypass by calling `mcp__dungeonmaster__start-quest` directly — that skips the UI-side state transition that tells
the web session to switch from chat-view to execution-panel-view. If you bypass, the UI may get stuck on the chat view
even though orchestration is running, and refreshing the session URL can send you back to chat view instead of the
execution panel.

- **Action:** In the Web UI, click the "Begin Quest" button in the popup that appears after Gate #2.
- **Assert (in order, screenshot each — DO NOT REFRESH between checks):**
    1. **UI switches to the execution panel automatically.** The WebSocket `quest-modified` event drives this — no
       manual reload, no URL change, no second click. Within a few seconds of the Begin Quest click, the layout
       must swap from the observables approval / spec view to the execution panel (tab "EXECUTION | QUEST SPEC",
       HOMEBASE section with work items like `[CHAOSWHISPERER] Chaoswhisperer DONE` and
       `[PATHSEEKER] Planning steps... RUNNING`, `data-testid="execution-panel-widget"` visible). Screenshot to
       confirm.
    2. Status → `seek_scope` (or further). PathSeeker work item dispatched by orchestration loop.

**→ FAIL assertion #1 (UI never switches after Begin Quest click):** UI bug in the execution-panel guard or in the
binding that reacts to `quest-modified`. Most likely candidate: `isExecutionPhaseGuard` is missing one of the
intermediate statuses (`seek_scope`, `seek_synth`, `seek_walk`, `seek_plan`, `in_progress`). File it, fix, restart.
DO NOT attempt to refresh to "confirm" — refreshing kills the running agent.
**→ FAIL no "Begin Quest" popup appears:** UI bug in the post-Gate-#2 flow. File it, fix, restart.
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
