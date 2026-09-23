# Validation Playbook — Full Live Flow (family graph + step graph)

End-to-end manual validation of the quest pipeline. `Riftcarver`, `Codeweaver`, `Flowrider`, `Siegemaster` and
`wardFull` are the FAMILIES the relay walks — each an operation item (a SCOPE) running its own STEP GRAPH inside;
`ward` is not a family of its own, it is the last step of every code-changing family's own graph. Standards review is
NOT a family and writes NOTHING to `quest.json` — it happens inside `codeweaver`'s and `flowrider`'s own `review`
step, as guidance that step's session takes on its own initiative rather than a checked or recorded gate. The
orchestrator (you) drives Phases 1–3 as a live quest and branches to fixer agents on red.

> **Want only to hand the user a test quest they can drive by hand?** Skip to
> **[Fake-Quest Bootstrap](#fake-quest-bootstrap-no-chat-session)**. It is self-contained: it does not need a
> ChaosWhisperer chat session, and it gets you from nothing to an `approved` quest sitting on the Begin Quest modal in
> about a minute.

> **The relay has no standards-review family.** Its five concerns (`craft`, `perf`, `dedup`, `integrity`,
> `test-cases`) are guidance taken by `codeweaver`'s and `flowrider`'s own `review` step, in the same reading pass as
> that step's own role-specific judgment, before that step's own commit. Siegemaster's `happyWalk`/`adversarial`
> steps take no such pass. Nothing about it is recorded in `quest.json`, and no gate checks for it. Read
> `docs/quest-role-paths.md` for the current shape.

---

## Current execution model (read first)

Execution is a relay over **the family graph** (`riftcarver → codeweaver → flowrider → siegemaster → wardFull →
@complete`) and, inside each family's scope, **its own step graph**. It is worked one STEP session at a time (or
several sessions of the SAME step in parallel — never two steps or two families at once). It is **not**
auto-dispatched by the server. Three surfaces drive a quest:

- **Spec** runs in the Web UI (or via `/dumpster-create` / `/dumpster-hunt`): the intake role through the two approval
  gates. It authors flows, observables, contracts and `packagesAffected` — and **never** the `operations` ledger, which
  is off the modify-quest allowlist entirely, for every caller, at every status. The approval gate requires
  **non-empty `flows` and nothing else**; the ledger is minted lazily at Start and as the family graph is walked.
- **Start Quest** (Web UI button → `orchestration-start-responder`) is **pure `quest.json` bookkeeping and answers in
  milliseconds**. It derives the package graph, mints ONLY the entry family's scope (`questBuildRelayGraphBroker` —
  one `riftcarver` scope, `codeweaver`/`flowrider`/`siegemaster`/`wardFull` are minted later, as the family graph
  routes to each), and flips the quest to `in_progress`. It **spawns nothing, runs no git, and builds nothing** —
  assert that, it is a regression guard.
- **The first scope of every relay is `riftcarver`** — its `carve` step is a `deterministic` step that creates the
  quest branch and git worktree, mirrors `node_modules` into it, and runs the preflight typecheck. It is what makes a
  workspace exist, and it runs only once the quest is actually next in line. Watching it is the point of the
  Riftcarver checkpoint below.
- **Dispatch** actually runs the work. Two interchangeable dispatchers share one brain (`get-next-step` + `quest-work`
  + `signal-back` + the dispatch scan):
    - **Node/UI mode (primary)** — the `/queue` play button starts the server-side Node dispatch runner, which loops
      `get-next-step` in-process, spawns headless `claude -p` children for a `prompt` step, and runs a `deterministic`
      step (`carve`, `repair`, `commit`, `ward`, `cleanup`) itself through `stepHandlerRunBroker`.
    - **MCP mode** — `/dumpster-launch`, a loop in your Claude session: `get-next-step()` → `Task()` for a `prompt`
      step → await → repeat. It has NO way to run a `deterministic` step for a current-model quest.
  Without a dispatcher running, nothing executes.

**The two quest types share ONE family graph.** `feature` and `bug-hunt` differ ONLY in intake — `feature` runs
`/dumpster-create` (ChaosWhisperer), `bug-hunt` runs `/dumpster-hunt` (BugHunt, one flow per bug forking into
`ACTUAL:`/`EXPECTED:` terminal nodes). Both then walk the SAME family graph:

```
riftcarver (ONE scope) → codeweaver ×N (one scope PER (package, flow) cell)
  → flowrider ×N (one scope PER runtime flow) → siegemaster ×N (one scope PER flow) → wardFull (ONE scope)
```

**`ward` is not a family of its own** — every code-changing family carries its OWN `ward` step as the last step of
its own step graph (`plan → work → review → commit → ward` for codeweaver; the same shape plus an on-request
`recipe` step for flowrider; `sweepIn → plan → happyWalk ⇄ fixHappy → adversarial ⇄ fixAdversarial → commit → ward →
sweepOut` for siegemaster). `wardFull` is the one family whose WHOLE scope is a bare ward gate over the entire
monorepo, reached once every other family has drained.

**Every `plan`/`work`/`review`/`happyWalk`/`adversarial`/`fixHappy`/`fixAdversarial` step is an ordinary
router-dispatched session** — there is no operator layer above a step and no sub-agent it dispatches to make the
edit or grade the pass. `get-agent-prompt` resolves `agentFlowStatics[family].steps[step].prompt` directly
(`codeweaver-worker`, `codeweaver-reviewer`, `siege-happy-walker`, …); dispatching the bare family name throws. A
planner step's own prompt allows a bounded `Agent()` call for a SEARCH and nothing else.

Consequences for this playbook:

- The quest stays at `in_progress` for the whole execution phase. There are **no `seek_*` statuses** and no PathSeeker
  planning phase — the intake role runs the entire spec lifecycle; the orchestrator drives the relay entirely within
  `in_progress`.
- `get-next-step` dispatches work at STEP granularity — several sessions of ONE step may run in parallel (several
  codeweaver cells' pieces at the same step), but never two different steps or two different families at once.
- **A session never signals failure — it records its own outcome, then reports `complete`.** A step's own session
  calls `quest-work` to mark every assigned unit (`met`/`cant-meet`/`unmet`, with evidence) and to declare its
  `outcome` word (`done`/`unmet`/`empty`/`wall`) BEFORE calling `signal-back({ signal: 'complete' })`. The ROUTER —
  never the session — decides what happens next: a `done`/`empty` step (once every work item at that step is
  terminal) moves the scope to its next step or completes it; an `unmet` step mints a FRESH batch of work items on
  the SAME scope, scoped to exactly the units still unsettled — there is no `pt N` continuation and no
  `operationStatus` field any more.
- **Three failure concepts, all of them the orchestrator's rather than a session's judgement call:** a **ward
  exit-code red** (routes to `repair`, which returns to `ward` once it reports `done`), a **riftcarver failure**
  (routed by class — see below), and a session's own **`wall` outcome** (an environment no fresh session could get
  past). A server crash mid-session **resumes** the orphaned session (`claude --resume`) — it does not restart it.
- **Riftcarver failures route by class, and only one of the classes is recoverable.** A build or `node_modules`
  failure is `repairable`: `carve`'s `unmet` routes to `repair`, which returns to `carve` once it reports `done`,
  bounded by those steps' own `maxVisits`. A `git-state` failure (base branch missing, branch name taken,
  `git worktree add` refused) is a `wall` and **blocks the quest** immediately, deliberately — with no worktree, the
  only checkout is the repo root, which is a different branch's source, and no agent may be dispatched into it. A
  permission-denied error at any step blocks too, overriding the class.
- **Riftcarver is re-entrant by design.** Because the repairable route is `carve → repair → carve`, the carve is
  re-entered against a partly-built workspace as a matter of routine. Every step re-checks the real world (disk and
  git, never `quest.json` alone) and skips itself when already satisfied — **except the typecheck, which always
  re-runs**, because re-running it is how the spiritmender's fix gets verified. When you watch a repaired carve,
  expect the git and `node_modules` steps to report skips and the typecheck to run.
- **The only gate `quest-work`/`signal-back` runs is the unmarked-unit gate.** It refuses the call while any of the
  work item's `assignedUnitIds` carries no `observations[]` entry — the mark's VALUE is irrelevant, only its absence
  counts. There is no sign-off-completeness gate, no review-coverage gate, and no `codeweaverSignoff`/
  `flowriderSignoff`/`siegemasterSignoff` field anywhere — `workItem.observations[]` IS the record.

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
`explore_flows` (`flowsRule: 'full'` there, observables included — send none anyway, so the walk exercises the same
bare-spine draft the intake role produces). Node `packages` tags must draw from `packagesAffected`, which is why both
ride the same call.

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
  Expect: the `carve` step goes `unmet` → a **`repair`** row (same riftcarver scope, same `spiritmender` prompt) →
  a fresh **`carve`** row once repair reports `done`. Read that second carve's stream: the git and `node_modules`
  steps report **skips** and only the typecheck re-runs. That is the idempotency contract, visible.
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
4. **`docs/quest-role-paths.md`** and **`packages/orchestrator/CLAUDE.md`** — the authoritative model for the family
   graph + step graph relay: per-family happy/sad step transitions, block ownership, the **Fixpoint** bullet in Core
   concepts, and how quest status is derived. Read these if you need context on why `codeweaver` runs one SCOPE per
   (package, flow) cell, `flowrider` and `siegemaster` each run one scope PER flow, and why every step inside a
   scope — `plan`, `work`, `review`, `happyWalk`, `adversarial`, the fixers — is an ordinary router-dispatched
   session with no briefing layer above it: a `work`/`review` step's own session makes the edit or grades the pass
   directly, and `codeweaver`/`flowrider`'s `review` step (not siegemaster's `happyWalk`/`adversarial`) is where the
   five standards concerns get a reading pass.

**Resumption rules:**

- Continue from the last non-success run's phase/checkpoint. Do not re-run earlier successful checkpoints.
- If the last run was `blocked` AND the fix was committed, start a fresh run at the phase where it blocked (new
  quest, per Run Lifecycle).
- If the last run was `in_progress` with no blocker filed, the prior session may have just stopped mid-run — restart
  with a new quest on the same phase.
- **Abandon any non-terminal quests from prior runs before starting a new run.** Leftover in-flight quests dilute
  the repo: on dev-server restart, orchestration recovers them and their agents resume writing codeweaver outputs
  / ward artifacts into the working tree, contaminating the new run. Abandon them via
  `mcp__dungeonmaster__modify-quest` (set `status: 'abandoned'`) — do not just park them.

---

## Ground Rules

Static policies. These hold for every run.

- **NEVER manually refresh the browser. EVER.** This includes F5, Ctrl+R, Cmd+R, right-click-reload, clicking the
  browser reload button, `page.reload()`, `mcp__claude-in-chrome__navigate` to the current URL, `key: "F5"`,
  `key: "ctrl+r"`, or ANY other mechanism that reloads the page. Manually refreshing **kills any agent currently running
  in the quest session** (codeweaver, flowrider, siegemaster, etc.) and corrupts the orchestration state. The UI
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
- **Three server situations, and only one is yours to manage.** The validation orchestrator (you) runs `npm run prod`
  on ports 4800/4801 for the smoke-test UI you drive — the compiled server from `dist/`, exercising the same code a
  real user would hit. Flowrider gets no dev-server config at all: the server a runtime flow's e2e suite needs comes
  from the project's Playwright `webServer` block (ports 4750/4751 per `.dungeonmaster.json`) and lives only for that
  run. **Siegemaster resolves no dev-server config either, and owns no server of its own** — `happyWalk` and
  `adversarial`, the two steps of its own step graph flagged `needsLane`, each boots its OWN isolated LANE (an API
  server, a Vite server and a headless Chromium, plus its own `DUNGEONMASTER_HOME` under `tmp/siege/<lane-name>/`)
  through `dungeonmaster siegelense start`. The OS picks each lane's port pair, so a lane never collides with the
  smoke-test prod server or with Flowrider's dev server, and it closes itself once nothing is driving it, so you
  never start, stop, or manage one by hand. `sweepIn`/`sweepOut`, the family's own `cleanup` steps at the head and
  tail of the scope, make the first capacity reading honest and catch whatever a pass leaked. No other family
  (codeweaver, riftcarver's carve, `wardFull`) touches any server lifecycle at all.
- **MANDATORY: `npm run build` before every `npm run prod`.** Unlike `npm run dev` which uses `tsx watch` and runs from
  source, `npm run prod` runs the compiled server from `dist/` and serves the built web bundle via `vite preview`.
  ANY source change — contracts, statics, prompts, responders, brokers, widgets — is invisible to prod until `npm run
  build` is re-run. This applies to:
    - Your own edits between validation runs — the smoke-test server runs from dist/
    - Every fix-agent patch before the next run can exercise it
  Shortcut: `npm run prod:build-and-serve` does both in order. Use it whenever unsure whether dist is current.
- **Ports and homes.** Everything comes from `.dungeonmaster.json` plus the root npm scripts — there are no `.env`
  files and no `DUNGEONMASTER_ENV`. prod = **4800** (server) / **4801** (web preview), home `<repo>/.dungeonmaster/`.
  dev = **4750** / **4751**, home `<repo>/.dungeonmaster-dev/` — a separate directory, not a subdirectory of the same
  one. `npm run prod` and `npm run dev` each set `DUNGEONMASTER_HOME` inline, which is why the two queues never mix. A
  running siegemaster `happyWalk`/`adversarial` step never touches either home or either port pair — each lane it
  opens gets its own fresh `DUNGEONMASTER_HOME` under `tmp/siege/<lane-name>/` and its own OS-picked ports. Host is
  `dungeonmaster.localhost`.
- **Agent crash mid-session (any step).** An `in_progress` work item observed during a get-next-step scan is orphaned;
  `recover-orphaned-work-items-layer-broker` flips it back to `pending` keeping `sessionId`/`agentId` + a `resume`
  marker, and Node/UI dispatch resumes the retained Claude session (`claude --resume`) so partial work survives — no
  duplicate work item (the same `operations/<id>` link, the same `step`). A crash-looping session is bounded by
  `slotManagerStatics.orphanRecovery.maxResets` → `blocked`.
- **Ward invocation.** Orchestrator does NOT run ward directly — always delegate to a ward-runner agent. Agents use
  `npm run ward` from repo root with `timeout: 600000`. Never `cd` into a package; pass paths after `--` to scope.
- **Fix agent scope.** Every fix agent is small-scope (≤3 files), one bug per agent. Every check reads source, so no
  fix agent builds anything. The one exception is a `locationsStatics` change: this repo's own lint rules import that
  module as plain Node with no `source` condition, so lint keeps seeing the old value until
  `npm run build --workspace=@dungeonmaster/shared` runs.
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
  or 4750, 4751 (dev server / a Flowrider e2e run's webServer).
- Any orchestrator-owned background `Bash` tool tasks (polling loops, server bg processes).
  - Any child Claude CLI processes still running from prior orchestration (`pgrep -af claude`).
  - Any leftover siege lane processes from a prior siegemaster run — each lane's own API server, Vite server and
    headless Chromium under `tmp/siege/<lane-name>/`, on OS-picked ports. A lane closes itself once nothing is
    driving it, so this is normally a non-issue; a crashed session can leave one running.
    Use `npm run prod:kill` for the primary smoke-test server; `npm run dev:kill` for the dev server; use `jobs` /
    `kill %N` for orchestrator-owned bg bash; use `pkill -f siege-driver` for a stale lane, or `pkill -f <pattern>` as
    a last resort otherwise. A stale background process will hold ports, file locks, or keep emitting output that
    confuses the next run.

3. **Abandon any non-terminal prior-run quests.** Enumerate with `mcp__dungeonmaster__list-quests` and abandon every
   quest whose status is not already `complete` / `abandoned` / `blocked` via `mcp__dungeonmaster__modify-quest`
   (set `status: 'abandoned'`). Without this, dev-server startup recovery will re-register those quests and their
   agents will resume writing codeweaver outputs / ward artifacts into the working tree during the new run.
4. **Build.** `npm run build` — packages run from `dist/`, stale builds mask or invent bugs. The smoke-test server
   (prod) runs from `dist/` too, so this is mandatory before every server (re)start.
5. **Start smoke-test server.** `npm run prod` (ports 4800/4801). Single process only. Leave it up for the whole run. Do
   NOT run `npm run dev` — that port range is reserved for the one Playwright's `webServer` starts inside a Flowrider
   e2e run. Siegemaster never touches it: its own siegelense lanes get their own OS-picked ports instead.
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
2. **Post-Start-Quest, pre-dispatch (also viable).** The Start Quest click mints the entry family's scope (one
   `riftcarver` operation item, plus its first work item at `step: 'carve'`) and flips the quest to `in_progress`,
   but **dispatches nothing** — work only runs once a dispatcher (the `/queue` play button or `/dumpster-launch`)
   starts. So the moment after Start Quest (before you start dispatch) is a stable, clean pre-execution state with no
   race: no agent is running, nothing has written a file. Snapshotting here would skip ChaosWhisperer entirely and
   let you re-enter at the start of dispatch. In practice Window 1 is still simplest (it also covers re-testing the
   Start Quest click itself), so prefer Window 1 unless you specifically want to skip the approval clicks.

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
   agents (a sub-agent's or a reviewer's edits), not the bug itself. Revert BEFORE dispatching fixers so agents work
   from a clean base.
5. **Do Root Cause Analysis first** (see that section above). No fix agent is dispatched until the orchestrator can
   cite the causal file:line from its own observation or from an RCA sub-agent's report, AND every material ambiguity
   has been resolved with the user. Skip this step only if you directly observed the bug and can write
   `Root cause: path/to/file.ts:<line> — <one-sentence explanation>` from your own context.
6. **Dispatch fix agents per the Fix Agent Launch Protocol** (see that section above). One bug per agent, hard file
   allowlist pre-declared by the orchestrator (derived from the RCA), `isolation: "worktree"` by default, Fix Agent
   Prompt Requirements pasted verbatim into the prompt. No fix agent builds anything; every check reads source.
   Only a `locationsStatics` change needs `npm run build --workspace=@dungeonmaster/shared` before lint sees it.
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
- **Never commit quest-generated artifacts.** The smoke flow produces codeweaver outputs, reviewer inline fixes,
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

## Clarification Questions (Blocking) — ChaosWhisperer / BugHunt only

**Only the intake role (ChaosWhisperer or BugHunt) emits clarification questions. The execution-relay agents are
autonomous and never ask.**

During the spec phase, the intake role may surface clarification questions in a dedicated CLARIFICATION panel in the
Web UI. Each question has multiple pre-written answer options plus an "Other..." free-text option. The intake role is
**blocked** until the orchestrator (me) picks an answer — it will not proceed to the next question, the next phase,
or any gate until the answer is selected.

**Procedure during spec phase (between "New Chat" and Gate #2 approve):**

- While watching the chat, also watch for a CLARIFICATION panel appearing in the Web UI.
- Each question shows "Question N of M". Answer them in order.
- For smoke tests, pick the **most testable / unambiguous** option (usually the first DOM-order / exact-text option).
  If no option fits, use "Other..." with a terse literal assertion Flowrider / Siegemaster can check.
- Only after every question is answered will the intake role move to the next status.

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
    - **ChaosWhisperer authors NO ledger at all.** `operations` is off the modify-quest allowlist entirely, for every
      role at every status. Read `quest.json` `operations[]` (or the QUEST SPEC tab's operations ledger,
      `data-testid="OPERATIONS_LEDGER"`) and confirm it holds only the intake plan item at this point — the
      `codeweaver` items are DERIVED at Start Quest, not authored here. **The `approved` gate demands no ledger item at
      all** — it opens on non-empty `flows` alone.
    - Chat streams token-by-token in UI
    - `chaoswhisperer-gap-minion` dispatched visibly as a sub-agent

**→ FAIL (approval gate blocked on something other than empty `flows`):** fix the approval gate
(`has-quest-gate-content-guard` + the web approve button) — it must not demand a ledger item. Restart 1.1.
**→ FAIL (chat/spec layer):** fix chat/spec layer. Restart 1.1.
**→ PASS:** continue.

### 1.2 — Execution kickoff (MUST go through the UI, not MCP)

**Critical:** After approving observables at Gate #2, a "Start Quest" popup/modal surfaces in the Web UI. Click it. Do
NOT bypass by calling `mcp__dungeonmaster__start-quest` — the smoke test's whole purpose is to exercise the UI path a
real user takes. A quest started via MCP may land in the same orchestrator state, but the UI flow (modal → click →
state swap → WS broadcast → execution panel render) has not been tested, so the run proves nothing about that path.

- **Action:** In the Web UI, click the "Start Quest" button in the popup that appears after Gate #2. Then start a
  dispatcher: click the `/queue` page play button (Node/UI mode, the primary path) OR run `/dumpster-launch` in your
  Claude session (MCP mode). Start Quest mints the entry family's scope but dispatches nothing on its own.
- **Assert (in order, screenshot each — DO NOT REFRESH between checks):**
    1. **UI switches to the execution panel automatically.** The WebSocket `quest-modified` event drives this — no
       manual reload, no URL change, no second click. Within a few seconds of the Start Quest click, the layout must
       swap from the observables approval / spec view to the execution panel (tab bar `execution-panel-tab-execution`
       "EXECUTION" | `execution-panel-tab-spec` "QUEST SPEC", `data-testid="execution-panel-widget"` visible).
       Screenshot to confirm.
    2. **The operations ledger renders in the execution panel** (`data-testid="OPERATIONS_LEDGER"`, rows
       `OPERATIONS_LEDGER_ROW` — role badge + text + status). The status bar
       (`execution-status-bar-layer-widget`) reads `EXECUTION — 0/M OPERATIONS` once the entry scope is minted (or
       `AWAITING PLAN` before Start Quest seeds it).
    3. Status → `in_progress`. `questBuildRelayGraphBroker` mints the ENTRY family's scope and NOTHING ELSE, then
       creates ONE work item for it. **Assert the ledger holds EXACTLY the force-completed intake plan item plus ONE
       `riftcarver` item — `locked: true`, `packageNames: []`, `flowIds: []`, `in_progress` — and its work item
       carries `step: 'carve'`.** `codeweaver`/`flowrider`/`siegemaster`/`wardFull` scopes do NOT exist yet — they are
       minted later, as the family graph is routed to each. A ledger that already holds a `codeweaver`/`flowrider`/
       `siegemaster` row here is the LAZY-MINT invariant regressing.
    4. **Nothing was carved and nothing was spawned.** `quest.json` has no `branchName` / `baseBranch` /
       `worktreePath` / `baseRef`, and `<repo>/worktrees/` holds no directory for this quest. Start is pure
       bookkeeping; anything else here is the "Begin Quest hangs for minutes" defect returning.
    5. Once a dispatcher is running, the **riftcarver** work item's `carve` step flips to `in_progress` (a flat
       `execution-row-layer-widget` row, `RUNNING` badge). It is a `deterministic` step, so it gets **no `sessionId`**
       — its output reaches the panel through the chat-output bus keyed on the work item id, not through a session
       JSONL tail.

**→ FAIL assertion #1 (UI never switches after Start Quest click):** UI bug in the execution-panel guard or in the
binding that reacts to `quest-modified`. Most likely candidate: `shouldRenderExecutionPanelQuestStatusGuard` is missing
`in_progress`. File it, fix, restart. DO NOT refresh to "confirm" — refreshing kills the running agent.
**→ FAIL assertion #4 (nothing dispatches):** confirm a dispatcher is actually running and `get-next-step` is being
polled. If `get-next-step` returns `idle` despite a pending operation item with no live work item, debug the scan
self-heal / advance; if no dispatcher is running, nothing will dispatch — that is expected, not a bug.
**→ FAIL no "Start Quest" popup appears:** UI bug in the post-Gate-#2 flow. File it, fix, restart.
**→ PASS:** continue.

### 1.2b — Riftcarver (the carve; the entry family's one scope)

The first thing any dispatcher runs. `carve` is a `deterministic` step — the dispatcher executes it itself, there is
no Claude session, and `onLine` is the ONLY route its output has to a UI for the minutes it runs.

- **Action:** none. It runs as soon as a dispatcher starts. Watch the row.
- **Assert:**
    1. **The row streams while it runs** — base-branch probe, `git worktree add`, one line per `node_modules` root
       mirrored, then the preflight typecheck. A row that sits `RUNNING` with an empty body for minutes is the
       required-`onLine` contract regressing.
    2. **On green:** `worktrees/<slug>-<id8>/` exists on disk; `quest.json` gains `branchName`, `baseBranch`,
       `worktreePath` and `baseRef`; `quest.riftcarverResults` gains one entry; the work item carries a
       `riftcarverResults/<id>` ref; the riftcarver operation item is `complete`; and the family graph mints the
       `codeweaver` scopes — the **first codeweaver** work item (`step: 'plan'`) appears.
    3. **`baseRef` is the fork point**, i.e. the base branch tip the worktree was cut from — not the server process's
       HEAD. It is written exactly once and never moves again, including across a repaired re-carve.
    4. **History survives a reload.** Reload the page, expand the finished riftcarver row: the persisted
       `riftcarver-results/<id>.log` renders. The live stream is in memory only — this is the durable half.
- **On red, check the class before calling it a bug.** `node_modules`/typecheck failures are `repairable` — `carve`'s
  `unmet` routes to a `repair` step (same scope), which returns to a fresh `carve` once it reports `done`.
  Base-branch/`git worktree add`/permission failures are a `wall` — the quest blocks IMMEDIATELY with the git error on
  the failed row and dispatches NO agent. A repairable failure that blocks, or a git-state failure that spawns an
  agent into the repo root, is the bug.

**→ FAIL (row streams nothing):** the `onLine` wiring at the dispatch site. Check both emit paths — the Node loop's
`onRiftcarverLine` and `stepHandlerRunBroker` — they share `commandChatOutputEmitTransformer`.
**→ FAIL (quest blocks on a repaired re-carve because the branch already exists):** the re-entrancy probe. A carve
whose directory is gone but whose branch survives must ATTACH to that branch (no `-b`, prune first), not re-create it.
**→ PASS:** continue.

### 1.3 — Codeweaver (one scope per (package, flow) cell, its OWN step graph)

The family graph mints ONE codeweaver scope per (package, flow) cell once riftcarver's `carve` reaches `@done`. Each
scope runs its own step graph: `plan → work → review → commit → ward`, with `review`'s `unmet` looping back to
`work` and `ward`'s `unmet` routing to `repair` (which returns to `ward`).

- **Assert, per scope:**
    - **`plan` dispatches first**, a `prompt` step whose session cuts pieces (`quest-work({ kind: 'plan', plan })`)
      and declares `outcome: 'done'` — it marks no units itself.
    - **`work` dispatches next**, one work item per piece (several may run in PARALLEL — that is normal, not a
      strict-1:1 violation; `select-batch-layer-broker` admits every ready item sharing this scope's role AND this
      step). Each session edits the files its piece names directly — **no operator layer, no briefed sub-agent** —
      then marks its `assignedUnitIds` via `quest-work({ kind: 'observations', ... })` and declares its `outcome`.
    - **`review` dispatches once every `work` piece has drained.** Its session is assigned the scope's WHOLE in-scope
      set (`terminal`/`branch`/`observable` units, `runtime` + `operational` flows) and, in the same reading pass,
      takes the five standing concerns (`craft`, `perf`, `dedup`, `integrity`, `test-cases`) as guidance — fixing
      what is small and clearly its own. An `unmet` mark on any unit routes a fresh `work` batch back to exactly
      those units; `done` routes to `commit`.
    - **`commit` and `ward` are `deterministic` steps** — no session, no `sessionId`; watch them the same way as the
      carve (B2/B3 anchors). `ward`'s own `args` are `['--committed', '--uncommitted']`. Green → the scope completes.
      Red → `repair` (a `spiritmender`-prompted session, same scope) runs, then a fresh `ward` re-verifies.
    - **Every work item on this scope — `plan`, every `work` piece, `review`, `commit`, `ward`, any `repair` — links
      the SAME `operations/<id>`.** This is what replaces the old "strict 1:1" idea: one scope legitimately carries
      MANY work items (one per step, one per piece), and the invariant is that the link never re-points, never a
      duplicate scope for the same cell.
    - **Sad path — a real session declares `outcome: 'wall'`, never anything else, for an environment it cannot get
      past** (do NOT force this here; see Phase 2). A `wall` halts the QUEST immediately — it does not just fail this
      scope. There is no `partial`/`pt N` concept in the current model at all.
    - Once EVERY codeweaver cell's scope is `complete`, the family graph mints `flowrider`'s scopes.

**→ FAIL (a second scope minted for one (package, flow) cell):** fix `familyScopesMintTransformer` /
`mintNextFamilyLayerBroker`. **→ FAIL (the family graph moves on before every cell is complete):** fix
`questRouteScopeBroker`'s "family's LAST scope" check. Restart 1.3.
**→ PASS:** continue.

### 1.4 — Flowrider (one scope PER runtime flow, authoring tests in the browser AND below it)

Minted once codeweaver's last cell completes — one scope per RUNTIME flow (a flow-less quest still gets exactly one
whole-quest scope). Same step shape as codeweaver, plus an on-request `recipe` step.

- **Assert, per scope:**
    - `plan → work → review → commit → ward`, same routing rules as 1.3.
    - **`work`'s session reads the implementation itself** (to learn the exact value each unit claims), chooses a
      LAYER per unit — a real browser via Playwright, or an integration/unit test below it — and authors the suite
      directly, with no briefed sub-agent. For a **runtime** flow's browser-layer units, its Playwright suite
      controls its own dev server (`webServer` config from `.dungeonmaster.json`'s project settings). Confirm the
      prod server on 4800/4801 stays LISTEN throughout; a dev server (4750/4751) comes up and goes down within the
      run.
    - **`review`'s session grades whether the suite BITES** — the same five standards concerns as codeweaver's
      `review`, plus flowrider's own judgment (does the test fail for the right reason). It marks the scope's whole
      `runtime`-flow in-scope set.
    - **`commit`/`ward` are `deterministic`**, same as 1.3 — no session runs them.
    - Once every flowrider scope is `complete`, the family graph mints `siegemaster`'s scopes.

**→ FAIL (a flowrider scope covering more than one flow):** fix `familyScopesMintTransformer`'s `fanOutBy: 'flow'`
cut. **→ FAIL (dev server leaks / clobbers prod):** check the Playwright `webServer` config + port resolution behind
a Flowrider e2e run. Restart 1.4.
**→ PASS:** continue.

### 1.5 — Siegemaster (one scope PER flow, its OWN inverted step graph)

Minted once flowrider's last scope completes — one scope per flow (siegemaster keeps flows of either type, so a
quest with a mix gets siegemaster coverage flowrider does not). Its step graph is the INVERSE of the other two: the
walkers find the work, the fixers repair.

- **Assert, per scope:**
    - `sweepIn` (a `deterministic` `cleanup` step) runs first — it makes the first capacity reading honest. `recipe`
      and `read` are ON-REQUEST steps a later step may ask for; neither is on the main route.
    - `plan` cuts the walk. `happyWalk` (flagged `needsLane`) drives the flow's own happy path through a freshly
      booted siegelense lane, marking every `terminal`/`branch`/`observable`/`off-map` unit it measures; its `unmet`
      routes to `fixHappy`, which returns to `happyWalk`.
    - **`happyWalk`'s `done` fires only once EVERY piece at that step has drained** — only then does `adversarial`
      (also `needsLane`) mint, so an antagonist's baseline always postdates a clean happy pass. `adversarial`'s scope
      is `off-map` units ONLY — it never re-marks a terminal/branch/observable unit `happyWalk` already covered; a
      finding there is a NEW observable. Its `unmet` routes to `fixAdversarial`, which returns to `adversarial`.
    - `commit` is `deterministic`, same as the other families. **`ward` OVERRIDES the shared routing**: `done` and
      `empty` route to `sweepOut` (another `cleanup` step), not straight to `@done` — the pass is not over until the
      lanes it opened are swept. `unmet` still routes to `repair`, unchanged.
    - **No session dispatches a sub-agent of its own** — `happyWalk`/`adversarial`/the fixers each read, walk, fix or
      grade directly. Siegemaster has no separate "reviewer" step: `happyWalk` and `adversarial` ARE its reviewer-role
      steps.
    - Once every siegemaster scope is `complete`, the family graph mints `wardFull`'s ONE scope.

**→ FAIL (`adversarial` mints before every `happyWalk` piece has drained):** fix the phase-order route in
`agentFlowStatics.siegemaster`. **→ FAIL (a lane is left running after `sweepOut`):** fix the `cleanup` handler.
**→ PASS:** continue.

### 1.6 — `wardFull` + complete

- **Assert:**
    - `wardFull`'s ONE whole-quest scope is minted once the LAST siegemaster scope completes, with nothing minted in
      between. Its `gate` step's own `args` are `[]` — a bare ward over the whole monorepo.
    - On green, the family graph has reached `@complete` and `workItemsToQuestStatusTransformer` derives quest
      `complete`. (It never derives `complete` while a family that routes to `@complete` holds an incomplete scope.)
    - WS `quest-modified` broadcast; the Web UI shows quest "Complete" (status bar reads `EXECUTION — M/M OPERATIONS`,
      terminal banner present).

**→ PASS:** Phase 1 complete.

---

## Phase 2 — Fault Tests (the non-failure "sad" paths)

Each uses a fresh quest. Keep each deliberately simple — one path per quest. None of these is a failure signal; they all
keep the quest `in_progress` and move it forward. The ONLY route to `blocked` is a spent bounded loop or an
agent-reported environment wall.

### 2.1 — `unmet` → a re-cut batch on the SAME scope

- **Seed / drive:** at any `prompt` step, have the session mark at least one of its assigned units `unmet` via
  `quest-work({ kind: 'observations', ... })`, then declare `quest-work({ kind: 'outcome', word: 'unmet' })` before
  `signal-back`.
- **Assert:**
    - The work item is marked terminal (`complete`) — declaring `unmet` is not itself a failure.
    - The router mints a FRESH work item on the SAME operation item, at the step named by that step's own
      `routes.unmet` (`review`'s is `work`; `ward`'s is `repair`), scoped to EXACTLY the units still `unmet`, grouped
      by the piece that originally claimed them.
    - **No new operation item is ever appended.** There is no `pt N` continuation and no `operationStatus` field in
      the current model — confirm this is a re-cut batch on the scope that is already open, not a second scope.

**→ FAIL (a new operation item appears instead of a re-cut batch):** fix `nextActionTransformer`'s `unmet` handling
or `questRouteScopeBroker`'s mint. **→ PASS:** continue.

### 2.2 — `wall` → immediate block (the sole halt path from a session)

Every step of every family routes `wall` to `@blocked` identically — there is no per-family variation to test beyond
confirming the reason and message land on the right row.

- **Seed / drive:** a session at any `prompt` step marks its assigned units, then declares
  `quest-work({ kind: 'outcome', word: 'wall', reason: '<environment description>' })` and calls `signal-back`.
- **Assert:**
    - The router answers `{ kind: 'block', reason: 'wall', message: '<reason>' }`; `quest-block-on-failure-broker`
      marks the work item `failed` carrying that message as `errorMessage`, drains every still-`pending` work item to
      `skipped`, and sets the quest `blocked` — IMMEDIATELY, on the first occurrence. Nothing else on the scope is
      re-cut or minted.
    - `get-next-step` for that quest now returns `idle`.
    - Resume (`blocked → in_progress`) rearms every work item whose operation item is unfinished back to `pending`
      with `retryCount` 0, keeping `sessionId`/the `resume` marker — confirm the SAME scope + step re-dispatches
      rather than a fresh scope being minted or the quest silently doing nothing.

**→ FAIL (the quest keeps running after `wall`, or resume doesn't rearm the right work item):** fix
`quest-block-on-failure-broker` / `quest-resume-rearm-work-items-transformer`.
**→ PASS:** continue.

### 2.3 — Ward red → `repair` → the gate re-runs (no ward loop)

- **Seed:** introduce a genuine ward-catchable defect in a git-changed source file (a TS type error, an eslint
  violation, or a failing colocated `*.test.ts`), then let the family's own `ward` step run for real (routing is
  keyed on the real exit code inside `stepHandlerWardBroker` — it can't be staged by editing `quest.json`). Restore
  the file once asserted.
- **Assert:**
    - `ward`'s work item is marked `failed`; its `declaredWord` is `unmet`; a `wardResults[]` ref (exitCode ≠ 0) is
      appended.
    - The router mints a `repair` work item on the SAME scope (a `spiritmender`-prompted session) — it declares no
      `done` route of its own, so once it reports `done` it RETURNS to a fresh `ward` work item, which re-runs.
    - Advance/route dispatches the **`repair` step next** (never two `ward` steps back-to-back); after it fixes
      forward, the fresh `ward` re-verifies.
    - UI: the ward row shows `FAILED` + "Ward exit code: 1" (+ `(committed)`/`(full)` when the `WardResult` carries a
      `wardMode`) + a detail breakdown (`execution-row-ward-detail`, HTTP-fetched, renders only for a failing run).
      The new `repair` + fresh `ward` rows appear live, both linked to the SAME `operations/<id>`.

**→ FAIL (`ward` re-dispatches immediately with no `repair` / two wards back-to-back):** fix the `ward`/`repair`
routing in `agentFlowStatics`. Restart 2.3.
**→ PASS:** continue.

### 2.4 — A step's `maxVisits` exhausted → blocked

- **Seed:** an unfixable ward-catchable defect so the `ward ⇄ repair` cycle on one scope keeps recurring past that
  step's own `maxVisits` (counted as the work items on THIS scope at THAT step).
- **Assert:**
    - Instead of minting another `repair`, the router answers `{ kind: 'block', reason: 'max-visits' }` and
      `quest-block-on-failure-broker` runs: the failed work item is `failed`, every still-`pending` work item is
      drained to `skipped`, quest `status: blocked`.
    - `get-next-step` returns `idle` for that quest (the scan filters on `in_progress`).
    - UI: the failed row shows `FAILED`; skipped rows are hidden; no terminal banner (`blocked` is not terminal). The
      RESUME button is visible. Assert `blocked` + the skipped rows in `quest.json`.

**→ FAIL (loops past the step's `maxVisits` / never blocks):** fix the visit count in
`nextActionTransformer`/`questRouteScopeBroker`.
**→ PASS:** continue.

### 2.5 — Server crash mid-session → resume (no restart, no duplicate)

- **Seed:** kill the server (or the agent process) while a work item is `in_progress`.
- **Assert:**
    - On the next get-next-step scan, `recover-orphaned-work-items-layer-broker` flips the orphaned `in_progress` work
      item back to `pending`, **keeps** its `sessionId`/`agentId`, sets a `resume` marker, and increments `retryCount`.
    - Node/UI dispatch resumes the retained Claude session (`claude --resume`, prompting it to finish + record its
      marks + signal back) — partial work survives, no from-scratch re-run, no duplicate work item (the SAME `step`,
      the SAME `operations/<id>` link). (Fallbacks fresh-spawn: an early-crash orphan with no captured `sessionId`,
      and the MCP `/dumpster-launch` Task path.)
    - A crash-looping session reaching `slotManagerStatics.orphanRecovery.maxResets` blocks the quest.

**→ FAIL (a duplicate work item is created / identity cleared):** fix `recover-orphaned-work-items-layer-broker` (it
must keep identity + a resume marker and set `pending`, not stay `in_progress`).
**→ PASS:** continue.

### 2.6 — The unmarked-unit gate refuses a premature signal

This is the ONLY gate `quest-work`/`signal-back` runs, and it runs BEFORE any mutation, so a refusal persists
NOTHING: the work item is untouched and the session can mark the remaining units and signal again.

- **Seed:** a work item whose `assignedUnitIds` names two units; mark only ONE via `quest-work`'s `observations`
  payload, then call `signal-back`.
- **Assert:**
    - `signal-back` (and a `quest-work` `outcome` call) THROWS, naming the unmarked unit. The mark's VALUE is
      irrelevant — `met`, `cant-meet` and `unmet` all count as marked; only the ABSENCE of an entry refuses the call.
    - Marking the remaining unit and re-calling `signal-back` SUCCEEDS.
    - **Negative-space assert (confirm no OTHER gate exists):** on a work item whose every assigned unit IS marked,
      `signal-back` succeeds regardless of whether the quest worktree is clean or dirty, and regardless of whether any
      other unit on the flow/package carries an observation. If it throws for either of those reasons instead, either
      a gate has been reintroduced (update this doc to match) or this doc is stale relative to the code — verify
      against `signal-gate-transformer.ts` directly before trusting either outcome.

**→ FAIL (`signal-back` succeeds with an unmarked assigned unit, or refuses a fully-marked one):** fix
`signalGateTransformer`.
**→ PASS:** continue.

### 2.7 — Execution agents cannot write the operations ledger

- **Drive:** from a running execution agent (or a stub) at any status, attempt `modify-quest({ operations: [...] })`.
- **Assert:**
    - Rejected by the input allowlist, at EVERY status — `operations` is off the allowlist entirely, for every caller.
      The ledger has exactly ONE writer: the orchestrator, via `questOperationsUpdateBroker` (runtime mutation) and
      `questBuildRelayGraphBroker` (the entry-family seed at Start), both of which bypass the allowlist. No chat role
      authors it either.

**→ FAIL (write accepted at any status):** fix `quest-status-input-allowlist-statics` / `quest-modify-broker`.
**→ PASS:** continue.

### 2.8 — Bug-hunt relay

- **Seed:** a `bug-hunt` quest (via `/dumpster-hunt`) — captured as a reproduction flow + an expected-behavior
  observable.
- **Assert:**
    - At Start Quest the orchestrator mints the SAME entry family a feature quest gets — one `riftcarver` scope —
      and the family graph that follows it is identical: `codeweaver ×N → flowrider ×N → siegemaster ×N → wardFull`.
      `questFlowStatics`'s own colocated test asserts `feature` and `bug-hunt` share the same family sets. There is no
      separate bug-hunt implementation family.
    - The codeweaver scope that owns the package the fix lands in turns the `EXPECTED:` observable into a failing
      test, then makes it pass; the relay advances the same way as a feature quest (`done` → the scope moves on,
      `wall` → halt, a red `ward` → `repair`). Quest derives `complete`.

**→ FAIL (a different seed shape, or a family other than codeweaver doing the implementation):** fix
`questFlowStatics`. Restart 2.8.
**→ PASS:** continue.

---

### 2.9 — Riftcarver failure classes (the block route)

Riftcarver adds an entry to block ownership, and it is the only failure whose routing depends on WHICH step
failed. Run each arm on its own quest.

- **Arm A — `repairable`.** Point `.dungeonmaster.json` → `devServer.buildCommand` at a command that exits non-zero,
  then start a dispatcher.
    - **Assert:** the `carve` row goes `unmet` with an `errorMessage` naming the failing step; the same riftcarver
      scope gains a `repair` work item (the `spiritmender` prompt) whose text names the failing step and the
      riftcarver result id; the quest stays `in_progress`; `repair` is dispatched next, **inside the quest's
      worktree** (the git context was persisted before the typecheck ran, which is what gives it a tree to work in).
    - **Then read the fresh `carve`'s stream once `repair` reports `done`** — the git and `node_modules` steps report
      skips, the typecheck re-runs. That is the idempotency contract observable at runtime. A re-carve that re-runs
      `git worktree add` and dies on a name collision is the regression this arm exists to catch.
    - Restore `buildCommand` and let the chain converge green, or exhaust `carve`/`repair`'s own `maxVisits` to see
      the spent-budget block.
- **Arm B — `git-state`.** Break base-branch detection (a repo state with neither `main` nor `master` resolvable).
    - **Assert:** the quest goes `blocked` immediately — no `repair` — with the git error verbatim on the failed row,
      and **no agent dispatched**. This asymmetry is deliberate: with no worktree the only checkout is the repo root,
      which is a different branch's source. An agent spawned there is the bug.
    - Note that a merely pre-existing BRANCH is **not** this case: the carve probes git and attaches to it.
- **Arm C — permission.** `chmod -w` the `worktrees/` directory.
    - **Assert:** immediate block regardless of which step hit it — the permission guard overrides the step's class.
- **Arm D — resume.** From the blocked quest in B or C, fix the environment and press RESUME.
    - **Assert:** the rearm returns the `carve` work item to `pending` and the quest re-dispatches it. A RESUME that
      visibly does nothing is the rearm regressing.

**→ FAIL (repairable arm blocks, or git-state arm spawns an agent):** the routing in `stepHandlerRiftcarverBroker`
keyed off `worktreePrepareStepStatics.classifications`. **→ PASS:** continue.

---

## Phase 3 — Final Ward

`npm run ward` (timeout 600000). Zero failures. Gates declaring the combined feature-set green.

**→ FAIL:** route back to whichever phase introduced the regression.
**→ PASS:** both features validated end-to-end.

---

## Execution Order

1. Run Phase 1 as a single unbroken live quest. Branch to fixers on red, restart from failing checkpoint. Enter at 1.2
   with a *Fake-Quest Bootstrap* quest when no chat session is available.
2. Run Phase 2 scenarios one by one, each on its own quest. Branch to fixers on red.
3. Run Phase 3.

**If the user only asked for a test quest to drive by hand, none of the above applies** — run *Fake-Quest Bootstrap*,
hand over the URL, and stay available to read `quest.json` for them. That is the whole job.

Only after Phase 3 passes do I declare the two features green.
