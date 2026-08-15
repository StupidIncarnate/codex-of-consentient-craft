# Validation Playbook — Full Live Flow (operations relay)

End-to-end manual validation of the quest pipeline. Riftcarver, Flowrider, Groundstomper, Siegemaster, and Blightscout
are operation items in the live relay. The orchestrator (you) runs Phase 0 checks individually, then drives Phases 1–3
as a live quest and branches to fixer agents on red.

> **Want only to hand the user a test quest they can drive by hand?** Skip to
> **[Fake-Quest Bootstrap](#fake-quest-bootstrap-no-chat-session)**. It is self-contained: it does not need a
> ChaosWhisperer chat session, and it gets you from nothing to an `approved` quest sitting on the Begin Quest modal in
> about a minute.

> **Known drift in this file.** Phase 1.7 and parts of Phase 2 still say **Blightwarden** and describe it as one
> whole-diff audit at the end of the tail. The role is **`blightscout`**: scoped to ONE COMMIT, summoning no minions,
> and APPENDED by the signal-back handler after every committing session rather than seeded in the tail. Read
> `docs/quest-role-paths.md` for the current shape and treat those sections as approximate.

---

## Current execution model (read first)

Execution is a **reactive relay over the quest's `operations` ledger** — an ordered `OperationItem[]` worked one
*session* at a time. It is **not** auto-dispatched by the server. Three surfaces drive a quest:

- **Spec** runs in the Web UI (or via `/dumpster-create`): ChaosWhisperer through the two approval gates. It authors
  flows, observables, contracts and `packagesAffected` — and **never** the `operations` ledger, which is off the
  modify-quest allowlist at every status for every caller. The approval gate requires **non-empty `flows` and nothing
  else**; the implementation ledger is DERIVED at Start from the flow nodes' `packages` tags and the contracts'
  `source` paths.
- **Start Quest** (Web UI button → `orchestration-start-responder`) is **pure `quest.json` bookkeeping and answers in
  milliseconds**. It derives the package graph, seeds the relay (`questBuildRelayGraphBroker` mints the implementation
  items + the fixed verify tail and creates the FIRST work item), and flips the quest to `in_progress`. It **spawns
  nothing, runs no git, and builds nothing** — assert that, it is a regression guard.
- **The first item of every relay is `riftcarver`** — a `spawnerType: 'command'` role that creates the quest branch and
  git worktree, mirrors `node_modules` into it, and runs the preflight build. It is what makes a workspace exist, and
  it runs only once the quest is actually next in line. Watching it is the point of the Riftcarver checkpoint below.
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
  waits for its `signal-back` (or the command's exit) before advancing. A ready COMMAND item — `riftcarver` or `ward` —
  is dispatched alone, as `run-riftcarver` / `run-ward`.
- **Agents have no failure signal — only forward.** An agent that can't finish its scope signals `operationStatus:
  'partial'`; the orchestrator marks its operation item `complete` and appends a `"pt N: {text}"` continuation a fresh
  session runs. `ward` uses that chain as the **verify fixpoint** — a red run completes its item and spawns `pt N+1`;
  a green run ends the chain. The verify-tail **operators** (`flowrider`, `groundstomper`, `siegemaster`, `blightscout`)
  signal on remaining SCOPE instead: `done` once every unit in scope carries a sign-off (or, for blightscout, a
  disposition), `partial` only for a named remainder.
- **Three failure concepts, all of them the orchestrator's rather than an agent's judgement call:** a **ward exit-code
  red** (inserts a spiritmender + a fresh ward), a **riftcarver failure** (routed by class — see below), and an agent's
  **`operationStatus: 'blocked'`** environment wall. A server crash mid-session **resumes** the orphaned session
  (`claude --resume`) — it does not restart it.
- **Riftcarver failures route by class, and only one of the classes is recoverable.** A build or `node_modules` failure
  is `repairable`: a spiritmender is spliced in ahead of a fresh `pt N` carve, bounded by
  `slotManagerStatics.riftcarver.maxRetries`. A `git-state` failure (base branch missing, branch name taken,
  `git worktree add` refused) **blocks the quest**, deliberately — with no worktree, the only checkout is the repo root,
  which is a different branch's source, and no agent may be dispatched into it. A permission-denied error at any step
  blocks too, overriding the class.
- **Riftcarver is re-entrant by design.** Because the recovery route is `riftcarver → spiritmender → riftcarver (pt N)`,
  the carve is re-entered against a partly-built workspace as a matter of routine. Every step re-checks the real world
  (disk and git, never `quest.json` alone) and skips itself when already satisfied — **except the build, which always
  re-runs**, because re-running it is how the spiritmender's fix gets verified. When you watch a `pt N` carve, expect the
  git and `node_modules` steps to report skips and the build to run.

---

## Fake-Quest Bootstrap (no chat session)

**Use this when the user says "make me a test quest so I can check X by hand".** It mints an `approved` quest with no
ChaosWhisperer conversation, so the user can click Begin Quest and drive the run themselves. Every call below is
verified against a live server, in this order, with no other setup.

### The two preconditions that actually bite

1. **The prod server runs from `dist/`, and so does the MCP server.** Neither sees a source change until you rebuild
   AND restart them. If you skip this you will watch a quest seed a relay with no `riftcarver` item in it and conclude
   the feature is broken. Symptom to recognise: a quest written by a stale server is missing newly-added `quest.json`
   fields entirely (e.g. no `riftcarverResults` key at all).
2. **The dogfood homes are repo-local and NOT the same directory.** Prod is `<repo>/.dungeonmaster/`, dev is
   `<repo>/.dungeonmaster-dev/`. There is no `.dungeonmaster-home/`, no `DUNGEONMASTER_ENV`, and no `.env` file — the
   root `npm run prod` / `npm run dev` scripts set `DUNGEONMASTER_HOME` inline. Ports come from `.dungeonmaster.json`:
   prod server **4800**, prod web **4801**; dev server **4750**, dev web **4751**. Host is `dungeonmaster.localhost`.

### Step 1 — build, then start the prod server

```bash
npm run build          # own command, unpiped, must exit 0
npm run prod           # kills stale prod, serves dist/ on 4800 + vite preview on 4801
```

`npm run prod:build-and-serve` does both. **Restart your own MCP connection too** if contracts or tool names changed —
the MCP server is a separate process, also running from `dist/`.

### Step 2 — find the guild, clear the decks

```bash
ls .dungeonmaster/guilds/          # the guild UUID
```

Abandon any non-terminal quests from earlier runs (`mcp__dungeonmaster__list-quests` → `modify-quest` with
`status: 'abandoned'`). Leftover in-flight quests get recovered on server start and their agents resume writing into
your working tree.

### Step 3 — mint the quest (7 MCP calls, no chat session)

`operations` is not writable by anyone, so there is nothing to author — the ledger is DERIVED at Start. The `approved`
gate wants **non-empty `flows` and nothing else**, so the minimum viable spec is one flow with two nodes.

The per-status allowlist decides which fields a call may carry, so the flow must land while the quest is at
`explore_flows` (`flowsRule: 'no-observables'` there — do not send observables). Node `packages` tags must draw from
`packagesAffected`, which is why both ride the same call.

```
1. create-quest({ userRequest: '<why this quest exists>' })        → { questId, guildSlug }
2. modify-quest({ questId, status: 'explore_flows', title: '...' })
3. modify-quest({ questId, status: 'review_flows',
     packagesAffected: [{ name: 'shared', location: './packages/shared',
                          changeType: 'edit', packageType: 'library' }],
     flows: [{ id: 'carve-check', name: 'Carve check', flowType: 'runtime',
               entryPoint: 'begin-clicked', exitPoints: ['execution-live'],
               nodes: [
                 { id: 'begin-clicked',  label: 'User clicks Begin Quest',
                   type: 'state',    packages: ['shared'] },
                 { id: 'execution-live', label: 'Execution panel is live and the carve is queued',
                   type: 'terminal', packages: ['shared'] }],
               edges: [{ id: 'begin-to-live', from: 'begin-clicked', to: 'execution-live' }] }] })
4. modify-quest({ questId, status: 'flows_approved' })
5. modify-quest({ questId, status: 'explore_observables' })
6. modify-quest({ questId, status: 'review_observables' })
7. modify-quest({ questId, status: 'approved' })
```

Every id matches `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`; `entryPoint` / `exitPoints` name real node ids. Statuses step one at a
time — `questStatusTransitionsStatics` refuses a skip. If a write is refused, the error names the invariant it broke;
fix that rather than widening the payload.

**Result:** status `approved`, one `chaoswhisperer` intake operation item, no git fields, an empty ledger. The quest is
sitting exactly where a real spec conversation would have left it.

### Step 4 — hand it to the user

```
http://dungeonmaster.localhost:4801/<guildSlug>/quest/<questId>
```

The Begin Quest modal arms itself on an `approved` quest. **Do not click it for them** unless asked — the point is that
they drive it.

### Step 5 — what "working" looks like

| # | Watch for | Why it matters |
|---|---|---|
| 1 | The execution panel replaces the spec panel **immediately** | Start is pure bookkeeping; a pause here is the original bug returning |
| 2 | Row 1 is **riftcarver**, `spawnerType: 'command'` | The carve heads the relay for both quest types |
| 3 | `worktrees/` does **not** exist yet at the moment the panel appears | Proves the swap happened before any carving |
| 4 | Nothing runs until the **`/queue` play button** is pressed | `orchestrationMode` is `node`; Start dispatches nothing |
| 5 | The riftcarver row streams base-branch → `git worktree add` → per-root `node_modules` mirroring → `— build pass N/3 —` | Command output has no session JSONL; this stream is its only route to a UI |
| 6 | On green: `worktrees/<slug>-<id8>/` exists, `quest.json` carries `branchName` / `baseBranch` / `worktreePath` / `baseRef`, and the first **codeweaver** row appears | The carve advanced the relay |
| 7 | Reload the page, expand the finished riftcarver row | The persisted `riftcarver-results/<id>.log` renders — proves history, not just the live stream |

### Step 6 — stop before the codeweavers

Once the carve is green the relay dispatches real agents that write real code. **Press pause on `/queue`** as soon as
the codeweaver row appears, unless the user wants a full run.

### Cleanup

```bash
git worktree remove worktrees/<slug>-<id8> --force
git branch -D quest/<slug>-<id8>
git worktree prune
```

Then abandon the quest via `modify-quest({ questId, status: 'abandoned' })`. Leaving the branch behind is not fatal —
a re-carve probes git and attaches to an existing branch instead of re-creating it — but it clutters the repo.

### Exercising the failure routes by hand

- **`repairable`** — point `.dungeonmaster.json` → `devServer.buildCommand` at a failing command before pressing play.
  Expect: riftcarver red → a **spiritmender** row → a **`pt 2`** riftcarver row. Read the `pt 2` stream: the git and
  `node_modules` steps report **skips** and only the build re-runs. That is the idempotency contract, visible.
- **`git-state`** — pre-create the branch the quest will want (`git branch quest/<slug>-<id8>`) **and** leave no
  worktree. This one does NOT block: the carve probes git, attaches to the existing branch, and proceeds. To force the
  block, break base-branch detection instead (a repo with neither `main` nor `master`).
- **Permission** — `chmod -w` the `worktrees/` directory. Expect an immediate block, whatever the step.

In both block cases the quest goes `blocked` with the git error as the failed row's `errorMessage`, and **no agent is
dispatched**. Resume with the RESUME button after fixing the environment.

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
   relay: per-role happy/sad transitions, block ownership, the **Fixpoint** and **Operator convergence** bullets in Core
   concepts, and how quest status is derived. Read these if you need context on why Flowrider runs as ONE session over
   ALL quest flows, Siegemaster runs ONE session PER flow, Blightwarden runs as ONE session over the whole diff, and
   why the operators signal on scope rather than on whether the pass changed code.

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

- **NEVER manually refresh the browser. EVER.** This includes F5, Ctrl+R, Cmd+R, right-click-reload, clicking the
  browser reload button, `page.reload()`, `mcp__claude-in-chrome__navigate` to the current URL, `key: "F5"`,
  `key: "ctrl+r"`, or ANY other mechanism that reloads the page. Manually refreshing **kills any agent currently running
  in the quest session** (codeweaver, flowrider, blightwarden, etc.) and corrupts the orchestration state. The UI
  manages its own state end-to-end: panels swap, statuses update, clarifications appear, execution progress renders —
  all via WebSocket. If something doesn't show up live, **that is a bug to file** — not something to work around with a
  refresh. If you see yourself about to refresh for any reason (including the phrase "refresh test"), stop, screenshot
  the current state, and describe what's missing. Refreshing is a destructive action on live runs. This rule supersedes
  any step in this playbook that appears to request a refresh; if you find such wording, treat it as a doc bug and edit
  it out before proceeding.
- **Autonomy: fix, then restart — do NOT ask for approval between runs.** After a blocking bug is fixed and committed, immediately follow Run Lifecycle step 1 for the next run. Do not pause to ask the user "should I start Run N?" or "do you want me to proceed?". The user will intervene if they want you to stop. Same rule applies mid-run: keep driving through checkpoints, branching to fixers on red, without checking in at every checkpoint. Only stop-and-ask when you genuinely cannot decide (ambiguous bug classification, missing context for a fix).
- **Orchestrator (you) does NOT edit source code or run ward directly.** Fix work and ward invocation MUST be delegated to sub-agents via the `Agent` tool. The orchestrator's job is to drive the flow, observe outcomes, classify bugs, dispatch agents, and commit results. Exceptions: the orchestrator may freely edit `VALIDATION-PLAYBOOK.md`, `/tmp/validation-notes.md`, and update task lists — those are process artifacts, not codebase changes. Everything else — contract edits, prompt edits, guard fixes, broker fixes, widget fixes, test updates, rebuilds — goes to an agent. This protects the orchestrator's context window for the full end-to-end validation run.
- **Kickoff surfaces.** Spec + Start Quest go through the Web UI (and MCP tools / server HTTP endpoints) as a real user
  would. Do not use `/dumpster-create` for the spec — drive that through the UI, or mint the quest directly per
  *Fake-Quest Bootstrap* when no chat session is available.
- **Which dispatcher drives execution is CONFIG, not preference.** `.dungeonmaster.json` → `orchestrationMode` decides:
  it is `node` in this repo, so the `/queue` **play button** is the driver and `/dumpster-launch` will report an idle
  reason and stop while Node holds the queue. The two are mutually exclusive, arbitrated through
  `<dungeonmasterHome>/dispatch-state.json`. Read the config before assuming which one to reach for; both drive the
  same `get-next-step` brain, so a checkpoint's expectations do not change with the mode — only how you start it.
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
- **Two servers: smoke test (prod, manual) and agent-spawned (dev).** Siegemaster is the only role handed a dev server:
  it resolves `devCommand` + dev `port` from `.dungeonmaster.json`, stands one up by hand for its walks, and tears it
  down before signalling. Flowrider gets no dev-server config at all — the server its e2e run needs comes from the
  project's Playwright `webServer` block and lives only for that run. No other role (codeweaver, blightwarden, ward)
  touches the dev-server lifecycle. The validation orchestrator (you) runs
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
- **Ports and homes.** Everything comes from `.dungeonmaster.json` plus the root npm scripts — there are no `.env`
  files and no `DUNGEONMASTER_ENV`. prod = **4800** (server) / **4801** (web preview), home `<repo>/.dungeonmaster/`.
  dev = **4750** / **4751**, home `<repo>/.dungeonmaster-dev/` — a separate directory, not a subdirectory of the same
  one. `npm run prod` and `npm run dev` each set `DUNGEONMASTER_HOME` inline, which is why the two queues never mix and
  why a siege-spawned dev server cannot touch the smoke-test quest. Host is `dungeonmaster.localhost`.
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
5. **Start smoke-test server.** `npm run prod` (ports 4800/4801). Single process only. Leave it up for the whole run. Do
   NOT run `npm run dev` — that port range is reserved for the dev server Siegemaster stands up during verification (and
   for the one Playwright's `webServer` starts inside a Groundstomper e2e run).
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
cp -r .dungeonmaster/guilds/<guildId>/quests/<questId> tmp/smoke-test-quest/
```

After snapshot, `tmp/smoke-test-quest/<questId>/quest.json` exists.

- **Always overwrite.** The newest clean spec wins — no snapshot history.
- **Keep the UUID-named folder.** Restore is `cp -r tmp/smoke-test-quest/<questId> .dungeonmaster/guilds/<guildId>/quests/` with
  no path surgery.
- **Snapshot goes in `<repoRoot>/tmp/smoke-test-quest/`**, not `~/tmp` (permission issues) and not `/tmp` (outside repo
  permission scope; survives wipes). The `tmp/` dir is already git-ignored.

**How to restore (on a blocked-run restart that wants to skip spec):**

1. With the dev server stopped, copy the snapshotted folder back:
   ```
   cp -r tmp/smoke-test-quest/<questId> .dungeonmaster/guilds/<guildId>/quests/
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

**Checkpoint 1.1 is skippable.** When there is no chat session available — or when the run is about execution rather
than the spec phase — mint the quest per *Fake-Quest Bootstrap* and enter at **1.2**. Everything from 1.2 onward is
identical; the relay does not care whether a human or a `modify-quest` call authored the flows.

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
       `OPERATIONS_LEDGER_ROW` — role badge + text + status; ward rows show a `(changed)`/`(full)` mode tag, and any row
       whose item carries `flowIds` shows the flow NAMES in `OPERATIONS_LEDGER_ROW_FLOWS` — each siegemaster row and
       each groundstomper row lists its own single flow, and the ward and blightwarden rows list none). The
       status bar (`execution-status-bar-layer-widget`) reads `EXECUTION — 0/M OPERATIONS` once the relay is seeded (or
       `AWAITING PLAN` before Start Quest seeds it).
  3. Status → `in_progress`. `questBuildRelayGraphBroker` derived the implementation items and appended the verify
     tail (`ward(changed) → flowrider → groundstomper → siegemaster → ward(full)`, all `locked`, `pending`), then
     created ONE work item for the FIRST operation item.
     **Assert the head first: operation item [0] is `riftcarver`, `locked: true`, `packageNames: []`, `in_progress`,
     and its work item carries `spawnerType: 'command'`.** A command role declares no package slice — it prepares the
     whole worktree — so a riftcarver item that inherited the spine's packages is a regression.
     Then assert the tail's shape: two fixed ward items (`ward(changed)`, `ward(full)`), ONE `siegemaster` item PER
     FLOW, ONE `groundstomper` item per RUNTIME flow that reaches an e2e-eligible package (none at all when the quest
     reaches no such package), plus the `flowrider` items its package slicing mints. **There is no seeded blight-review
     item** — `blightscout` is APPENDED after each committing session, so an empty tail here is correct. Read
     `quest.json` and confirm each `siegemaster` item carries a single-element `flowIds` naming its own flow with a
     `— flow: <id>` text suffix, and that each `groundstomper` item likewise names exactly one flow. This is the
     invariant most likely to regress: a whole-quest siegemaster item or a truncated `flowIds` both show up here first.
    4. **Nothing was carved and nothing was spawned.** `quest.json` has no `branchName` / `baseBranch` /
       `worktreePath` / `baseRef`, and `<repo>/worktrees/` holds no directory for this quest. Start is pure
       bookkeeping; anything else here is the "Begin Quest hangs for minutes" defect returning.
    5. Once a dispatcher is running, the **riftcarver** work item flips to `in_progress` (a flat
       `execution-row-layer-widget` row, `RUNNING` badge). It is a command, so it gets **no `sessionId`** — its output
       reaches the panel through the chat-output bus keyed on the work item id, not through a session JSONL tail.

**→ FAIL assertion #1 (UI never switches after Start Quest click):** UI bug in the execution-panel guard or in the
binding that reacts to `quest-modified`. Most likely candidate: `shouldRenderExecutionPanelQuestStatusGuard` is missing
`in_progress`. File it, fix, restart. DO NOT refresh to "confirm" — refreshing kills the running agent.
**→ FAIL assertion #4 (nothing dispatches):** confirm a dispatcher is actually running and `get-next-step` is being
polled. If `get-next-step` returns `idle` despite a pending operation item with no live work item, debug the scan
self-heal / advance; if no dispatcher is running, nothing will dispatch — that is expected, not a bug.
**→ FAIL no "Start Quest" popup appears:** UI bug in the post-Gate-#2 flow. File it, fix, restart.
**→ PASS:** continue.

### 1.2b — Riftcarver (the carve; first item of every relay)

The first thing any dispatcher runs. It is `spawnerType: 'command'` — the dispatcher executes it itself, there is no
Claude session, and `onLine` is the ONLY route its output has to a UI for the minutes it runs.

- **Action:** none. It runs as soon as a dispatcher starts. Watch the row.
- **Assert:**
    1. **The row streams while it runs** — base-branch probe, `git worktree add`, one line per `node_modules` root
       mirrored, then `— build pass N/3 —`. A row that sits `RUNNING` with an empty body for minutes is the
       required-`onLine` contract regressing; that exact defect shipped once for ward and is why the parameter is not
       optional.
    2. **On green:** `worktrees/<slug>-<id8>/` exists on disk; `quest.json` gains `branchName`, `baseBranch`,
       `worktreePath` and `baseRef`; `quest.riftcarverResults` gains one entry; the work item carries a
       `riftcarverResults/<id>` ref; the operation item is `complete`; and the **first codeweaver** work item appears.
    3. **`baseRef` is the fork point**, i.e. the base branch tip the worktree was cut from — not the server process's
       HEAD. It is written exactly once and never moves again, including across a `pt N` re-carve.
    4. **History survives a reload.** Reload the page, expand the finished riftcarver row: the persisted
       `riftcarver-results/<id>.log` renders. The live stream is in memory only — this is the durable half.
- **On red, check the class before calling it a bug.** `node_modules`/build failures are `repairable` and MUST produce
  a spiritmender + a `pt N` carve. Base-branch/`git worktree add`/permission failures MUST block the quest with the git
  error on the failed row and dispatch NO agent. A repairable failure that blocks, or a git-state failure that spawns an
  agent into the repo root, is the bug.

**→ FAIL (row streams nothing):** the `onLine` wiring at the dispatch site. Check both emit paths — the Node loop's
`onRiftcarverLine` and the MCP responder — they share `commandChatOutputEmitTransformer`.
**→ FAIL (quest blocks on a `pt N` carve because the branch already exists):** the re-entrancy probe. A carve whose
directory is gone but whose branch survives must ATTACH to that branch (no `-b`, prune first), not re-create it.
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

### 1.5 — Flowrider (ONE operator session covering EVERY quest flow)

- **Assert:**
    - Dispatched only after `ward(changed)` is green (its operation item is next `pending`).
  - EXACTLY ONE flowrider work item for the whole quest. Its operation item carries EVERY quest flow id in `flowIds`
    (declaration order) and names no flow id in its text; the ledger row lists every flow NAME. A second flowrider row
    appearing for a 2-flow quest is a regression — file it.
  - The session reads all its flows, groups them into bundles by shared surface/harness/layer, dispatches a
    `flowrider-authoring-minion` per bundle via the `Agent` tool (visible as sub-agent chains inside the flowrider's own row —
    minions are NOT work items), then verifies the returned work by opening the files itself — the verification IS the
    job. It is a test writer and reviewer FIRST — coverage is what its operation item buys — but it and its minions also
    close the implementation holes their testing exposes, red-first. Only an architectural fix, or one needing a product
    decision, is left as a red test plus an `unconfirmable` `flowriderSignoff` carrying the question Siegemaster picks
    up. It prefers extending the suites Codeweaver left over starting fresh, and it does not rebuild what Codeweaver
    already built.
    - For a **runtime** flow it controls its own dev server (Playwright `webServer` config from `.dungeonmaster.json`).
      Confirm the prod server on 4800/4801 stays LISTEN throughout; a dev server (4750/4751) comes up and goes down
      within the session. For an **operational** flow, no dev server is needed.
  - **Its signal reflects remaining SCOPE, not whether it touched code.** `done` → every observable on every flow
    carries a disposition; advance moves to the FIRST `siegemaster` item (one of possibly several, one per flow).
    Authoring tests is the job, so a pass that
    wrote code still signals `done`. `partial` → a NAMED remainder is left (a bundle it could not dispatch, an
    observable with no disposition, a suite left red); the orchestrator appends a `pt N` flowrider continuation carrying
    the same complete `flowIds`, and a fresh flowrider session picks up from that remainder. The chain is bounded by
    `slotManagerStatics.flowrider.maxAttempts` (3) — ONE budget for the whole quest, not one per flow — and a spent
    chain blocks.

**→ FAIL (a flowrider item per flow / a truncated `flowIds`):** fix the tail seed in `questBuildRelayGraphBroker` (and
the continuation's `flowIds` copy in `quest-handle-signal-back-responder`). Restart 1.5. **→ FAIL (dev server leaks /
clobbers prod):** check Siegemaster's Gate 5 start + Gate 10 scoped teardown, and the Playwright `webServer` config +
port resolution behind a Flowrider e2e run. Restart 1.5.
**→ PASS:** continue.

### 1.6 — Siegemaster (ONE operator session PER FLOW)

- **Assert:**
    - Dispatched only after the flowrider item signals `done`; the FIRST siegemaster item (one flow) is next in
      ledger order.
    - ONE siegemaster work item PER quest flow, each operation item carrying a single-element `flowIds` and text
      suffixed `— flow: <id>`. Each session walks its ONE flow, grouping it into walk-bundles, stands up ONE dev
      server, dispatches a `siegemaster-walker-minion` per bundle (every DRIVING bundle strictly one at a time; only
      mutate-nothing inspection runs in parallel), then verifies what came back. A minion records a defect's broken
      state before it may close a small local hole, and a `READ-ONLY`-lane one edits nothing. Siegemaster is the LAST
      role that fixes BEHAVIOUR and has the widest fix authority on the quest — it reviews the suites and TDD-fixes
      what it breaks, editing inline, including the architectural gaps flowrider left red for it.
    - `done` (every observable on that flow dispositioned — a landed fix is not a reason to respawn) → advance to the
      NEXT siegemaster item (the following flow), or to `blightwarden` once the LAST flow's siegemaster item is
      `done`. `partial` (a named remainder) → a `pt N` siegemaster continuation carrying that SAME single `flowId`,
      bounded by `slotManagerStatics.siegemaster.maxAttempts` (3) — a separate budget PER FLOW, not one for the whole
      quest.

**→ PASS:** continue.

### 1.7 — Blightwarden (whole-diff audit)

- **Capture session JSONL.**
- **Assert sequence:**
    1. Dispatched only after every siegemaster item signals `done`. First action:
       `get-blight-checklist({ questId })` — the deterministic file × concern review surface of the WHOLE quest diff,
       measured from the quest's pinned `baseRef` (never a hand-rolled `git diff`).
    2. Parallel Agent-tool dispatches: one `blightwarden-group-minion` per disjoint group of changed impl+test file pairs —
       summoned via the Agent tool, briefed inline, NOT work items. Each reviews all seven concerns (coverage, craft,
       security, dedup, perf, integrity, dead-code) against its group, FIXES violations in place, and writes a
       disposition per unit into `planningNotes.blightLedger` via `modify-quest` as it goes.
    3. Once every group has returned, ONE `blightwarden-crosscut-minion` — alone, last — runs over the WHOLE diff for
       cross-pair duplication and blast radius no single group could see. It does NOT write `blightLedger`; it
       reports its findings back to the parent as an artifact.
    4. The blightwarden session reads every returned artifact, opens the files each minion actually changed, records
       any remaining dispositions, runs ONE ward over every touched file, and commits the session's single commit
       (minions never run `git`). It then re-calls `get-blight-checklist` and signals `complete` — `done` (remaining
       count is zero) → advance to `ward(full)`; `partial` (a named remainder) → `pt N` fresh blightwarden pass,
       bounded by `slotManagerStatics.blightwarden.maxAttempts` (3).
- **Assert data:**
    - `planningNotes.blightLedger` gained one entry per unit the minions (and the parent) covered, each keyed on
      `itemId` (`<implPath>:<concern>`) with a `disposition` of `reviewed | fixed | routed | recorded | gap`.
    - **Completion gate:** a `signal-back` carrying `operationStatus: 'done'` recomputes the checklist and THROWS,
      naming the outstanding units, if any unit still carries no disposition — confirm a stub that signals `done` too
      early is refused and nothing is persisted (a real regression test for the same gate that already guards
      siegemaster).
    - Allowlist holds: at `in_progress`, `modify-quest` accepts any `planningNotes` sub-field, including
      `blightLedger` (execution agents still cannot write `operations` at `in_progress`).

**→ FAIL minion groups not disjoint / crosscut minion not run alone-and-last:** fix the blightwarden prompt dispatch
section. Restart 1.7.
**→ FAIL the completion gate does not throw on an incomplete checklist:** fix `quest-handle-signal-back-responder`'s
blightwarden branch. Restart 1.7.
**→ FAIL allowlist breach:** fix `quest-status-input-allowlist-statics`. Restart 1.7.
**→ PASS:** continue.

### 1.8 — Final Ward (full) + complete

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

### 2.2 — Locked verify-tail role `partial` → bounded pt-N chain

The orchestrator's handling is identical for every locked role: complete the item, append `pt N`, bound the chain by
`slotManagerStatics.<role>.maxAttempts`. `flowrider`, `siegemaster`, and `blightwarden` are all **operators** — none
of them is a fixpoint, and none earns `done` merely by having changed code.

- **Seed / drive:** a flowrider / siegemaster / blightwarden session signals `operationStatus: 'partial'` because a
  NAMED remainder is left — a bundle it could not dispatch, an observable (or blight-checklist unit) with no
  disposition, a suite left red. **A pass that merely wrote a test, walked a path, or landed a fix must signal
  `done`**: an operator re-reads what its minions wrote, so it already is the fresh pair of eyes a `pt N` session
  supplies. A `partial` on a completed scope is a prompt bug — file it.
- **Assert:**
    - Its operation item is marked `complete` and a `pt N` continuation is appended: `flowrider`'s carries the
      **complete** `flowIds` (every quest flow id, never a subset); `siegemaster`'s carries only that ONE item's
      single `flowId`; `blightwarden`'s carries no `flowIds` at all (whole-diff roles carry none). A fresh session of
      the same role starts from the remainder the commit (or ledger disposition) named.
    - `done` advances to the next tail item on the first pass that has every unit in scope dispositioned — there is
      no "changed nothing" pass to wait for: `flowrider` → the first `siegemaster` item; a `siegemaster` item → the
      next `siegemaster` item, or `blightwarden` once the last flow's item is done; `blightwarden` → `ward(full)`.

**Budget:** the `pt N` chain is bounded by `slotManagerStatics.<role>.maxAttempts` (3). `flowrider` and `blightwarden`
each get ONE budget for the whole quest — each holds exactly one tail item, so three `partial`s from either role
blocks the quest via `quest-block-on-failure-broker` (see 2.4) whatever the flow count. `siegemaster` gets one budget
PER FLOW — three `partial`s on ONE flow's item blocks the quest without touching another flow's separate item and
budget.

**→ FAIL (chain never converges / unbounded on a locked role):** check the pt-chain budget wiring. **→ FAIL (a `pt N`
flowrider/siegemaster continuation loses flow ids):** fix the `flowIds` copy in
`quest-handle-signal-back-responder`.
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

### 2.6 — Blightwarden's completion gate refuses a premature `done`

- **Seed:** a blightwarden operation item whose diff has multiple review units (`get-blight-checklist` reports several
  `<implPath>:<concern>` ids); the stub dispositions only SOME of them via `modify-quest({ planningNotes: {
  blightLedger: [...] } })`, then signals `operationStatus: 'done'`.
- **Assert:**
    - `signal-back` recomputes the checklist against the ledger and THROWS, naming the still-undispositioned units —
      NOTHING is persisted (the work item and operation item are untouched, so the session can act and signal again).
    - Dispositioning the rest (or signalling `partial` instead) then succeeds: `done` advances to `ward(full)`;
      `partial` appends a `pt N` blightwarden continuation (2.2).
    - A `blightwarden-group-minion`'s or `blightwarden-crosscut-minion`'s own finding never blocks the quest by itself — a
      minion is not a work item and never signals back; only the parent blightwarden session's `signal-back` call is
      gated.

**→ FAIL (`done` is accepted with undispositioned units left):** fix the blightwarden branch in
`quest-handle-signal-back-responder`.
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
    - At Start Quest the orchestrator seeds `riftcarver` then a single `pesteater` implementation operation item
      (neither authored at spec time) plus the bug-hunt verify tail `ward(changed) → ward(full)` (no
      flowrider/groundstomper/siegemaster, and no seeded blight-review item).
    - PestEater turns the expected-behavior observable into a failing test, then makes it pass; the relay advances the
      same way as a feature quest (done → advance, partial → pt N, ward red → spiritmender). Quest derives `complete`.

**→ FAIL (wrong seed shape / feature tail seeded):** fix `questTypeRegistryStatics['bug-hunt']`. Restart 2.8.
**→ PASS:** continue.

---

### 2.9 — Riftcarver failure classes (the new block route)

Riftcarver adds the fifth entry to block ownership, and it is the only failure whose routing depends on WHICH step
failed. Run each arm on its own quest.

- **Arm A — `repairable`.** Point `.dungeonmaster.json` → `devServer.buildCommand` at a command that exits non-zero,
  then start a dispatcher.
    - **Assert:** the carve row goes red with `errorMessage: 'riftcarver_build_failed'`; the ledger gains a
      `spiritmender` item whose text names the failing step and the riftcarver result id, followed by a `pt 2`
      riftcarver; the quest stays `in_progress`; the spiritmender is dispatched next, **inside the quest's worktree**
      (the git context was persisted before the build ran, which is what gives it a tree to work in).
    - **Then read the `pt 2` carve's stream** — the git and `node_modules` steps report skips, the build re-runs. That
      is the idempotency contract observable at runtime. A `pt 2` that re-runs `git worktree add` and dies on a
      name collision is the regression this arm exists to catch.
    - Restore `buildCommand` and let the chain converge green, or exhaust `slotManagerStatics.riftcarver.maxRetries`
      to see the spent-budget block.
- **Arm B — `git-state`.** Break base-branch detection (a repo state with neither `main` nor `master` resolvable).
    - **Assert:** the quest goes `blocked` immediately — no spiritmender, no `pt N` — with the git error verbatim on
      the failed row, and **no agent dispatched**. This asymmetry is deliberate: with no worktree the only checkout is
      the repo root, which is a different branch's source. An agent spawned there is the bug.
    - Note that a merely pre-existing BRANCH is **not** this case: the carve probes git and attaches to it.
- **Arm C — permission.** `chmod -w` the `worktrees/` directory.
    - **Assert:** immediate block regardless of which step hit it — the permission guard overrides the step's class.
- **Arm D — resume.** From the blocked quest in B or C, fix the environment and press RESUME.
    - **Assert:** the rearm returns the carve's work item to `pending` and the quest re-dispatches it. A RESUME that
      visibly does nothing is the rearm regressing.

**→ FAIL (repairable arm blocks, or git-state arm spawns an agent):** the routing in `quest-run-riftcarver-broker`
keyed off `worktreePrepareStepStatics.classifications`. **→ PASS:** continue.

---

## Phase 3 — Final Ward

`npm run ward` (timeout 600000). Zero failures. Gates declaring the combined feature-set green.

**→ FAIL:** route back to whichever phase introduced the regression.
**→ PASS:** both features validated end-to-end.

---

## Execution Order

1. Run Phase 0 in its entirety (static checks).
2. Run Phase 1 as a single unbroken live quest. Branch to fixers on red, restart from failing checkpoint. Enter at 1.2
   with a *Fake-Quest Bootstrap* quest when no chat session is available.
3. Run Phase 2 scenarios one by one, each on its own quest. Branch to fixers on red.
4. Run Phase 3.

**If the user only asked for a test quest to drive by hand, none of the above applies** — run *Fake-Quest Bootstrap*,
hand over the URL, and stay available to read `quest.json` for them. That is the whole job.

Only after Phase 3 passes do I declare the two features green.
