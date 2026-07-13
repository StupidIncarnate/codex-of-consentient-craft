# Validation Playbook — Full Live Flow (operations relay)

End-to-end manual validation of the quest pipeline. Flowrider, Siegemaster, Lawbringer, and Blightwarden are operation
items in the live relay. The orchestrator (you) runs Phase 0 checks individually, then drives Phases 1–3 as a live quest
and branches to fixer agents on red.

---

## Current execution model (read first)

Execution is a **reactive relay over the quest's `operations` ledger** — an ordered `OperationItem[]` the orchestrator
works one agent *session* at a time. It is **not** auto-dispatched by the server. Three surfaces drive a quest:

- **Spec** runs in the Web UI (or via `/dumpster-create`): ChaosWhisperer through the two approval gates. During
  `explore_observables` ChaosWhisperer ALSO authors the `operations` ledger — the ordered `{ role: 'codeweaver', text }`
  implementation items (one per scope a Codeweaver session builds). The approval gate requires ≥1 `codeweaver` item.
- **Start Quest** (Web UI button → `orchestration-start-responder`) seeds the relay: `questBuildRelayGraphBroker`
  appends the fixed verify tail as operation items and creates the FIRST work item, then flips the quest to
  `in_progress` and enqueues it. It **spawns nothing**.
- **Dispatch** actually runs the work. Two interchangeable dispatchers share one brain (`quest-get-next-step-broker` +
  `signal-back` + the dispatch scan):
    - **Node/UI mode (primary)** — the `/queue` play button starts the server-side Node dispatch runner, which loops
      `get-next-step` in-process and spawns headless `claude -p` children.
    - **MCP mode** — `/dumpster-launch`, a loop in your Claude session: `get-next-step()` → `Task()` (agents) /
      `run-ward` (ward) → await → repeat.
  Without a dispatcher running, nothing executes.

Consequences for this playbook:

- The quest stays at `in_progress` for the whole execution phase. There are **no `seek_*` statuses** and no PathSeeker
  planning phase — ChaosWhisperer runs the entire spec lifecycle; the orchestrator drives the relay entirely within
  `in_progress`.
- `get-next-step` dispatches **one work item per response** — one operation item at a time. `questAdvanceBroker` creates
  exactly ONE work item for the first `pending` operation item (marking it `in_progress` in the same atomic write), then
  waits for its `signal-back` (or ward exit) before advancing. A ready `ward` item is dispatched alone via `run-ward`.
- **There is no failure signal — only forward.** An agent that can't finish its scope signals `operationStatus:
  'partial'`; the orchestrator marks its operation item `complete` and appends a `"pt N: {text}"` continuation a fresh
  session runs (the verify fixpoint). The ONLY failure concept is a **ward exit-code red**, which inserts a
  `spiritmender` operation item + a fresh ward. A server crash mid-session **resumes** the orphaned session
  (`claude --resume`) — it does not restart it. The **sole** path to `blocked` is a spent bounded loop (ward-retry, a
  locked role's `pt N` chain, or orphan-recovery exhaustion).

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
4. **`docs/quest-role-paths.md`** and **`packages/orchestrator/CLAUDE.md`** — the authoritative model for the operations
   relay: per-role happy/sad transitions, block ownership, the verify fixpoint, and how quest status is derived. Read
   these if you need context on why Flowrider / Siegemaster / Lawbringer / Blightwarden each run as ONE session over all
   flows / the whole diff.

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
- **Kickoff surfaces.** Spec + Start Quest go through the Web UI (and MCP tools / server HTTP endpoints) as a real user
  would. Execution dispatch is the one place a slash command is required: after Start Quest you run `/dumpster-launch`
  in
  your Claude session to drive the work-item loop (see "Current execution model"). Do not use `/dumpster-create` for the
  spec — drive that through the UI.
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
- **Two servers: smoke test (prod, manual) and agent-spawned (dev).** Flowrider and Siegemaster own their own dev server
  for runtime flows (via Playwright's `webServer` config, resolved from `.dungeonmaster.json`) — no other role
  (codeweaver, lawbringer, blightwarden, ward) touches the dev-server lifecycle. The validation orchestrator (you) runs
  `npm run prod` on ports 4800/4801 for the smoke-test UI you drive — the compiled server from `dist/`, exercising the
  same code a real user would hit. A runtime-flow agent spawns its OWN test server via `npm run dev` on ports 4750/4751
  per `.dungeonmaster.json`. The two MUST NOT overlap; the dev server kills whatever is on its configured ports before
  binding, so a misaligned config (e.g. pointed at 4800) would murder the smoke-test server mid-quest. Current config is
  correct out of the box.
- **MANDATORY: `npm run build` before every `npm run prod`.** Unlike `npm run dev` which uses `tsx watch` and runs from
  source, `npm run prod` runs the compiled server from `dist/` and serves the built web bundle via `vite preview`.
  ANY source change — contracts, statics, prompts, responders, brokers, widgets — is invisible to prod until `npm run
  build` is re-run. This applies to:
    - Your own edits between validation runs — the smoke-test server runs from dist/
    - Every fix-agent patch before the next run can exercise it
    - Siegemaster's build preflight (already wired via `.dungeonmaster.json.devServer.buildCommand`) still runs — it
      builds the orchestrator code that spawns siegemaster, even though siege's own dev server runs from source via tsx.
  Shortcut: `npm run prod:build-and-serve` does both in order. Use it whenever unsure whether dist is current.
- **Ports:** prod = 4800/4801 (smoke-test orchestrator, `.env.prod` sourced). dev = 4750/4751 (spawned by a runtime-flow agent,
  `.env` sourced). `DUNGEONMASTER_HOME` is shared across both modes; the subdirectory split comes from
  `DUNGEONMASTER_ENV` (`dev` → `.dungeonmaster-home/.dungeonmaster-dev/`,
  `production` → `.dungeonmaster-home/.dungeonmaster/`).
- **Agent crash mid-session (any role).** An `in_progress` work item observed during a get-next-step scan is orphaned;
  `recover-orphaned-work-items-layer-broker` flips it back to `pending` keeping `sessionId`/`agentId` + a `resume`
  marker, and Node/UI dispatch resumes the retained Claude session (`claude --resume`) so partial work survives — no
  duplicate work item (strict 1:1). A crash-looping session is bounded by `slotManagerStatics.orphanRecovery.maxResets`
  → `blocked`.
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
2. **Kill all background processes and running commands from prior runs.** Before (re)starting the smoke-test server
   or kicking off a new run, terminate:

- Any leftover `npm run prod` / `npm run dev` / vite / tsx / node server processes on ports 4800, 4801 (smoke test)
  or 4750, 4751 (siege-spawned).
- Any orchestrator-owned background `Bash` tool tasks (polling loops, server bg processes).
  - Any child Claude CLI processes still running from prior orchestration (`pgrep -af claude`).
  - Any leftover test dev servers started by a prior siege run.
    Use `npm run prod:kill` for the primary smoke-test server; `npm run dev:kill` for any leftover siege-spawned
    dev processes; use `jobs` / `kill %N` for orchestrator-owned bg bash; use `pkill -f <pattern>` as a last resort. A
    stale background process will hold ports, file locks, or keep emitting output that confuses the next run.

3. **Abandon any non-terminal prior-run quests.** Enumerate with `mcp__dungeonmaster__list-quests` and abandon every
   quest whose status is not already `complete` / `abandoned` / `blocked` via `mcp__dungeonmaster__modify-quest`
   (set `status: 'abandoned'`). Without this, dev-server startup recovery will re-register those quests and their
   agents will resume writing codeweaver outputs / blight reports into the working tree during the new run.
4. **Build.** `npm run build` — packages run from `dist/`, stale builds mask or invent bugs. The smoke-test server
   (prod) runs from `dist/` too, so this is mandatory before every server (re)start.
5. **Start smoke-test server.** `npm run prod` (ports 4800/4801). Single process only. Leave it up for the whole run.
   Do NOT run `npm run dev` — that port range is reserved for the dev server a runtime-flow agent (Flowrider/Siegemaster) spawns during verification.
6. **Initialize the notes file.** `/tmp/validation-notes.md` (outside the repo so it never gets committed). Create on
   first run of a validation session; append to it on subsequent runs.
7. **Start a new quest.** Web UI (http://dungeonmaster.localhost:4801/codex/session) → "New Chat" → describe the trivial
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
Start Quest click.

**Two snapshot windows exist; only the first is reliable for LLM orchestration:**

1. **Pre-Gate-#2 (RELIABLE — do this one).** Phase 1.1 has reached status `review_observables` with the APPROVE button
   visible, all clarifications resolved, observables embedded, contracts populated. ChaosWhisperer is idle. The quest
   is paused by the gate itself — nothing is dispatching downstream yet. Snapshot now; restore skips ChaosWhisperer
   entirely.
2. **Post-Start-Quest, pre-dispatch (also viable).** The Start Quest click seeds the relay (the verify tail + the first
   codeweaver work item) and flips the quest to `in_progress`, but **dispatches nothing** — work only runs once a
   dispatcher (the `/queue` play button or `/dumpster-launch`) starts. So the moment after Start Quest (before you start
   dispatch) is a stable, clean pre-execution state with no race: no agent is running, no codeweaver has written a file.
   Snapshotting here would skip ChaosWhisperer entirely and let you re-enter at the start of dispatch. In practice
   Window 1 is still simplest (it also covers re-testing the Start Quest click itself), so prefer Window 1 unless you
   specifically want to skip the approval clicks.

**When to snapshot (Window 1):** Phase 1.1 has reached status `review_observables` with the APPROVE button visible, all
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
   `review_observables` with APPROVE visible. Click APPROVE, then Start Quest — resumes at Phase 1.2 with zero
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

**Gate states to stop at:** `review_flows`, `review_observables`, `approved`, `in_progress`, `complete`, `blocked`,
`abandoned`. The first three require a user action (approve / Start Quest). `in_progress` covers the entire execution
phase — relay progress is visible in `quest.operations[]` item statuses and `workItems[]`, not in the quest status
(there are no `seek_*` statuses).

## Clarification Questions (Blocking) — ChaosWhisperer only

**Only ChaosWhisperer emits clarification questions. The execution-relay agents are autonomous and never ask.**

During the spec phase, ChaosWhisperer may surface clarification questions in a dedicated CLARIFICATION panel in the
Web UI. Each question has multiple pre-written answer options plus an "Other..." free-text option. ChaosWhisperer is
**blocked** until the orchestrator (me) picks an answer — it will not proceed to the next question, the next phase,
or any gate until the answer is selected.

**Procedure during spec phase (between "New Chat" and Gate #2 approve):**

- While watching the chat, also watch for a CLARIFICATION panel appearing in the Web UI.
- Each question shows "Question N of M". Answer them in order.
- For smoke tests, pick the **most testable / unambiguous** option (usually the first DOM-order / exact-text option).
  If no option fits, use "Other..." with a terse literal assertion Flowrider / Siegemaster can check.
- Only after every question is answered will ChaosWhisperer move to the next status.

**After Gate #2 (approved / in_progress onward):** ignore any leftover CLARIFICATION panel — the execution-relay agents
are autonomous and will not emit new questions.

---

## Phase 1 — Happy Path Smoke Test

One quest, one clean run, from Web UI new chat to `complete`. Two flows (one runtime UI, one operational CLI), ~3 steps
total.

### Cross-cutting expectations (apply to every checkpoint below)

These came out of smoke runs and belong on every checkpoint unless explicitly overridden.

- **WebSocket-driven UI updates, no refresh required.** Every quest state change (work-item status flip, sessionId
  assignment, tool-call arrival) must reflect in the UI within seconds of the persist. If the UI lags or drifts from
  server truth, that is a bug to file — NOT a reason to refresh the browser. Refresh is destructive on live runs.
- **Tool-group rendering shows ALL tool calls.** When a codeweaver/siege/etc. row is expanded, every tool_use entry for
  that agent must render (`N Tools` groups, each expandable). If only the latest tool shows, the chat-entry-list's
  `collapseToLast` / companion filters are over-filtering — file the rendering bug.
- **PAUSE / RESUME buttons key off REAL `quest.status`, not `displayStatus`.** `displayStatus` is a derived label that
  shows the pre-pause status when paused (so users see "RUNNING" dim'd out rather than "PAUSED"). Button visibility
  must use `quest.status` directly: `paused` → RESUME visible, PAUSE hidden; `in_progress`/etc. → PAUSE
  visible, RESUME hidden. If the button logic leaks through `displayStatus` you get a paused quest stuck with only the
  PAUSE button — file as a blocker.
- **Server restart does NOT re-hydrate the browser's in-memory React state.** If you kill and restart the orchestrator
  server (snapshot restore, crash recovery, whatever), the browser's accumulated WebSocket state stays stale — it was
  never designed to re-fetch on WS reconnect. A single full page load fixes it. Since WS is the only in-flight
  transport, a load when the quest is paused is safe (no agents to kill). Note this as a product concern — the UI
  *should* re-fetch on reconnect, but currently doesn't.

### 1.1 — Spec creation (ChaosWhisperer)

- **Action:** `npm run build` then `npm run prod` (smoke-test server on 4800). Web UI → "New Chat". Describe a trivial
  2-flow feature in natural user language — DO NOT leak implementation details (folder types, package names, scope
  counts) into the prompt. The feature should read like something a product owner would ask for.
- **Assert:**
    - Status walk: `created` → `explore_flows` → `review_flows` → (approve) → `flows_approved` → `explore_observables` →
      `review_observables` → (approve) → `approved`
    - `quest.flows[]` has 2 flows, each with nodes + edges + observables on terminal nodes
    - **ChaosWhisperer authors the `operations` ledger during `explore_observables`** — an ordered list of
      `{ role: 'codeweaver', text }` implementation items (one per scope a Codeweaver session builds). Read `quest.json`
      `operations[]` (or the QUEST SPEC tab's operations ledger, `data-testid="OPERATIONS_LEDGER"`) and confirm ≥1
      `codeweaver` item. **The `approved` gate refuses to open without one** — an empty/codeweaver-less ledger keeps the
      APPROVE button disabled.
    - Chat streams token-by-token in UI
    - `chaoswhisperer-gap-minion` dispatched visibly as a sub-agent

**→ FAIL (no codeweaver op items / gate opens anyway):** fix the ChaosWhisperer prompt (ledger authoring) or the
approval gate (`has-quest-gate-content-guard` + the web approve button). Restart 1.1.
**→ FAIL (chat/spec layer):** fix chat/spec layer. Restart 1.1.
**→ PASS:** continue.

### 1.2 — Execution kickoff (MUST go through the UI, not MCP)

**Critical:** After approving observables at Gate #2, a "Start Quest" popup/modal surfaces in the Web UI. Click it. Do
NOT bypass by calling `mcp__dungeonmaster__start-quest` — the smoke test's whole purpose is to exercise the UI path a
real user takes. A quest started via MCP may land in the same orchestrator state, but the UI flow (modal → click →
state swap → WS broadcast → execution panel render) has not been tested, so the run proves nothing about that path.

- **Action:** In the Web UI, click the "Start Quest" button in the popup that appears after Gate #2. Then start a
  dispatcher: click the `/queue` page play button (Node/UI mode, the primary path) OR run `/dumpster-launch` in your
  Claude session (MCP mode). Start Quest seeds the relay but dispatches nothing on its own.
- **Assert (in order, screenshot each — DO NOT REFRESH between checks):**
    1. **UI switches to the execution panel automatically.** The WebSocket `quest-modified` event drives this — no
       manual reload, no URL change, no second click. Within a few seconds of the Start Quest click, the layout must
       swap from the observables approval / spec view to the execution panel (tab bar `execution-panel-tab-execution`
       "EXECUTION" | `execution-panel-tab-spec` "QUEST SPEC", `data-testid="execution-panel-widget"` visible).
       Screenshot to confirm.
    2. **The operations ledger renders in the execution panel** (`data-testid="OPERATIONS_LEDGER"`, rows
       `OPERATIONS_LEDGER_ROW` — role badge + text + status; ward rows show a `(changed)`/`(full)` mode tag). The status
       bar (`execution-status-bar-layer-widget`) reads `EXECUTION — 0/M OPERATIONS` once the relay is seeded (or
       `AWAITING PLAN` before Start Quest seeds it).
    3. Status → `in_progress`. `questBuildRelayGraphBroker` appended the verify tail as operation items
       (`ward(changed) → flowrider → siegemaster → lawbringer → blightwarden → ward(full)`, all `locked`, `pending`) and
       created ONE work item for the FIRST `codeweaver` operation item, marking that operation `in_progress`.
    4. Once a dispatcher is running, the first codeweaver work item flips to `in_progress` (a flat
       `execution-row-layer-widget` row, `RUNNING` badge) and gets a `sessionId`.

**→ FAIL assertion #1 (UI never switches after Start Quest click):** UI bug in the execution-panel guard or in the
binding that reacts to `quest-modified`. Most likely candidate: `shouldRenderExecutionPanelQuestStatusGuard` is missing
`in_progress`. File it, fix, restart. DO NOT refresh to "confirm" — refreshing kills the running agent.
**→ FAIL assertion #4 (nothing dispatches):** confirm a dispatcher is actually running and `get-next-step` is being
polled. If `get-next-step` returns `idle` despite a pending operation item with no live work item, debug the scan
self-heal / advance; if no dispatcher is running, nothing will dispatch — that is expected, not a bug.
**→ FAIL no "Start Quest" popup appears:** UI bug in the post-Gate-#2 flow. File it, fix, restart.
**→ PASS:** continue.

### 1.3 — Codeweavers (one operation item at a time)

The relay works the `codeweaver` operation items in ledger order, ONE session at a time. `questAdvanceBroker` creates a
work item for the first `pending` operation item, marks it `in_progress`, and does not advance until that session
signals `complete`.

- **Assert:**
    - **One codeweaver work item dispatches per `get-next-step` response.** `select-batch-layer-broker` returns the
      single first ready work item; because advance creates only one work item at a time (depending on the last terminal
      item), there is at most one dispatchable work item. No concurrency, no `queued`.
    - The `in_progress` codeweaver has a non-empty `sessionId` + `agentId` within ~30s of dispatch (stamped MCP-side
      when the sub-agent calls `get-agent-prompt`). A long-lived `in_progress` item with no `sessionId` indicates a
      dispatch or MCP-correlation bug.
    - **Strict 1:1.** Each codeweaver work item links exactly one operation item via
      `relatedDataItems: ['operations/<id>']`, and each operation item is worked by exactly one work item. Read
      `quest.json` `workItems[]` directly (MCP `get-quest` strips them) to verify.
    - Each codeweaver signals `complete` with `operationStatus: 'done'`; the orchestrator marks that operation item
      `complete` and advance creates the work item for the NEXT `pending` codeweaver operation item. Repeat until every
      codeweaver operation item is `complete`.
    - **Sad path — `partial` → pt N (do NOT force this here; see Phase 2.1).** If a codeweaver signals
      `operationStatus: 'partial'`, the orchestrator marks its operation item `complete` and appends a
      `"pt N: {text}"` continuation item; advance creates a fresh work item that continues from git. A codeweaver item
      is unlocked, so its `pt N` chain is unbounded (codeweavers pivot in place freely).

**→ FAIL (a second work item minted for one operation item):** fix `questAdvanceBroker`'s strict-1:1 resume guard.
**→ FAIL (advance doesn't move to the next codeweaver on `done`):** fix `quest-handle-signal-back-responder` /
`questAdvanceBroker`. Restart 1.3.
**→ PASS:** continue.

### 1.4 — Ward (changed mode)

The next actionable operation item after the codeweavers is `ward(changed)` — a command item dispatched via `run-ward`,
alone.

- **Assert:**
    - `get-next-step` returns `{ type: 'run-ward', ..., mode: 'changed' }` (the MCP tool arg is `mode`, NOT `wardMode`).
    - Green (exit 0) → `quest-run-ward-broker` marks the ward operation item `complete` + the ward work item `complete`
      (adding `relatedDataItems += wardResults/<id>`), and advance moves to `flowrider`.
    - The `[WARD]` row shows `execution-row-ward-result` → "Ward exit code: 0 (changed)"; no detail breakdown for a
      green run. Output streams to the Web UI.

**→ FAIL (red):** if ward fails here, this is no longer a happy path — abort and re-seed a clean run (the ward red →
spiritmender path is Phase 2.3).
**→ PASS:** continue.

### 1.5 — Flowrider (one session over ALL flows)

- **Assert:**
    - Dispatched only after `ward(changed)` is green (its operation item is next `pending`).
    - ONE flowrider work item, self-scoping over EVERY quest flow — no per-flow chaining. It authors the
      flow-perspective test suite and owns `flows/` + `startup/` files inline.
    - For a **runtime** flow it controls its own dev server (Playwright `webServer` config from `.dungeonmaster.json`).
      Confirm the prod server on 4800/4801 stays LISTEN throughout; a dev server (4750/4751) comes up and goes down
      within the session. For an **operational** flow, no dev server is needed.
    - `done` (a pass that changed nothing) → advance to `siegemaster`. `partial` (a pass that changed code) → the
      orchestrator appends a `pt N` flowrider continuation and a FRESH flowrider session re-runs (the verify fixpoint,
      bounded by `slotManagerStatics.flowrider.maxAttempts`). Convergence IS the verdict.

**→ FAIL (dev server leaks / clobbers prod):** check the flowrider agent's Playwright `webServer` config + port
resolution. Restart 1.5.
**→ PASS:** continue.

### 1.6 — Siegemaster (one session over ALL flows)

- **Assert:**
    - Dispatched only after flowrider converges (`done`).
    - ONE siegemaster work item over all flows — manual QA + reviews the flow suite + TDD-fixes what it breaks, editing
      inline. Same dev-server ownership as flowrider for runtime flows.
    - `done` → advance to `lawbringer`; `partial` → `pt N` fresh siegemaster pass (bounded fixpoint).

**→ PASS:** continue.

### 1.7 — Lawbringer (whole-diff review)

- **Assert:**
    - Dispatched only after siegemaster converges.
    - ONE lawbringer work item reviewing the WHOLE quest diff; it fans out `lawbringer-minion` sub-agents per pair-group
      inside its own turn and fixes violations inline (minions are not work items — they are briefed inline and never
      signal back).
    - `done` → advance to `blightwarden`; `partial` → `pt N` fresh lawbringer pass (bounded fixpoint).

**→ PASS:** continue.

### 1.8 — Blightwarden (whole-diff audit)

- **Capture session JSONL.**
- **Assert sequence:**
    1. Parallel Agent-tool dispatches: 5 report-only minions (security, dedup, perf, integrity, dead-code) — summoned
       via the Agent tool, briefed inline, NOT work items.
    2. Each minion writes a `PlanningBlightReport` into `planningNotes.blightReports[]` via `modify-quest`.
    3. The blightwarden synthesizer judges + cleans up, then signals `complete` — `done` (clean diff) → advance to
       `ward(full)`; `partial` (it changed code) → `pt N` fresh blightwarden pass (bounded fixpoint).
- **Assert data:**
    - 5 `blightReports` entries, distinct `minion` values.
    - Allowlist holds: at `in_progress`, `modify-quest` rejects any write outside `planningNotes.blightReports`
      (execution agents cannot write `operations` at `in_progress`).

**→ FAIL minions not parallel:** fix the blightwarden prompt dispatch section. Restart 1.8.
**→ FAIL allowlist breach:** fix `quest-status-input-allowlist-statics`. Restart 1.8.
**→ PASS:** continue.

### 1.9 — Final Ward (full) + complete

- **Assert:**
    - `ward(full)` is the last operation item; dispatched only after blightwarden converges. `mode: 'full'`, green.
    - On green, no `pending` operation item remains, so the operation-aware `work-items-to-quest-status-transformer`
      derives quest `complete`. (It never derives `complete` while any operation item is `pending`/`in_progress`.)
    - WS `quest-modified` broadcast; the Web UI shows quest "Complete" (status bar reads `EXECUTION — M/M OPERATIONS`,
      terminal banner present).

**→ PASS:** Phase 1 complete.

---

## Phase 2 — Fault Tests (the non-failure "sad" paths)

Each uses a fresh quest. Keep each deliberately simple — one path per quest. None of these is a failure signal; they all
keep the quest `in_progress` and move it forward. The ONLY route to `blocked` is a spent bounded loop.

### 2.1 — Codeweaver `partial` → pt N continuation

- **Seed / drive:** a codeweaver session signals `signal-back({ ..., signal: 'complete', operationStatus: 'partial' })`.
- **Assert:**
    - The codeweaver work item is marked terminal (`complete`); its operation item is marked `complete`.
    - A `"pt N: {text}"` continuation operation item is appended immediately after it (same role, unlocked).
    - Advance creates a FRESH work item for the continuation — a new `execution-row-layer-widget` row appears live; the
      operations ledger grows by one row. The fresh session continues from git.
    - Because a codeweaver item is unlocked, the `pt N` chain is unbounded (no block on repeated `partial`).

**→ FAIL (no pt N appended / a second work item minted for the same op item):** fix `quest-handle-signal-back-responder`
duplicate-on-partial + the strict-1:1 guard.
**→ PASS:** continue.

### 2.2 — Verify-role `partial` → fixpoint convergence

- **Seed / drive:** a flowrider (or siegemaster / lawbringer / blightwarden) session signals `operationStatus:
  'partial'` (its pass changed code).
- **Assert:**
    - Its operation item is marked `complete` and a `pt N` continuation (same **locked** role) is appended; a fresh
      session of the same role re-runs against the new state.
    - The role converges when a pass changes nothing and signals `done` → advance moves on. Convergence IS the verdict.
    - The `pt N` chain is bounded by `slotManagerStatics.<role>.maxAttempts`; a spent chain blocks the quest via
      `quest-block-on-failure-broker` (see 2.4).

**→ FAIL (chain never converges / unbounded on a locked role):** check the fixpoint budget wiring.
**→ PASS:** continue.

### 2.3 — Ward red → spiritmender operation item → re-ward (no ward loop)

- **Seed:** introduce a genuine ward-catchable defect in a git-changed source file (a TS type error, an eslint
  violation, or a failing colocated `*.test.ts`), then let `run-ward` run for real (routing is keyed on the real exit
  code inside `quest-run-ward-broker` — it can't be staged by editing `quest.json`). Restore the file once asserted.
- **Assert:**
    - The ward work item is marked `failed` + `errorMessage: 'ward_failed'`; its ward operation item is marked
      `complete`; a `wardResults[]` ref (exitCode ≠ 0) is appended.
    - A `spiritmender` operation item PLUS a fresh ward continuation (`pt N`, same `wardMode`) are appended AFTER it.
    - Advance dispatches the **spiritmender next** (never two wards back-to-back); after it fixes forward, the fresh
      ward re-runs.
    - UI: the ward row shows `FAILED` + "Ward exit code: 1 (changed)" + a detail breakdown
      (`execution-row-ward-detail`, HTTP-fetched, renders only for a failing run). The new spiritmender + fresh ward rows
      appear live.

**→ FAIL (a ward re-dispatches immediately with no spiritmender / two wards back-to-back):** fix the ward-red append
order in `quest-run-ward-broker`. Restart 2.3.
**→ PASS:** continue.

### 2.4 — Ward retry budget exhausted → blocked

- **Seed:** an unfixable ward-catchable defect so the red-ward chain of one `wardMode` (since the last green of that
  mode) reaches `slotManagerStatics.ward.maxRetries`.
- **Assert:**
    - Instead of appending another fix loop, `quest-run-ward-broker` calls `quest-block-on-failure-broker`: the failed
      work item is `failed`, every still-`pending` work item is drained to `skipped`, quest `status: blocked`.
    - `get-next-step` returns `idle` for that quest (the scan filters on `in_progress`, so a `blocked` quest is skipped).
    - UI: the failed row shows `FAILED`; skipped rows are hidden; no terminal banner (`blocked` is not terminal). The
      RESUME button is visible (`blocked` is resumable). Assert `blocked` + the skipped rows in `quest.json`.

**→ FAIL (loops past budget / never blocks):** fix the ward-retry boundary count in `quest-run-ward-broker`.
**→ PASS:** continue.

### 2.5 — Server crash mid-session → resume (no restart, no duplicate)

- **Seed:** kill the server (or the agent process) while a work item is `in_progress`.
- **Assert:**
    - On the next get-next-step scan, `recover-orphaned-work-items-layer-broker` flips the orphaned `in_progress` work
      item back to `pending`, **keeps** its `sessionId`/`agentId`, sets a `resume` marker, and increments `retryCount`.
    - Node/UI dispatch resumes the retained Claude session (`claude --resume`, prompting it to finish + signal back) —
      partial work survives, no from-scratch re-run, no duplicate work item (strict 1:1). (Fallbacks fresh-spawn: an
      early-crash orphan with no captured `sessionId`, and the MCP `/dumpster-launch` Task path.)
    - A crash-looping session reaching `slotManagerStatics.orphanRecovery.maxResets` blocks the quest.

**→ FAIL (a duplicate work item is created / identity cleared):** fix `recover-orphaned-work-items-layer-broker` (it
must keep identity + a resume marker and set `pending`, not stay `in_progress`).
**→ PASS:** continue.

### 2.6 — Blightwarden minion failure is non-blocking

- **Seed:** plant a semantic finding a blightwarden report-only minion (e.g. perf: a genuine N+1) surfaces but does not
  auto-fix.
- **Assert:**
    - The minion writes its `PlanningBlightReport` (with file:line evidence) into `planningNotes.blightReports[]`. A
      minion is not a work item and never signals back — its finding lives in the report.
    - The blightwarden synthesizer judges the reports and cleans up in place; if it changed code it signals `partial`
      (a `pt N` fresh blightwarden pass, 2.2), else `done` (advance to `ward(full)`).

**→ FAIL (a minion failure blocks the quest):** minions must be report-only; fix the blightwarden dispatch.
**→ PASS:** continue.

### 2.7 — Execution agents cannot write the operations ledger

- **Drive:** from a running execution agent (or a stub) at `in_progress`, attempt `modify-quest({ operations: [...] })`.
- **Assert:**
    - Rejected by the input allowlist (`operations` is writable only at `flows_approved` / `explore_observables` / the
      `review_observables` back-edge). The ledger has exactly two writers — ChaosWhisperer (spec time) and the
      orchestrator (runtime, via `questOperationsUpdateBroker`, which bypasses the allowlist).

**→ FAIL (write accepted):** fix `quest-status-input-allowlist-statics` / `quest-modify-broker`.
**→ PASS:** continue.

### 2.8 — Bug-hunt relay

- **Seed:** a `bug-hunt` quest (via `/dumpster-hunt`) — captured as a reproduction flow + an expected-behavior
  observable.
- **Assert:**
    - At Start Quest the orchestrator seeds a single `pesteater` implementation operation item (not authored at spec
      time) plus the bug-hunt verify tail `ward(changed) → lawbringer → blightwarden → ward(full)` (no
      flowrider/siegemaster).
    - PestEater turns the expected-behavior observable into a failing test, then makes it pass; the relay advances the
      same way as a feature quest (done → advance, partial → pt N, ward red → spiritmender). Quest derives `complete`.

**→ FAIL (wrong seed shape / feature tail seeded):** fix `questTypeRegistryStatics['bug-hunt']`. Restart 2.8.
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
