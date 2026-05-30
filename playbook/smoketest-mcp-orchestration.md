# Smoke Test — MCP Orchestration State Machine

A manual, MCP-driven smoke test of the `/dumpster-launch` dispatch loop. You (an LLM session) play the role of
`/dumpster-launch`, but instead of running real agents you **seed quest state on disk, call the MCP, assert what comes
back, dispatch a stub agent that just does the MCP handshake, then verify the mutation landed in `quest.json` AND
streamed correctly into the web execution view.**

This is a different test from `playbook/smoketest-orchastrator.md` — that one is a heavyweight full-live UI run
(browser → ChaosWhisperer → Begin Quest → real agents). This one is a surgical state-machine probe: it does **not**
build a real spec or write real code. It proves the *plumbing* — `get-next-step` math, `signal-back` routing, work-item
state transitions, work-item splicing, prompt delivery, identity stamping, ward-result rendering, and live web
streaming — behaves correctly for every role and every path.

> **Why this exists.** Almost every orchestration decision is now reachable through the MCP. We keep hitting bugs that
> only show up when the loop runs: wrong `get-next-step` output, work items that never flip status, spliced recovery
> items that don't appear, **ward results not showing in the UI**, and **duplicate steps rendering the same agent log**.
> A single LLM can exercise all of it deterministically by driving the MCP directly and watching both `quest.json` and
> the browser.

When a probe finds a real bug, switch to the **Fix Agent Launch Protocol**, **TDD-First Fix Process**, and **Bug
Procedure** in `playbook/smoketest-orchastrator.md` — those rules are shared and unchanged.

---

## How the system works (read first)

The orchestrator does **not** spawn execution agents. Three actors:

1. **`/dumpster-launch`** (here: you) — the dispatch loop. `get-next-step()` → `Task()` (agents) / `run-ward` (ward) →
   await → repeat.
2. **The MCP stdio child** — exposes the tools; quest tools route to the orchestrator via `orchestrator*Adapter`s.
3. **The orchestrator service** — owns `quest.workItems[]`, the dependency graph, and all "what runs next" math. Reads
   `quest.json` fresh from disk every scan; never spawns Claude itself.

The closed loop, per work item:

```
seed quest.json (status: in_progress, workItems[...])          ← you, on disk (bypasses gates)
        │
        ▼
get-next-step()  ── MCP ──►  orchestrator scans guilds (FIFO oldest), computes ready items, returns NextStep
        ▲                            │
   assert NextStep ◄─────────────────┘
        │
        ▼
Task(stub agent)  ──►  get-agent-prompt(role,workItemId,questId)
        │                    │  ← (best-effort) flips item pending→in_progress, stamps sessionId+agentId+startedAt,
        │                    │     returns the role prompt
        │              signal-back(questId,workItemId, complete|failed|failed-replan)
        │                    │  ← marks item terminal (status+completedAt only), then ROUTES by role+signal:
        │                    │      complete + pathseeker-walk → post-walk hook (append downstream chain)
        │                    │      failed/failed-replan + lawbringer → RECOVER (splice spiritmender + retry)
        │                    │      failed/failed-replan + anything else → BLOCK (skip pending, status=blocked)
        ▼                    ▼
assert quest.json fields    assert web execution view (status badge labels, distinct per-row logs,
(exact values)              ward exit-code + detail, spliced rows appear live)
        │
        ▼
back to get-next-step()  (advance)
```

Ward is the one role with `spawnerType: 'command'`. `get-next-step` returns `run-ward` for it (always alone, never
batched). You call the `run-ward` MCP tool instead of dispatching an agent. Ward's terminal status + recovery splice
come from the **real ward exit code inside `quest-run-ward-broker`**, not a `signal-back`.

### Quest data transport to the web (matters for every UI assertion)

```
quest.json → questPersistBroker → event-outbox.jsonl ("quest-modified")
   → server outbox watcher loads the FULL quest → wsEventRelayBroadcastBroker → WS "quest-modified" {questId, quest}
   → web webSocketChannelState → useQuestChatBinding (q.id === questId) → setQuest() → ExecutionPanelWidget
```

**The entire quest object — status, every work item's fields, steps, wardResults, and work-item INSERTIONS — arrives
live over the single WS `quest-modified` broadcast. No HTTP refetch.** The **only** HTTP fetch in the execution view is
the **ward-result detail breakdown** (GET `/api/quests/:questId/ward-results/:wardResultId`).

> **Seed visibility:** a direct `quest.json` edit (your seed) bypasses `questPersistBroker`, so **no outbox event
> fires** — the web picks it up only via a ~3s fallback poll. MCP `get-next-step` reads disk fresh, so it sees the seed
> immediately. Every *subsequent* mutation you cause through MCP tools goes through `questModifyBroker` → outbox → web
> updates ~instantly. So: wait ~3s after a seed before asserting the web; MCP-driven changes are near-instant.

### The two graph shapes

- **feature** (`questType: feature`): Start Quest seeds the four-tier PathSeeker graph
  `pathseeker-surface ×N → (pathseeker-dedup + pathseeker-assertion-correctness) → pathseeker-walk`. When
  `pathseeker-walk` signals `complete`, the **post-walk hook** appends
  `codeweaver(×chunks) → ward(changed) → siegemaster(×flow, chained) → lawbringer(×chunks) → blightwarden → ward(full)`.
- **bug-hunt** (`questType: bug-hunt`): Start Quest hand-seeds the whole chain (no PathSeeker, no post-walk hook):
  `pesteater → ward(changed) → lawbringer(whole-diff) → blightwarden → ward(full)`.

---

## Setup

### 1. Clear + start the dev server (the testbed is `.dungeonmaster-dev`)

This test runs against the **dev** home (`<repo>/.dungeonmaster-dev/`) — isolated from the prod queue (`.dungeonmaster`)
and the user-global queue (`~/.dungeonmaster`). **Clear it before starting** so the FIFO scan only ever sees your
smoketest quests and the guild bootstrap (§3) runs on a clean slate.

```bash
npm run dev:kill                      # reap stale this-repo dev processes (port + cwd sweep)
rm -rf .dungeonmaster-dev/guilds .dungeonmaster-dev/config.json .dungeonmaster-dev/event-outbox.jsonl   # clean slate
npm run build                         # keeps cross-package types honest (dev runs tsx-watch from source)
npm run dev                           # ROOT-ONLY. server 4750 / web 4751, home = .dungeonmaster-dev
```

Never use a workspace-scoped invocation or `cd` into a package — the root script owns ports/env/home.

### 2. Confirm the MCP writes to the dev home

`create-quest` is handled by the **MCP stdio child** in your Claude session, not the HTTP server. Its writes must land
in
the same home the dev server serves (`<repo>/.dungeonmaster-dev`) so MCP writes, server streaming, and the browser share
one home. Sanity check after §3: `mcp__dungeonmaster__list-quests` returns the quest you created. If it's empty, the MCP
child's `DUNGEONMASTER_HOME` isn't the dev home — fix the `.mcp.json` wrapper before proceeding.

### 3. Bootstrap the guild + clean FIFO

On a cleared home there are **no guilds**, and `create-quest` requires one — `quest-mcp-create-broker.ts` currently
**throws** `"No guild registered for current directory… Run \`dungeonmaster init\`"` when no guild matches the cwd. So
register the guild for this repo first, by ONE of:

- `dungeonmaster init` in this repo, or
- the web UI "add guild" on `:4751`, or
- `POST /api/guilds { name, path }` with `path` = the repo root.

This writes `.dungeonmaster-dev/config.json` (`{ guilds: [{ id: <UUID>, name, path, urlSlug, createdAt }] }`) and
creates
its `guilds/<id-UUID>/quests/` dir; `create-quest` then lands quests under that guild.

`get-next-step` picks the **oldest `in_progress` quest with incomplete work** (FIFO by `createdAt`), so before **every**
flow set every other non-terminal quest to `abandoned` (`mcp__dungeonmaster__modify-quest` `status: 'abandoned'`) so
your
seeded quest is the only active one.

> **Pending feature — add a Flow 0 once it lands.** Auto-creating the guild on the first `create-quest` (so the manual
> step above disappears) is an in-progress dumpster quest, NOT yet merged — today the broker throws as noted. When it
> lands, add a Flow 0 asserting: empty `.dungeonmaster-dev/config.json` → `create-quest` → exactly ONE guild
>
`{ name: "Codex of Consentient Craft", urlSlug/guildSlug: "codex-of-consentient-craft", path: <repoRoot>, id: <UUID> }`,
> the quest under `guilds/<id-UUID>/quests/<questId>/`, and idempotent on a 2nd call (still one guild).

### 4. Browser on the execution view

Open `http://dungeonmaster.localhost:4751/...` for the seeded quest. Many assertions are about what the UI *streams*.
**Never refresh** — it kills live agents and corrupts state. If something doesn't appear live, that is the bug.

### 5. (Ward paths) deterministic ward via fake CLI

`run-ward` shells out to `process.env.WARD_CLI_PATH ?? 'dungeonmaster-ward'` and routes recovery on the **exit code**.
The real repo is green, so to test ward *failure/splice* you must point `WARD_CLI_PATH` at a fake that exits with a
chosen code and prints a parseable run id, in the env the **dev server** inherits. If you can't inject it: run real
`run-ward` for ward *happy* paths (exit 0 → `complete`) and assert ward-fail recovery via
`quest-run-ward-broker.test.ts`
instead (the splice lives inside the broker, keyed on real exit code — it cannot be staged by editing `quest.json`).

---

## The seeding technique (the crux)

**MCP `modify-quest` strips `workItems`, `wardResults`, `designPort`, `pausedAtStatus`** (`quest-handle-responder.ts`).
So you stage work-item states by **editing `quest.json` directly on disk**:

1. `mcp__dungeonmaster__create-quest({ userRequest, questType? })` mints a schema-valid quest under the bootstrapped
   guild (§3) — a ready-made file (don't hand-author the whole quest — many required fields). Note the returned
   `questId` + `guildSlug`.
2. Open `.dungeonmaster-dev/guilds/<guildId-UUID>/quests/<questId>/quest.json` (the guild dir is the guild's **UUID id**
   from `list-guilds` / `config.json`, not the slug).
3. Patch `"status": "in_progress"` and inject the `"workItems": [...]` array for the state you want. For feature
   downstream chains you also need ≥1 `steps[]` and ≥1 `flows[]` so the post-walk hook can generate the chain.
4. Save. MCP sees it immediately; the web reflects a raw seed within ~3s.

> Direct disk edits bypass ALL status-transition gates and the input allowlist — that's why this is the seeding tool.
> Subsequent MCP-driven writes go through the gates, so they exercise the real validation.

---

# REFERENCE A — quest.json transition data points

This is the source of truth for "what value should each field be at each transition." Assert these in `quest.json`
(read on disk — the MCP `get-quest` view strips `workItems`/`wardResults`).

## A1. Work-item fields (the ones that move)

| Field              | Enum / type                                                         | Seeded      | Who writes it & when                                                                                                                  | Expected value at transition                                              |
|--------------------|---------------------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `status`           | `pending \| queued \| in_progress \| complete \| failed \| skipped` | `pending`   | get-agent-prompt → `in_progress`; signal-back → `complete`/`failed`; run-ward → `complete`/`failed`; block → pending become `skipped` | see A4                                                                    |
| `sessionId`        | uuid                                                                | absent      | **get-agent-prompt** (best-effort, if identity resolves)                                                                              | non-empty after the stub calls get-agent-prompt                           |
| `agentId`          | realAgentId                                                         | absent      | **get-agent-prompt** (best-effort)                                                                                                    | non-empty after get-agent-prompt                                          |
| `startedAt`        | ISO ts                                                              | absent      | **get-agent-prompt** (same stamp). NOT set for ward (no get-agent-prompt).                                                            | set after get-agent-prompt; absent for ward items                         |
| `completedAt`      | ISO ts                                                              | absent      | signal-back / run-ward on terminal                                                                                                    | set on `complete`/`failed`                                                |
| `errorMessage`     | branded string                                                      | absent      | run-ward failure only → `'ward_failed'`                                                                                               | set on a failed **ward** item; agent failures do NOT set it               |
| `summary`          | branded string                                                      | absent      | **NOT persisted by the live signal-back path** (dropped at the MCP→orchestrator adapter)                                              | stays absent — see gotcha G1                                              |
| `actualSignal`     | `complete \| failed \| failed-replan`                               | absent      | **NOT persisted by the live signal-back path**                                                                                        | stays absent — see G1                                                     |
| `dependsOn`        | uuid[]                                                              | per seed    | rewired by splice `replacementMapping`                                                                                                | downstream deps repoint failed→retry on recover                           |
| `attempt`          | int ≥0 (default 0)                                                  | per seed    | ward-retry = `attempt+1`; lawbringer-retry = `attempt+1`                                                                              | retry items carry `attempt 1`, etc.                                       |
| `maxAttempts`      | int >0 (default 1)                                                  | per builder | pathseeker=3, ward=3, all others=1                                                                                                    | exhaustion test: `attempt >= maxAttempts-1`                               |
| `relatedDataItems` | `(steps\|flows\|wardResults)/<id>[]`                                | per seed    | run-ward stamps `wardResults/<id>` on the ward item at completion                                                                     | ward item gains `wardResults/<id>` — **load-bearing for the UI ward row** |
| `insertedBy`       | uuid                                                                | absent      | recovery splices set `= failedWorkItemId`                                                                                             | present on spliced spiritmender/retry items (drives splice idempotency)   |
| `lastWardRunId`    | filename                                                            | absent      | run-ward when a runId was produced                                                                                                    | set on ward items after a run                                             |
| `sliceName`        | branded string                                                      | per seed    | pathseeker-surface at graph build only                                                                                                | on surface items only                                                     |
| `wardMode`         | `changed \| full`                                                   | per seed    | ward builders; preserved on retry                                                                                                     | `changed` (mid) / `full` (final)                                          |

**No-write-site fields (don't assert as changing):** work-item `retryCount` (the live counter is `attempt`); quest-level
`completedAt`; `abandonReason` (abandon only sets `status: abandoned`).

## A2. Quest-level fields that move during execution

| Field             | When it changes                                                                      | Expected                            |
|-------------------|--------------------------------------------------------------------------------------|-------------------------------------|
| `status`          | derived by `workItemsToQuestStatusTransformer`, or set by block/pause/resume/abandon | see A3/A4                           |
| `updatedAt`       | every successful `questModifyBroker` write                                           | bumps on each MCP-driven mutation   |
| `workItems[]`     | post-walk hook appends chain; recovery splices append fixers+retry                   | new entries appear                  |
| `wardResults[]`   | run-ward appends a ref `{id, createdAt, exitCode, runId?, wardMode}`                 | one ref per ward run                |
| `planningNotes.*` | pathseeker agents (surface/synthesis/walkFindings), blightwarden (`blightReports`)   | only at `in_progress` per allowlist |
| `pausedAtStatus`  | pause sets `= prevStatus`; resume clears (→ key removed)                             | set only while paused               |

## A3. Quest status derivation (`workItemsToQuestStatusTransformer`, precedence order)

1. current status is `seek_*` (pathseeker-running) → **unchanged**.
2. current status is pre-execution → **unchanged**.
3. EVERY work item terminal AND none `failed` (i.e. all `complete`/`skipped`) → **`complete`**.
4. ANY work item active (`in_progress` **or** `queued`) → **`in_progress`**.
5. ≥1 pending item AND every pending item depends on ≥1 `failed` id → **`blocked`**.
6. else → **unchanged** (terminal-but-failed with nothing pending stays `in_progress`).

> Block routing is set explicitly by `questBlockOnFailureBroker` (status `blocked`, pending→`skipped`); it doesn't wait
> on derivation. Derivation governs `complete` and the implicit cases.

## A4. Enums + the dependency rule

- **work-item status:** `pending, queued, in_progress, complete, failed, skipped`.
    - `isActive` = **{queued, in_progress}**.
    - `isTerminal` = {complete, failed, skipped}.
    - **`satisfiesDependency` = {complete, failed}** — **`skipped` does NOT satisfy** (a skipped dep blocks dependents
      permanently).
- **a work item is READY** when `status === pending` AND every `dependsOn` id is `complete` **or** `failed`.
- **signal-back signals:** `complete | failed | failed-replan` (`failed-replan` is treated as `failed`, then
  role-routed).
- **quest status (19):** `created, pending, explore_flows, review_flows, flows_approved, explore_observables,
  review_observables, approved, explore_design, review_design, design_approved, seek_scope, seek_synth, seek_walk,
  in_progress, paused, blocked, complete, abandoned`. Terminal = {complete, abandoned}. **`blocked` is NOT terminal**
  (resumable → in_progress).
- **roles:** `pathseeker-surface, pathseeker-dedup, pathseeker-assertion-correctness, pathseeker-walk, codeweaver, ward,
  siegemaster, lawbringer, blightwarden, spiritmender, pesteater` (+ chat `chaoswhisperer`/`glyphsmith`, out of scope).
- **ward `maxAttempts` = 3** (`slotManagerStatics.ward.maxRetries`); spiritmender batch size = 3.

## A5. signal-back routing (assert the `quest.json` result)

| signal                   | role                                                                                     | result in `quest.json`                                                                                                                                                                                                                                                                      |
|--------------------------|------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `complete`               | `pathseeker-walk`                                                                        | item `complete`; **downstream chain appended** to `workItems[]`                                                                                                                                                                                                                             |
| `complete`               | any other                                                                                | item `complete` + `completedAt`                                                                                                                                                                                                                                                             |
| `failed`/`failed-replan` | `lawbringer`                                                                             | **RECOVER**: append 1 `spiritmender` (dependsOn failed law, `insertedBy`=law) + 1 `lawbringer` retry (`attempt 1`, dependsOn spiritmender, `insertedBy`=law); `blightwarden.dependsOn` rewired onto the retry; quest stays `in_progress`; a `spiritmender-batches/<id>.json` sidecar exists |
| `failed`/`failed-replan` | `codeweaver`, `siegemaster`, `spiritmender`, `blightwarden`, `pathseeker-*`, `pesteater` | **BLOCK**: item `failed`; every still-`pending` item → `skipped`; quest `status: blocked`                                                                                                                                                                                                   |

## A6. run-ward routing (ward only, inside the broker)

Exit 0 → item `complete`, `wardResults[]` ref appended, `relatedDataItems += wardResults/<id>`. Exit ≠ 0:

- `attempt < maxAttempts-1` (attempts 0,1) → splice N `spiritmender` (batch size 3) + 1 `ward` retry (`attempt+1`, same
  `wardMode`, dependsOn all spiritmenders, `insertedBy`); downstream rewired onto retry; quest stays `in_progress`.
- `attempt >= maxAttempts-1` (attempt 2) → **BLOCK**.

---

# REFERENCE B — UI assertion anchors

Verify in the browser **wherever it makes sense**. Root: `data-testid="execution-panel-widget"`. Tabs:
`execution-panel-tab-execution` ("EXECUTION"), `execution-panel-tab-spec` ("QUEST SPEC").

## B1. Status badge — assert the LABEL, not the raw status (`execution-row-status-badge`)

| work-item status | badge text |
|------------------|------------|
| `pending`        | `PENDING`  |
| `queued`         | `QUEUED`   |
| `in_progress`    | `RUNNING`  |
| `complete`       | `DONE`     |
| `failed`         | `FAILED`   |
| `skipped`        | `SKIPPED`  |

## B2. Work-item row anchors (`execution-row-layer-widget`, one per row — scope by `.nth(N)` / query within the row)

Click `execution-row-header` to expand; most detail testids only exist when `execution-row-expanded` is present.

| Field / transition               | testid                                            | shows                              | notes                                                    |
|----------------------------------|---------------------------------------------------|------------------------------------|----------------------------------------------------------|
| role                             | `execution-row-role-badge`                        | `[CODEWEAVER]` etc. (uppercased)   | ward badge is warning-colored                            |
| status                           | `execution-row-status-badge`                      | label from B1                      | live                                                     |
| spliced item (`insertedBy`)      | `execution-row-adhoc-tag`                         | `AD-HOC`                           | dashed border                                            |
| retry (`attempt>0`)              | `execution-row-retry-badge`                       | `retry {attempt}/{maxAttempts}`    | **`attempt 0` renders NO badge**                         |
| duration (startedAt+completedAt) | `execution-row-duration`                          | e.g. `2m 34s`                      | needs both stamps → renders for stamped agents, NOT ward |
| ward exit code                   | `execution-row-ward-result`                       | `Ward exit code: {n}` (+ `(mode)`) | green if 0 else red — see B3                             |
| ward detail                      | `execution-row-ward-detail`                       | per-failure lines                  | HTTP fetch — see B3                                      |
| summary                          | `execution-row-summary`                           | `Summary: ...`                     | **won't populate from stub signal-back** (G1)            |
| actual signal                    | `execution-row-actual-signal`                     | `Actual signal: ...`               | **won't populate from stub signal-back** (G1)            |
| error                            | `execution-row-error-message`                     | `Error: ...`                       | populates for failed **ward** (`ward_failed`)            |
| agent transcript                 | inside `execution-row-expanded` (chat-entry-list) | text/tool rows/sub-agent chains    | auto-expands while `in_progress`                         |

Floors: `floor-header-layer-widget` (`── FLOOR N: NAME ──`), `floor-header-concurrent` (`Concurrent: a/max`). Floor
names
by role: HOMEBASE (chat), ENTRANCE: MAPPING DUMPSTER (pathseeker), FORGE (codeweaver), EXTERMINATION (pesteater), MINI
BOSS (first ward), INFIRMARY (spiritmender), ARENA (siege), TRIBUNAL (lawbringer), QUARANTINE (blightwarden), FLOOR BOSS
(final ward). Status bar: `execution-status-bar-layer-widget` (`EXECUTION {done}/{total} COMPLETE`). Pause/Resume:
`EXECUTION_PAUSE_BUTTON` (visible iff `isAnyAgentRunning(status)`), `EXECUTION_RESUME_BUTTON` (visible iff
`isQuestResumable(status)` = {paused, blocked}) — keyed on real `quest.status`.

## B3. Ward result rendering (the "ward results not showing" bug — two stages, both must hold)

**Stage 1 — exit-code row (live via WS):** a `[WARD]` row shows `execution-row-ward-result` ("Ward exit code: N") ONLY
when **(a)** the ward work item has `relatedDataItems: ['wardResults/<id>']`, **(b)** a matching `wardResults[]` entry
with that id exists on the quest, AND **(c)** the row is in the **stepped/normal** render branch (NOT the
isPlanning/hasWorkItemsOnly branches — only the normal branch passes `wardResults` + `questId` to rows). Assert the
exit-code **text**, not just visibility.

**Stage 2 — detail breakdown (HTTP, on mount):** `execution-row-ward-detail` fetches GET
`/api/quests/:questId/ward-results/:wardResultId` when the row's detail widget mounts (needs `questId` passed). It
renders **nothing** while loading, on fetch error, OR when there are zero failures. So a green ward shows only the
exit-code line; assert the detail breakdown only for a known-**failing** ward run.

## B4. Agent-log grouping (the "duplicate steps show the same log" bug — two distinct keys)

- **Which transcript a row shows = `workItemId`.** The binding keeps `entriesByWorkItem` keyed by work-item id; a row
  resolves `entriesByWorkItem.get(wi.id) ?? (wi.sessionId ? entriesBySession.get(wi.sessionId) : []) ?? []`. Sibling
  Task agents **share one parent `sessionId`** — if a row falls back to the session bucket it shows the **merged** logs
  of all siblings → **duplicate identical logs across rows**. So for any parallel batch, assert each row's transcript is
  **distinct** (scope to `execution-row-layer-widget`.nth(N), assert distinct text), not merely "logs present."
- **Sub-agent chain collapse inside one transcript = `toolUseId`** (`collectSubagentChainsTransformer`). Chain header
  `SUBAGENT_CHAIN_HEADER` (`▾ SUB-AGENT "{desc}" ({n} entries)`), group `SUBAGENT_CHAIN`. A "N Tools" group is the
  merged
  tool_use/result rows.

## B5. NOT observable in the UI — assert ONLY in `quest.json`

- **`skipped` work items are filtered out** of the active/stepped/planning render branches (shown only in the terminal
  `hasWorkItemsOnly` branch). So a **BLOCK** shows the failed row as `FAILED` and its skipped siblings **vanish** —
  there
  is no `SKIPPED` row to see. Assert skipped in `quest.json`.
- **`blocked` does not render the terminal banner** (`execution-panel-terminal-banner` uses `isTerminal` = {complete,
  abandoned} only). A blocked quest keeps the status bar + `/dumpster-launch` banner; verify "blocked" via `quest.json`
  status + the failed row.
- `relatedDataItems` linkage, `planningNotes`/`scopeClassification`, `pausedAtStatus` value, `questType`, and
  `attempt === 0` are not shown as text (only effects are). Assert in `quest.json`.

---

# REFERENCE C — the repeatable probe cycle

Every step of every flow is the same six beats:

1. **CALL** `get-next-step()`.
2. **ASSERT NextStep** JSON: `type` (`spawn-agents`/`run-ward`/`idle`), `agents[].role` + `workItemId` (or ward `mode`),
   batch membership per A4 + select rules. Record raw JSON.
3. **DISPATCH** stub agent(s) per the recipe below (or `run-ward` for a ward step) with the test-case signal.
4. **ASSERT quest.json** (on disk):
    - after get-agent-prompt: item `in_progress` + non-empty `sessionId`+`agentId`+`startedAt` (if these stay empty,
      identity resolution failed — a finding);
    - after signal-back/run-ward: terminal `status` + `completedAt`, plus routing side effects (appended chain / spliced
      items+`insertedBy` / `skipped` pending / `status: blocked` / `wardResults[]` ref + `relatedDataItems`);
    - confirm `summary`/`actualSignal` are **absent** (G1).
5. **ASSERT web** (no refresh):
    - row status badge shows the right **label** (B1): `RUNNING` on dispatch → `DONE`/`FAILED` on signal;
    - the agent's log renders **under its own row**; for a parallel batch each row shows a **distinct** log (B4);
    - **work-item insertions appear live** (post-walk chain rows, spliced AD-HOC rows) within a couple seconds;
    - ward rows show `Ward exit code: N` (+ detail for a failing run) (B3).
6. **ADVANCE** (back to beat 1) until terminal.

### Stub-agent dispatch recipe

For each `spawn-agents.agents[]` entry, dispatch one real `Task()` (parallel for a batch, to exercise concurrent MCP
calls + the dup-log path):

```
You are a SMOKETEST STUB AGENT. Do NOT do real work, do NOT read/write source files.
1. Call mcp__dungeonmaster__get-agent-prompt({ agent:"<role>", workItemId:"<id>", questId:"<id>" }).
2. Paste the FULL prompt text you received into your final report.
3. Call mcp__dungeonmaster__signal-back({ questId:"<id>", workItemId:"<id>", signal:"<complete|failed>",
   summary:"smoketest stub: <role>" }).
4. Report: the prompt you got, the signal you sent, any error from either call.
```

Optionally pre-seed `smoketestPromptOverride` (trivial prompt) + `smoketestExpectedSignal`. A real `Task()` (not a faked
in-process call) is required so `get-agent-prompt` can resolve identity via `_meta.claudecode/toolUseId` →
`subagents/agent-*.jsonl`.

### Gotchas to keep front of mind

- **G1 — `summary`/`actualSignal` are not persisted by the live `signal-back`** (validated, then dropped at the adapter
  boundary; the handler writes only `status`+`completedAt`). UI `Summary:`/`Actual signal:` lines stay empty from a
  stub. If you believe they SHOULD persist, that's a bug to file — but the current expected value is **absent**.
- **G2 — get-agent-prompt stamping is best-effort.** No identity → no `in_progress`/`sessionId`/`agentId` flip; the item
  jumps straight to terminal on `signal-back`. Verify the stamp happened.
- **G3 — skipped rows vanish in the UI** and **blocked shows no banner** (B5). Don't expect a `SKIPPED` row or a blocked
  banner; assert those in `quest.json`.
- **G4 — ward detail renders null** while loading / on error / when green. Only assert the breakdown for a failing ward.

---

# Flow 1 — Happy path, one role per step (feature)

Walk a feature quest from a seeded PathSeeker graph to `complete`, one agent per step, asserting every field + UI label.

### Seed

`create-quest` (feature), patch `quest.json` to `status: in_progress` with a **single-slice** PathSeeker graph (one
`pathseeker-surface`) plus ≥1 `steps[]` + ≥1 `flows[]` so the post-walk hook emits a **1-chunk** chain:

```jsonc
"workItems": [
  { "id":"S", "role":"pathseeker-surface",              "status":"pending","spawnerType":"agent","dependsOn":[],       "maxAttempts":3,"sliceName":"orchestrator","createdAt":"..." },
  { "id":"D", "role":"pathseeker-dedup",                "status":"pending","spawnerType":"agent","dependsOn":["S"],     "maxAttempts":3,"createdAt":"..." },
  { "id":"A", "role":"pathseeker-assertion-correctness","status":"pending","spawnerType":"agent","dependsOn":["S"],     "maxAttempts":3,"createdAt":"..." },
  { "id":"W", "role":"pathseeker-walk",                 "status":"pending","spawnerType":"agent","dependsOn":["D","A"], "maxAttempts":3,"createdAt":"..." }
]
```

### Probe sequence

| #  | get-next-step                                                                            | dispatch                    | quest.json                                                                                                              | web                                                                       |
|----|------------------------------------------------------------------------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| 1  | `spawn-agents`, 1× `pathseeker-surface` (`S`)                                            | stub `complete`             | `S`: in_progress(+sessionId/agentId/startedAt) → complete(+completedAt)                                                 | row badge `RUNNING`→`DONE`; its log under its own row                     |
| 2  | `spawn-agents`, **2×** `pathseeker-dedup`(`D`) + `pathseeker-assertion-correctness`(`A`) | 2 parallel stubs `complete` | both → complete                                                                                                         | **2 distinct rows, 2 distinct logs** (B4)                                 |
| 3  | `spawn-agents`, 1× `pathseeker-walk`(`W`)                                                | stub `complete`             | `W` complete; **downstream chain appended** (codeweaver, ward, siege, law, blight, final ward) with correct `dependsOn` | new chain rows appear live                                                |
| 4  | `spawn-agents`, 1× `codeweaver`                                                          | stub `complete`             | codeweaver complete                                                                                                     | `RUNNING`→`DONE`                                                          |
| 5  | `run-ward`, `mode: changed`                                                              | `run-ward` (real, green)    | ward complete; `wardResults[]` +1; ward item `relatedDataItems` has `wardResults/<id>`                                  | `Ward exit code: 0` line (`execution-row-ward-result`); no detail (green) |
| 6  | `spawn-agents`, 1× `siegemaster`                                                         | stub `complete`             | siege complete                                                                                                          | `RUNNING`→`DONE`                                                          |
| 7  | `spawn-agents`, 1× `lawbringer`                                                          | stub `complete`             | law complete                                                                                                            | `RUNNING`→`DONE`                                                          |
| 8  | `spawn-agents`, 1× `blightwarden`                                                        | stub `complete`             | blight complete                                                                                                         | `RUNNING`→`DONE`                                                          |
| 9  | `run-ward`, `mode: full`                                                                 | `run-ward` (real, green)    | final ward complete; **quest derives `complete`**                                                                       | terminal banner (`execution-panel-terminal-banner`); all rows `DONE`      |
| 10 | `idle` (~25s long-poll)                                                                  | —                           | no incomplete items                                                                                                     | —                                                                         |

**PASS:** quest `complete`, every field asserted in `quest.json` and mirrored live (correct labels, distinct logs, ward
exit-code shown), terminal banner present.

---

# Flow 2 — Happy path, multiple roles per step (parallel batches)

Exercise every multi-agent batch and confirm **N distinct rows / N distinct logs** (the dup-log surface).

### Seed

`create-quest` (feature) with **multiple `packagesAffected`** (e.g. `["orchestrator","web","shared"]`) → **3×
`pathseeker-surface`**, patch to `in_progress`. Seed steps whose `focusFile` folder types land in the **same batch
group** (so codeweaver/lawbringer chunk into >1 work item) plus one solo-folder step.

### Probe deltas from Flow 1

| #     | get-next-step                                                                       | dispatch                        | assert                                                                                         |
|-------|-------------------------------------------------------------------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| 1     | `spawn-agents` with **3** `pathseeker-surface`, distinct `workItemId`s              | **3 parallel stubs** `complete` | all complete; **3 distinct rows each with its OWN log** (no shared/duplicated transcript)      |
| 2     | `spawn-agents` with **2** `pathseeker-dedup`+`pathseeker-assertion-correctness`     | 2 parallel `complete`           | both complete; 2 distinct rows/logs                                                            |
| 3     | `pathseeker-walk` solo → chain appended with **M>1 codeweaver chunks**              | stub `complete`                 | chain has M>1 codeweaver items; each `relatedDataItems` length matches its chunk               |
| 4..N  | codeweaver/law items return **one at a time** (single oldest), gated by `dependsOn` | stub each `complete`            | a chunk whose steps depend on another chunk stays `pending` until the upstream chunk completes |
| siege | one ready at a time (each `dependsOn` includes previous siege)                      | stub `complete`                 | serialization holds                                                                            |

**Critical (the reason this flow exists):** in beats 1–2 (true parallel dispatch), confirm each agent's
get-agent-prompt/signal-back chatter renders under the **correct, distinct** row. Same log on two rows, or one row
showing another's log → the dup-step/`workItemId`-bucketing bug (B4). File blocking; capture both session JSONLs + a
screenshot.

---

# Flow 3 — Sad path, one per role

For each role, drive a failure and assert `get-next-step` + `quest.json` + UI land in the expected post-failure state.
Each scenario is a freshly-seeded quest (clean FIFO first). Seed so the target role is the next ready item (deps
satisfied, downstream `pending`). Dispatch the stub with `signal: "failed"` (ward: force exit ≠ 0 via fake CLI).

| Role failed                                             | quest.json after                                                                                                                                                                                                                    | next get-next-step                                | UI                                                                                                                                            |
|---------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `pathseeker-surface`                                    | item `failed`; all pending → `skipped`; quest `blocked`                                                                                                                                                                             | `idle`                                            | failed row `FAILED`; **skipped rows hidden; no banner** (B5)                                                                                  |
| `pathseeker-dedup` / `-assertion-correctness` / `-walk` | BLOCK (as above); walk-fail generates **no** chain                                                                                                                                                                                  | `idle`                                            | `FAILED` row; skipped hidden                                                                                                                  |
| `codeweaver`                                            | BLOCK                                                                                                                                                                                                                               | `idle`                                            | `FAILED` row; skipped hidden                                                                                                                  |
| `siegemaster`                                           | BLOCK                                                                                                                                                                                                                               | `idle`                                            | `FAILED` row                                                                                                                                  |
| `lawbringer`                                            | **RECOVER**: +`spiritmender`(dependsOn law,`insertedBy`) +`lawbringer` retry(`attempt 1`,dependsOn spiritmender,`insertedBy`); `blightwarden.dependsOn` rewired onto retry; `in_progress`; sidecar `spiritmender-batches/<id>.json` | `spawn-agents` with the new `spiritmender`        | failed law `FAILED`; **new spiritmender + retry rows appear live, tagged `AD-HOC`** (`execution-row-adhoc-tag`); retry shows `retry 1/1`      |
| `spiritmender`                                          | BLOCK                                                                                                                                                                                                                               | `idle`                                            | `FAILED` row                                                                                                                                  |
| `blightwarden` (`failed` or `failed-replan`)            | BLOCK                                                                                                                                                                                                                               | `idle`                                            | `FAILED` row                                                                                                                                  |
| `pesteater` (bug-hunt)                                  | BLOCK                                                                                                                                                                                                                               | `idle`                                            | `FAILED` row                                                                                                                                  |
| `ward` (budget, attempt 0)                              | run-ward exit 1 → splice N `spiritmender` + 1 `ward` retry(`attempt 1`,same `wardMode`); downstream rewired; `in_progress`; `wardResults[]` +1 (exitCode 1); ward item `errorMessage: ward_failed`                                  | `spawn-agents` with the spliced `spiritmender`(s) | ward row `FAILED` + `Ward exit code: 1` + **detail breakdown** (failing run → `execution-row-ward-detail`); spliced `AD-HOC` rows appear live |
| `ward` (exhausted)                                      | seed ward `attempt: 2`; run-ward exit 1 → BLOCK; nothing spliced                                                                                                                                                                    | `idle`                                            | ward `FAILED`; skipped hidden                                                                                                                 |

**Idempotency (optional):** call `signal-back` twice for the same failed item — the second must not double-apply
(`questBlockOnFailureBroker` no-ops when already blocked+terminal; `questSpliceFixerBroker` no-ops when `insertedBy`
items already exist).

---

# Prompt-walk pass (static desk-check)

Verify each agent prompt still gives an LLM enough to do its job — every capability maps to a real, callable thing.
**Static desk-check only** — read and trace; do not execute.

### Targets

Every static under `packages/orchestrator/src/statics/` ending in `-prompt` or `-minion`, **plus** the PathSeeker
prompts: `codeweaver-prompt`, `lawbringer-prompt`, `siegemaster-prompt`, `blightwarden-prompt`, `spiritmender-prompt`,
`pesteater-prompt`, `glyphsmith-prompt`, `dumpster-create-prompt`, `dumpster-hunt-prompt`; the 5 `blightwarden-*-minion`

+ `chaoswhisperer-gap-minion`; `pathseeker-surface`, `pathseeker-dedup`, `pathseeker-assertion-correctness`,
  `pathseeker-walk`.

### Procedure (per prompt)

1. **Read** the static.
2. **Enumerate the role's required capabilities** (e.g. Siege: start a dev server, pick a verification mode, write/run
   tests; Codeweaver: read steps/contracts, discover standards, tests-first, run ward, signal back; Spiritmender: read
   its batch sidecar, run the verification command; Blightwarden synthesizer: dispatch minions, write
   `planningNotes.blightReports[]`, signal complete/replan).
3. **Trace each capability to a real mechanism:** does the prompt name the exact MCP tool / command / file path /
   static,
   and does it still exist? (`discover` to confirm — don't trust the prompt.) Are referenced signals/fields valid
   against
   current contracts (e.g. valid `signal-back` signals; `modify-quest` allowlist fields for that role's status)? Any
   holes — a value never provided in `$ARGUMENTS`, a tool the role can't call, a file read before it's written, stale
   wording referencing the retired in-process loop?
4. **Record findings:** capabilities covered ✓, capabilities with a hole ✗ (name the missing link), stale/ambiguous
   wording. A hole is a real bug — the agent stalls or improvises at runtime.

---

# Findings log + execution order

Keep `/tmp/smoke-mcp-notes.md`: per probe, the role, **expected vs observed** for the `NextStep` JSON, the `quest.json`
mutation, and the web view; quest/work-item ids; screenshots for any web discrepancy. Classify blocking (wrong next
step, mutation didn't land, UI mis-rendered) vs non-blocking vs prompt-walk hole. On a real bug, use the Fix Agent /
TDD-First / Bug Procedure from `playbook/smoketest-orchastrator.md`; the orchestrator does not edit source directly.

**Order:** (1) setup — build, **clear `.dungeonmaster-dev`**, bootstrap the guild, `npm run dev`, browser on `:4751`;
(2) Flow 1 end to end; (3) Flow 2 with the dup-log web assertions; (4) Flow 3, one fresh quest per role, clean FIFO
before each; (5) prompt-walk; (6) abandon all smoketest quests, confirm the dev queue is clean.
