# Smoke Test — MCP Orchestration State Machine (operations relay)

A manual, MCP-driven smoke test of the operations relay. You (an LLM session) play the **dispatcher** — either the
`/queue` play button (Node/UI mode, the primary driver) or `/dumpster-launch` (MCP mode). Instead of running real
agents you **seed quest state on disk, call the MCP, assert what comes back, dispatch a stub agent that just does the
MCP handshake, then verify the mutation landed in `quest.json` AND streamed correctly into the web execution view.**

This is a different test from `playbook/smoketest-orchastrator.md` — that one is a heavyweight full-live UI run
(browser → ChaosWhisperer → Start Quest → real agents). This one is a surgical state-machine probe: it does **not**
build a real spec or write real code. It proves the *plumbing* — `get-next-step` math, `signal-back` outcome
application, the operation↔work-item strict-1:1 relay, `questAdvanceBroker` advance, duplicate-on-partial, ward-as-
operation-item, prompt delivery, identity stamping, ward-result rendering, and live web streaming — behaves correctly
for every role and every path.

> **Why this exists.** Almost every orchestration decision is reachable through the MCP. The bugs that only show up when
> the relay runs — wrong `get-next-step` output, an operation item that never flips status, a duplicate work item minted
> for one operation, ward results not showing in the UI, duplicate rows rendering the same agent log — a single LLM can
> exercise deterministically by driving the MCP directly and watching both `quest.json` and the browser.

> **Prerequisite — read `playbook/quest-lifecycle.md` first.** It's the soup-to-nuts model of how a quest is created and
> moves (create → spec → Start Quest → operations relay → complete), what each role does, how
> `get-agent-prompt`/`signal-back`/`run-ward` mutate state, and what the validation gates check. This doc assumes that
> understanding; without it the seeding rules below won't make sense.

When a probe finds a real bug, switch to the **Fix Agent Launch Protocol**, **TDD-First Fix Process**, and **Bug
Procedure** in `playbook/smoketest-orchastrator.md` — those rules are shared and unchanged.

---

## How the system works (quick recap — full model in `quest-lifecycle.md`)

Execution is a **reactive relay over the quest's `operations` ledger** — an ordered `OperationItem[]`. Three actors:

1. **Dispatcher** (here: you) — polls `get-next-step()` → `Task()` (agents) / `run-ward` (ward) → await → repeat. Runs
   one session at a time.
2. **The MCP stdio child** — exposes the tools; quest tools route to the orchestrator via `orchestrator*Adapter`s.
3. **The orchestrator service** — owns `quest.operations[]` (the ledger), `quest.workItems[]` (the sessions), and all
   "what runs next" math. Reads `quest.json` fresh from disk every scan; never spawns Claude itself.

The closed loop, per operation item:

```
seed quest.json (status: in_progress, operations[...] + ONE work item linked operations/<id>)   ← you, on disk (bypasses gates)
        │
        ▼
get-next-step()  ── MCP ──►  orchestrator scans guilds (FIFO oldest), returns NextStep (spawn-agents / run-ward / idle)
        ▲                            │
   assert NextStep ◄─────────────────┘
        │
        ▼
Task(stub agent)  ──►  get-agent-prompt(role, workItemId, questId)
        │                    │  ← flips the work item pending→in_progress, stamps sessionId+agentId+startedAt,
        │                    │     resolves the linked operation item (operations/<id>) and interpolates its scope
        │              signal-back(questId, workItemId, signal:'complete', operationItemId?, operationStatus?)
        │                    │  ← marks the work item terminal, then applies the OUTCOME server-side:
        │                    │      operationStatus 'done'    → operation item complete → advance to the next item
        │                    │      operationStatus 'partial' → operation item complete + a "pt N" continuation → advance to it
        ▼                    ▼
assert quest.json fields    assert web execution view (status badge labels, distinct per-row logs,
(exact values)              ward exit-code + detail, operations ledger + new rows appear live)
        │
        ▼
back to get-next-step()  (advance)
```

Ward is the one role with `spawnerType: 'command'`. `get-next-step` returns `run-ward` for it (always alone, never
batched). You call the `run-ward` MCP tool instead of dispatching an agent. Ward's terminal state + the spiritmender/
re-ward append come from the **real ward exit code inside `quest-run-ward-broker`**, not a `signal-back`.

**There is no failure signal.** `signal: 'complete'` is the sole signal kind; the outcome rides on `operationStatus`
(`done | partial`; `failed` is rejected). The orchestrator applies it server-side (authoritative — an agent cannot
forget to patch the ledger, because agents never write it).

### Quest data transport to the web (matters for every UI assertion)

```
quest.json → questPersistBroker → event-outbox.jsonl ("quest-modified")
   → server outbox watcher loads the FULL quest → wsEventRelayBroadcastBroker → WS "quest-modified" {questId, quest}
   → web webSocketChannelState → useQuestChatBinding (q.id === questId) → setQuest() → ExecutionPanelWidget
```

**The entire quest object — status, every operation item, every work item's fields, wardResults, and work-item
INSERTIONS (advance's next item, a `pt N` continuation) — arrives live over the single WS `quest-modified` broadcast. No
HTTP refetch.** The **only** HTTP fetch in the execution view is the **ward-result detail breakdown** (GET
`/api/quests/:questId/ward-results/:wardResultId`).

> **Seed visibility:** a direct `quest.json` edit (your seed) bypasses `questPersistBroker`, so **no outbox event
> fires** — the web picks it up only via a ~3s fallback poll. MCP `get-next-step` reads disk fresh, so it sees the seed
> immediately. Every *subsequent* mutation you cause through MCP tools goes through `questOperationsUpdateBroker` /
> `questModifyBroker` → outbox → web updates ~instantly. So: wait ~3s after a seed before asserting the web; MCP-driven
> changes are near-instant.

### The two ledger shapes

- **feature** (`questType: feature`): ChaosWhisperer authors the `{ role: 'codeweaver', text }` implementation items at
  spec time; Start Quest appends the verify tail `ward(changed) → flowrider → siegemaster → lawbringer → blightwarden →
  ward(full)` (all `locked`).
- **bug-hunt** (`questType: bug-hunt`): Start Quest seeds a single `pesteater` implementation item + the tail
  `ward(changed) → lawbringer → blightwarden → ward(full)` (no flowrider/siegemaster).

---

## Setup

### 1. Clear quests + start the prod server (the testbed is `.dungeonmaster`)

The MCP stdio child in this Claude session is wired to the **prod** home (`<repo>/.dungeonmaster/`), so this test runs
against prod — that way MCP `create-quest` writes, the prod server's streaming, and the browser all share one home. The
repo already has a registered guild for this repo (id `21523917-83f7-4e23-a6de-8db1cae2ad96`, name/slug `codex`); **keep
it** and wipe only its quests so the FIFO scan sees only your smoketest quests.

```bash
npm run prod:kill                     # free 4800/4801 from any prior run
rm -rf .dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests   # wipe quests only — KEEP the guild + config.json
npm run build                         # prod serves compiled dist/ — mandatory before prod
npm run prod                          # ROOT-ONLY. server 4800 / web 4801, home = .dungeonmaster
```

Never use a workspace-scoped invocation or `cd` into a package — the root script owns ports/env/home. Rebuild + restart
prod after any source change (prod serves `dist/`, not source).

> **GOTCHA — `npm run build` kills the MCP stdio child.** The dungeonmaster MCP server in this session is a stdio child
> running `packages/mcp/dist/src/index.js`. Any `npm run build` (e.g. applying a fix mid-run) overwrites that `dist/`
> out from under the running child, so it dies and the `mcp__dungeonmaster__*` tools drop. **After ANY rebuild,
> reconnect the MCP** (`/mcp` → reconnect dungeonmaster) before resuming MCP-driven probes. Corollary: any fix to
> orchestrator/MCP code only takes effect after a rebuild **and** an MCP reconnect. Batch source fixes so you rebuild +
> reconnect once, not per-fix.

> If `.dungeonmaster/config.json` ever loses the `codex` guild, recreate it (`dungeonmaster init`, the web "add guild"
> on `:4801`, or `POST /api/guilds { name, path }` with `path` = repo root) — `create-quest` throws
> `"No guild registered for current directory…"` when no guild matches the cwd. Auto-create-on-first-quest is an
> in-progress feature, not yet merged.

### 2. Confirm MCP ↔ server ↔ browser share the prod home

Sanity check: `mcp__dungeonmaster__list-guilds` returns the `codex` guild, and after your first `create-quest`,
`mcp__dungeonmaster__list-quests` returns that quest. If list-quests is empty, the MCP child's `DUNGEONMASTER_HOME`
isn't `<repo>/.dungeonmaster` — stop and fix the `.mcp.json` wrapper before proceeding (nothing downstream will line
up).

### 3. The guild + clean FIFO

`guildId = 21523917-83f7-4e23-a6de-8db1cae2ad96`; `create-quest` returns `guildSlug: "codex"`; quests land under
`.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/<questId>/quest.json`.

`get-next-step` picks the **oldest `in_progress` quest with incomplete work** (FIFO by `createdAt`), so before **every**
flow set every other non-terminal quest to `abandoned` (`mcp__dungeonmaster__modify-quest` `status: 'abandoned'`) so
your seeded quest is the only active one. (Wiping the quests dir in §1 already gives a clean slate for the first flow.)

### 4. Browser on the execution view

Open `http://dungeonmaster.localhost:4801/...` for the seeded quest. Many assertions are about what the UI *streams*.
**Never refresh** — it kills live agents and corrupts state. If something doesn't appear live, that is the bug.

### 5. (Ward paths) deterministic ward via a real, ward-catchable defect

`run-ward` shells out to `dungeonmaster-ward` and routes recovery on the **real exit code** inside
`quest-run-ward-broker` (it can't be staged by editing `quest.json`). The repo is green, so:

- **Ward happy paths (exit 0 → operation item complete → advance):** just run real `run-ward` against the clean tree.
- **Ward failure paths (exit ≠ 0 → spiritmender + fresh ward):** **break something real ward catches**, then run real
  `run-ward`. Introduce a genuine defect in a git-changed source file that ward will flag — a TS type error, an eslint
  violation, or a failing assertion in a colocated `*.test.ts`. `wardMode: 'changed'` scopes to git-changed files, so
  the broken file must be a working-tree change (editing it makes it one). Real ward then exits non-zero and the broker
  appends the spiritmender + fresh ward on that real exit code. **Restore the file** (`git checkout -- <path>`) once the
  case is asserted so the tree is clean for the next run.
- **Fallback:** if you can't get a changed file in front of ward, assert ward-fail recovery via
  `quest-run-ward-broker.test.ts` (the append/block lives inside the broker, keyed on the real exit code).

### 6. The seeding technique (the crux)

**MCP `modify-quest` strips `workItems`, `wardResults`, `designPort`, `pausedAtStatus`** (`quest-handle-responder.ts`),
AND the input allowlist forbids `operations` at `in_progress`, so you can't stage work-item/operation states through the
MCP. You stage them by **editing the ready-made `quest.json` directly on disk** — which bypasses the status-transition
gates and the input allowlist, so you can drop the quest into any state:

1. `mcp__dungeonmaster__create-quest({ userRequest, questType? })` mints a schema-valid quest at status `created` with a
   seeded `chaoswhisperer` work item AND a seeded **plan** operation item the work item links (`operations/<planId>`).
   Note the returned `questId` (+ `guildSlug: "codex"`).
2. Open the ready-made file: `.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/<questId>/quest.json`.
3. Patch `"status": "in_progress"`, replace `operations[]` with the ledger for the state you want, and replace
   `workItems[]` with work items that each link **exactly one** `operations/<id>` (see "Seeding reference").
4. Save. MCP `get-next-step` sees it immediately (reads disk fresh each scan); the web reflects a raw disk seed within
   ~3s (no outbox event fires for a direct write).

> **Two non-obvious constraints (both will bite you — see `quest-lifecycle.md` for the why):**
> 1. **`get-agent-prompt` resolves the work item's linked operation item (`operations/<id>`) and interpolates its scope.
>    If that ref points at an operation item not present in `operations[]`, it can't build the prompt.** So a seeded work
>    item is only dispatchable if the matching operation item exists in the ledger. STRICT 1:1: every work item links
>    exactly one operation item, and each operation item is worked by exactly one work item.
> 2. **Every `get-agent-prompt`/`signal-back`/`run-ward` mutation re-runs save-invariants on the whole quest.** A
>    malformed seed makes the mutation silently fail and the work item never leaves `pending`. The invariants are lenient
>    (no duplicate ids; `dependsOn` resolve; `relatedDataItems` reference valid collections + existing ids; DAG) — the
>    minimal shapes below satisfy them.

### 7. Seeding reference — minimal objects that pass save-invariants

Paste these into `quest.json`, swapping ids as needed. Operation-item ids are UUIDs (branded `OperationItemId`); the
`related-data-item-contract` regex is `^(operations|wardResults|flows)/[a-z0-9-]+$`. **An `operational` flow needs no
dev server** — use it so a seeded flowrider/siegemaster doesn't trigger `.dungeonmaster.json` dev-server resolution.

```jsonc
// quest.operations[] — the ledger; each item is worked by exactly one work item
"operations": [
  { "id": "11111111-1111-1111-1111-111111111111", "role": "codeweaver", "text": "smoketest: build core adapter", "status": "pending", "locked": false },
  { "id": "22222222-2222-2222-2222-222222222222", "role": "ward", "text": "ward (changed)", "status": "pending", "locked": true, "wardMode": "changed" },
  { "id": "33333333-3333-3333-3333-333333333333", "role": "flowrider", "text": "author flow suite", "status": "pending", "locked": true }
],
// quest.workItems[] — one session per operation item, strict 1:1 link
"workItems": [
  { "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "codeweaver", "status": "pending", "spawnerType": "agent",   "dependsOn": [],                                       "relatedDataItems": ["operations/11111111-1111-1111-1111-111111111111"], "createdAt": "..." },
  { "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "role": "ward",       "status": "pending", "spawnerType": "command", "dependsOn": ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"], "wardMode": "changed",                                                     "relatedDataItems": ["operations/22222222-2222-2222-2222-222222222222"], "createdAt": "..." }
],
// quest.flows[] — read by flowrider/siegemaster for context; operational → no dev server
"flows": [
  { "id": "flow-1", "name": "smoketest flow", "flowType": "operational", "entryPoint": "cli", "exitPoints": ["done"], "nodes": [], "edges": [] }
]
```

- Seed only the work items you want dispatched next; you do NOT need to pre-seed the whole chain of work items — the
  relay creates the next work item on advance. But every operation item you want the relay to reach must be in
  `operations[]`, and the FIRST actionable one needs a linked work item (or let advance create it via the scan
  self-heal). To test the full chain deterministically, pre-seed the operations ledger AND one work item for the first
  pending item.
- Keep work-item `dependsOn` chained after the prior terminal item (advance does this at runtime; match it when
  hand-seeding).
- Flowrider / Siegemaster self-scope over ALL flows — their work item links `operations/<id>` (NOT a `flows/<id>` ref);
  they read `quest.flows` directly for context.

---

# REFERENCE A — quest.json transition data points

Source of truth for "what value should each field be at each transition." Assert these in `quest.json` (read on disk —
the MCP `get-quest` view strips `workItems`/`wardResults`).

## A1. Operation-item fields (`quest.operations[]`)

| Field      | Enum / type                             | Who writes it & when                                                                                     |
|------------|-----------------------------------------|---------------------------------------------------------------------------------------------------------|
| `status`   | `pending \| in_progress \| complete`    | advance → `in_progress` (when it creates the work item); signal-back/run-ward → `complete`. NO `partial` |
| `role`     | `workItemRoleContract`                  | seeded (Chaos or the relay seed / advance)                                                               |
| `text`     | branded string                          | prose; a continuation is auto-named `"pt N: {text}"` by `operationPtChainTransformer`                    |
| `locked`   | boolean                                 | Chaos/orchestrator-owned items (the plan item + the fixed verify tail) are `locked`; codeweaver = false  |
| `wardMode` | `changed \| full`                       | present only on `role: ward` items; preserved on the `pt N` re-ward                                      |

## A2. Work-item fields (the ones that move)

| Field              | Enum / type                                                         | Seeded    | Who writes it & when                                                                                          |
|--------------------|---------------------------------------------------------------------|-----------|--------------------------------------------------------------------------------------------------------------|
| `status`           | `pending \| queued \| in_progress \| complete \| failed \| skipped` | `pending` | get-agent-prompt → `in_progress`; signal-back → `complete`; run-ward → `complete`/`failed`; block → `skipped` |
| `sessionId`        | uuid (parent)                                                       | absent    | **get-agent-prompt** (identity resolved MCP-side); retained across an orphan resume                          |
| `agentId`          | realAgentId                                                         | absent    | **get-agent-prompt**; retained across an orphan resume                                                       |
| `startedAt`        | ISO ts                                                              | absent    | **get-agent-prompt** (same stamp). NOT set for ward (no get-agent-prompt)                                     |
| `completedAt`      | ISO ts                                                              | absent    | signal-back / run-ward on terminal                                                                           |
| `actualSignal`     | `complete`                                                          | absent    | signal-back on terminal (the sole signal kind)                                                               |
| `errorMessage`     | branded string                                                      | absent    | run-ward red only → `'ward_failed'`. Agents never fail, so no agent sets it                                  |
| `dependsOn`        | uuid[]                                                              | per seed  | advance chains each new work item after the most-recent terminal work item                                   |
| `relatedDataItems` | `(operations\|wardResults\|flows)/<id>[]`                           | per seed  | **exactly one `operations/<id>`** always; run-ward stamps `wardResults/<id>` on the ward item at completion   |
| `resume`           | marker                                                              | absent    | `recover-orphaned-work-items-layer-broker` on an orphaned `in_progress` item (kept `sessionId`)              |
| `retryCount`       | int                                                                 | 0         | bumped on each orphan resume; `≥ slotManagerStatics.orphanRecovery.maxResets` → `blocked`                     |
| `wardMode`         | `changed \| full`                                                   | per seed  | ward items; preserved on the `pt N` re-ward                                                                   |
| `spawnerType`      | `agent \| command`                                                  | per seed  | `command` for ward, `agent` for everything else                                                              |

## A3. Quest status derivation (`workItemsToQuestStatusTransformer`, operation-aware, precedence order)

1. Pre-execution / user-paused / abandoned / **`blocked`** → **unchanged** (nothing implicitly reopens `blocked`).
2. **Never derive `complete` while any operation item is `pending` or `in_progress`** — the "last session finished,
   advance hasn't created the next work item yet" window. This is the no-false-complete invariant.
3. Every work item terminal AND the ledger drained (all operations `complete`) → **`complete`**.
4. Any work item active → **`in_progress`**.
5. Only pending work items remain, all dead-ended on a `failed` dep, ledger drained → **`blocked`**; else
   **`in_progress`**.

> `blocked` is set explicitly by `questBlockOnFailureBroker` (status `blocked`, pending work items → `skipped`); it
> doesn't wait on derivation. Derivation governs `complete` and the implicit cases.

## A4. Enums + the dependency rule

- **operation-item status:** `pending, in_progress, complete` (no `partial` — a `partial` outcome makes the item
  `complete` and appends a `pt N` continuation).
- **work-item status:** `pending, queued, in_progress, complete, failed, skipped`.
    - `isActive` = {queued, in_progress}. `isTerminal` = {complete, failed, skipped}.
    - **`satisfiesDependency` = {complete, failed}** — **`skipped` does NOT satisfy** (a skipped dep dead-ends its
      dependents permanently).
- **a work item is READY** when `status === pending` AND every `dependsOn` id is `complete` or `failed`.
- **signal-back:** `signal: 'complete'` is the SOLE kind. The outcome is `operationStatus: 'done' | 'partial'`
  (`failed` is explicitly rejected).
- **quest status (15):** `created, explore_flows, review_flows, flows_approved, explore_observables,
  review_observables, approved, explore_design, review_design, design_approved, in_progress, paused, blocked, complete,
  abandoned`. Terminal = {complete, abandoned}. **`blocked` is NOT terminal** (resumable → in_progress). There are NO
  `seek_*` statuses.
- **roles:** `codeweaver, ward, flowrider, siegemaster, lawbringer, blightwarden, spiritmender, pesteater` (+ chat
  `chaoswhisperer`/`glyphsmith`; + the 5 `blightwarden-*-minion` names, which are parent-summoned sub-agents, NOT work
  items).
- **ward retry budget** = `slotManagerStatics.ward.maxRetries` (the red-ward chain of a `wardMode` since the last green
  of that mode). Verify-role `pt N` chains = `slotManagerStatics.<role>.maxAttempts`.

## A5. signal-back outcome application (assert the `quest.json` result)

`quest-handle-signal-back-responder`, in ONE atomic `questOperationsUpdateBroker` persist, marks the work item terminal
(`complete`, `completedAt`, `actualSignal`), resolves the linked operation item, then applies the outcome:

| operationStatus       | result in `quest.json`                                                                                                                    |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `done` (or absent)    | operation item → `complete`; advance creates the work item for the next `pending` operation item                                          |
| `partial`             | operation item → `complete` AND a `"pt N: {text}"` continuation appended immediately after it (same role, `locked`/`wardMode` preserved); advance creates a fresh work item for it. Locked role → the `pt N` chain is bounded by `slotManagerStatics.<role>.maxAttempts`; spent → `blocked`. Unlocked codeweaver → unbounded |

The handler is **idempotent**: a redelivered signal for an already-terminal work item is a no-op (no second `pt N`, no
second work item).

## A6. run-ward routing (ward only, inside `quest-run-ward-broker`, keyed on the real exit code)

- **Exit 0 (green):** ward operation item → `complete`; ward work item → `complete`; `wardResults[]` ref appended;
  `relatedDataItems += wardResults/<id>`; advance → the next role (never another ward).
- **Exit ≠ 0 (red), budget remains:** ward work item → `failed` + `errorMessage: 'ward_failed'`; ward operation item →
  `complete`; a `spiritmender` operation item PLUS a fresh ward operation item (`pt N`, same `wardMode`) appended after
  it; `wardResults[]` ref (exitCode ≠ 0); advance → the **spiritmender** is next (never a ward back-to-back), then the
  fresh ward re-verifies.
- **Exit ≠ 0 (red), budget spent:** the red-ward chain of this `wardMode` since the last green of the mode reached
  `slotManagerStatics.ward.maxRetries` → `questBlockOnFailureBroker` (ward item `failed`, pending work items →
  `skipped`, quest `blocked`) — no further fix loop.

---

# REFERENCE B — UI assertion anchors

Verify in the browser **wherever it makes sense**. Root: `data-testid="execution-panel-widget"`. Tab bar:
`execution-panel-tab-execution` ("EXECUTION"), `execution-panel-tab-spec` ("QUEST SPEC"). The execution panel is a
**flat** list of work-item rows (no floor headers) plus the operations ledger.

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

Rows render in `workItems` order; each row name is its linked operation item's text. Click `execution-row-header` to
expand.

| Field / transition               | testid                                            | shows                              | notes                                                    |
|----------------------------------|---------------------------------------------------|------------------------------------|----------------------------------------------------------|
| role                             | `execution-row-role-badge`                        | `[CODEWEAVER]` etc. (uppercased)   | ward badge is warning-colored                            |
| status                           | `execution-row-status-badge`                      | label from B1                      | live                                                     |
| ward exit code                   | `execution-row-ward-result`                       | `Ward exit code: {n}` (+ `(mode)`) | green if 0 else red — see B3                             |
| ward detail                      | `execution-row-ward-detail`                       | per-failure lines                  | HTTP fetch — see B3                                      |
| error                            | `execution-row-error-message`                     | `Error: ...`                       | populates for a failed **ward** (`ward_failed`)          |
| agent transcript                 | inside `execution-row-expanded` (chat-entry-list) | text/tool rows/sub-agent chains    | auto-expands while `in_progress`                         |

## B2b. Operations ledger (rendered in BOTH the execution panel AND the QUEST SPEC tab)

`data-testid="OPERATIONS_LEDGER"`, rows `OPERATIONS_LEDGER_ROW` — each row is `OPERATIONS_LEDGER_ROW_MARKER` (status
marker) + `OPERATIONS_LEDGER_ROW_ROLE` (role) + `OPERATIONS_LEDGER_ROW_TEXT` (text) + `OPERATIONS_LEDGER_ROW_WARD_MODE`
(`(changed)`/`(full)` on ward rows). The ledger grows live as advance appends a `pt N` / spiritmender / fresh ward.

Status bar: `execution-status-bar-layer-widget` → `EXECUTION — {completedOps}/{totalOps} OPERATIONS`, or `EXECUTION —
AWAITING PLAN` when the ledger is empty (pre-seed). Pause/Resume: `EXECUTION_PAUSE_BUTTON` (visible iff
`isAnyAgentRunning(status)`), `EXECUTION_RESUME_BUTTON` (visible iff `isQuestResumable(status)` = {paused, blocked}) —
keyed on real `quest.status`.

## B3. Ward result rendering (two stages, both must hold)

**Stage 1 — exit-code row (live via WS):** a `[WARD]` row shows `execution-row-ward-result` ("Ward exit code: N") ONLY
when **(a)** the ward work item has `relatedDataItems: ['wardResults/<id>']`, **(b)** a matching `wardResults[]` entry
with that id exists on the quest, AND **(c)** the row renders in the normal work-item-row branch. Assert the exit-code
**text**, not just visibility.

**Stage 2 — detail breakdown (HTTP, on mount):** `execution-row-ward-detail` fetches GET
`/api/quests/:questId/ward-results/:wardResultId` when the row's detail widget mounts. It renders **nothing** while
loading, on fetch error, OR when there are zero failures. So a green ward shows only the exit-code line; assert the
detail breakdown only for a known-**failing** ward run.

## B4. Agent-log grouping (the "duplicate rows show the same log" surface — two distinct keys)

- **Which transcript a row shows = `workItemId`.** The binding keeps `entriesByWorkItem` keyed by work-item id; a row
  resolves `entriesByWorkItem.get(wi.id) ?? (wi.sessionId ? entriesBySession.get(wi.sessionId) : []) ?? []`. Sub-agents
  dispatched under one parent session **share one parent `sessionId`** — if a row falls back to the session bucket it
  shows the **merged** logs → **duplicate identical logs across rows**. Scope to `execution-row-layer-widget`.nth(N) and
  assert each row's transcript is **distinct**.
- **Sub-agent chain collapse inside one transcript = `toolUseId`** (`collectSubagentChainsTransformer`). Chain header
  `SUBAGENT_CHAIN_HEADER` (`▾ SUB-AGENT "{desc}" ({n} entries)`), group `SUBAGENT_CHAIN`. A minion (codeweaver /
  lawbringer / blightwarden) renders as a chain inside its parent's row.

## B5. NOT observable in the UI — assert ONLY in `quest.json`

- **`skipped` work items are hidden** in the active render branches. A BLOCK shows the failed row as `FAILED` and its
  skipped siblings **vanish** — assert skipped in `quest.json`.
- **`blocked` does not render the terminal banner** (`execution-panel-terminal-banner` uses `isTerminal` = {complete,
  abandoned} only). A blocked quest keeps the status bar + the RESUME button; verify `blocked` via `quest.json` status +
  the failed row.
- `relatedDataItems` linkage, operation-item `locked`, `pausedAtStatus` value, `questType`, and `resume`/`retryCount`
  are not shown as text (only effects are). Assert in `quest.json`.

---

# REFERENCE C — the repeatable probe cycle

> ## ⛔ HARD RULE — DISPATCH EXACTLY WHAT ONE `get-next-step()` RETURNS
> **You may ONLY dispatch what a single `get-next-step()` returns, then wait for it to land before calling
> `get-next-step()` again.** The relay hands you exactly the one session that is ready; you do not pick the next item or
> run ahead of the ledger.
>
> - The relay is **one session at a time.** `questAdvanceBroker` creates ONE work item for the first `pending` operation
>   item and does not create the next until that session's outcome is applied. So `get-next-step` returns exactly one
>   `spawn-agents` entry (or one `run-ward`). **Never add an entry the orchestrator did not return, and never
>   parallel-dispatch different roles** — `signal-back` does not gate on readiness, so a hand-batched pipeline
>   force-completes items out of order and invalidates the run.
> - The ONLY same-role parallelism in the model is **minions a parent summons via the Agent tool** (codeweaver /
>   lawbringer / blightwarden). Those are inside the parent's turn, not separate `get-next-step` dispatches — you never
>   dispatch them.
> - **Operationally:** ONE `get-next-step` → dispatch its single returned entry → wait → assert `quest.json` →
>   `get-next-step` again. Drive strictly off the returned `workItemId`; never off the seed array or a remembered id.
>   When in doubt, do one tool call per turn.

Every step of every flow is the same six beats:

1. **CALL** `get-next-step()`.
2. **ASSERT NextStep** JSON: `type` (`spawn-agents`/`run-ward`/`idle`), the single `agents[].role` + `workItemId` (or
   ward `mode`). Record raw JSON.
3. **DISPATCH** the stub agent per the recipe below (or `run-ward` for a ward step) with the test-case `operationStatus`.
4. **ASSERT quest.json** (on disk):
    - after get-agent-prompt: work item `in_progress` + non-empty `sessionId`+`agentId`+`startedAt`; its operation item
      `in_progress` (if these stay empty, identity resolution failed — a finding);
    - after signal-back: work item terminal (`complete` + `completedAt` + `actualSignal`); operation item `complete`;
      on `partial`, a `pt N` continuation appended; the NEXT operation item's work item created by advance;
    - after run-ward: ward work item + operation item per A6 (green → both `complete` + `wardResults` ref; red →
      `failed`/`complete` + spiritmender + fresh ward, or `blocked` when the budget is spent);
    - confirm strict 1:1: no second work item minted for one operation item.
5. **ASSERT web** (no refresh):
    - the row status badge shows the right **label** (B1): `RUNNING` on dispatch → `DONE`/`FAILED` on outcome;
    - the agent's log renders **under its own row**; for a parent with minions, the minion renders as a chain (B4);
    - **work-item insertions appear live** (advance's next row, a `pt N` continuation, a spliced spiritmender/fresh ward)
      within a couple seconds; the operations ledger (B2b) grows;
    - ward rows show `Ward exit code: N` (+ detail for a failing run) (B3).
6. **ADVANCE** (back to beat 1) until terminal.

### Stub-agent dispatch recipe

Dispatch one real `Task()` for the single entry the current `get-next-step` returned — nothing else. A real `Task()`
(not a faked in-process call) is required so `get-agent-prompt` can resolve identity via `_meta.claudecode/toolUseId` →
`subagents/agent-*.jsonl`.

```
You are a SMOKETEST STUB AGENT. Do NOT do real work, do NOT read/write source files.
1. Call mcp__dungeonmaster__get-agent-prompt({ agent:"<role>", workItemId:"<id>", questId:"<id>" }).
2. Paste the FULL prompt text you received into your final report.
3. Call mcp__dungeonmaster__signal-back({ questId:"<id>", workItemId:"<id>", signal:"complete",
   operationStatus:"<done|partial>" }).
4. Report: the prompt you got, the operationStatus you sent, any error from either call.
```

Optionally pre-seed `smoketestPromptOverride` (trivial prompt) + `smoketestExpectedSignal`.

### Gotchas to keep front of mind

- **G1 — `run-ward`'s param is `mode` (`'changed' | 'full'`), NOT `wardMode`.** The work-item/operation-item field is
  spelled `wardMode`, but the **MCP tool argument is `mode`**. Passing `wardMode` errors `Unrecognized key(s): wardMode`
  and the ward never runs. Always call `run-ward({ questId, workItemId, mode })`.
- **G2 — `signal: 'complete'` is the sole kind; the outcome is `operationStatus`.** There is no `failed`/`failed-replan`
  signal. `operationStatus: 'partial'` is the "more remains" outcome; the orchestrator continues it as a `pt N` item.
- **G3 — get-agent-prompt stamping is identity-resolved.** No identity → no `in_progress`/`sessionId`/`agentId` stamp.
  Verify the stamp happened.
- **G4 — get-agent-prompt needs the linked operation item present.** A seeded work item whose `operations/<id>` has no
  matching ledger entry can't have its prompt built. Seed the operation item.
- **G5 — skipped rows vanish in the UI; blocked shows no banner** (B5). Assert those in `quest.json`.
- **G6 — ward detail renders null** while loading / on error / when green. Only assert the breakdown for a failing ward.
- **G7 — never parallel-dispatch different roles; one logical step per turn; act only on echoed ids.** This is the
  ⛔ HARD RULE above, restated because violating it is the single most common way a run goes bad:
    - `signal-back` does not gate on readiness, so concurrently dispatching e.g. `flowrider`+`siegemaster`+`lawbringer`
      force-completes them out of ledger order — the end-state can *look* complete while never having exercised each
      advance. The relay is one session at a time; there is no legal cross-role parallel dispatch.
    - **Hallucinated / remembered ids → cancelled batch + possible corruption.** Use ONLY the `questId`/`workItemId`
      echoed back by the immediately-preceding tool result — never one retyped from the seed array or memory. When in
      doubt, do one tool call per turn.

---

# Flow 1 — Happy path relay (feature, pre-seeded)

Pre-seed the full operations ledger + the first work item, then drive the relay one session at a time to `complete`.
This mirrors the state a quest is in right after Start Quest seeded the relay.

### Seed

`create-quest` (feature), then patch `quest.json`: `status: in_progress`, an `operations[]` ledger with a codeweaver
item + the verify tail as operation items (all `locked` except the codeweaver), one `flows[]` operational flow, and a
FIRST work item for the codeweaver operation item:

```jsonc
"operations": [
  { "id": "op-cw",    "role": "codeweaver",   "text": "smoketest: core adapter", "status": "pending", "locked": false },
  { "id": "op-ward1", "role": "ward",         "text": "ward (changed)",          "status": "pending", "locked": true, "wardMode": "changed" },
  { "id": "op-flow",  "role": "flowrider",    "text": "author flow suite",       "status": "pending", "locked": true },
  { "id": "op-siege", "role": "siegemaster",  "text": "manual QA + review suite", "status": "pending", "locked": true },
  { "id": "op-law",   "role": "lawbringer",   "text": "standards review (diff)",  "status": "pending", "locked": true },
  { "id": "op-blight","role": "blightwarden", "text": "cross-cutting audit",      "status": "pending", "locked": true },
  { "id": "op-ward2", "role": "ward",         "text": "ward (full)",             "status": "pending", "locked": true, "wardMode": "full" }
],
"workItems": [
  { "id": "wi-cw", "role": "codeweaver", "status": "pending", "spawnerType": "agent", "dependsOn": [], "relatedDataItems": ["operations/op-cw"], "createdAt": "..." }
],
"flows": [
  { "id": "flow-1", "name": "smoketest flow", "flowType": "operational", "entryPoint": "cli", "exitPoints": ["done"], "nodes": [], "edges": [] }
]
```

(Use real UUIDs for the ids. Seed only the FIRST work item — the relay creates each subsequent work item on advance.)

### Probe sequence

| # | get-next-step                               | dispatch                 | quest.json                                                                                                   | web                                                       |
|---|---------------------------------------------|--------------------------|--------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| 1 | `spawn-agents`, 1× `codeweaver` (`wi-cw`)   | stub `done`              | `wi-cw`: in_progress(+sessionId/agentId/startedAt) → complete; `op-cw` → complete; advance creates a `ward` work item for `op-ward1` | `RUNNING`→`DONE`; ledger row `op-cw` marks complete       |
| 2 | `run-ward`, `mode: changed`                 | `run-ward` (real, green) | ward work item complete; `op-ward1` complete; `wardResults[]` +1; ward `relatedDataItems` gains `wardResults/<id>`; advance → `flowrider` work item | `Ward exit code: 0 (changed)`; no detail (green)          |
| 3 | `spawn-agents`, 1× `flowrider`              | stub `done`              | flowrider work item complete; `op-flow` complete; advance → `siegemaster`                                     | `RUNNING`→`DONE`                                           |
| 4 | `spawn-agents`, 1× `siegemaster`            | stub `done`              | `op-siege` complete; advance → `lawbringer`                                                                   | `RUNNING`→`DONE`                                           |
| 5 | `spawn-agents`, 1× `lawbringer`             | stub `done`              | `op-law` complete; advance → `blightwarden`                                                                   | `RUNNING`→`DONE`                                           |
| 6 | `spawn-agents`, 1× `blightwarden`           | stub `done`              | `op-blight` complete; advance → `ward(full)` work item                                                        | `RUNNING`→`DONE`                                           |
| 7 | `run-ward`, `mode: full`                    | `run-ward` (real, green) | ward complete; `op-ward2` complete; **no pending operation item → quest derives `complete`**                 | terminal banner; all rows `DONE`; `EXECUTION — 7/7 OPERATIONS` |
| 8 | `idle` (~25s long-poll)                     | —                        | no incomplete work                                                                                           | —                                                         |

**PASS:** quest `complete`, every field asserted in `quest.json` and mirrored live (correct labels, distinct logs, ward
exit-code shown, ledger drained), terminal banner present.

> **get-agent-prompt will fail** at step 1/3/4/5/6 if the linked operation item isn't in `operations[]` — that's the
> missing-seed failure mode (§6 / G4), not an orchestration bug. Confirm the operation items are present before
> dispatching.

---

# Flow 2 — Sad paths (partial → pt N, the verify fixpoint)

None of these is a failure. Each keeps the quest `in_progress` and moves it forward.

### 2A — Codeweaver `partial` → pt N (unbounded)

Seed a single codeweaver operation item + work item (as Flow 1 step 1). Dispatch the stub with
`operationStatus: 'partial'`.

| # | get-next-step                     | dispatch      | assert                                                                                                            |
|---|-----------------------------------|---------------|------------------------------------------------------------------------------------------------------------------|
| 1 | `spawn-agents`, 1× `codeweaver`   | stub `partial`| work item terminal (`complete`); `op-cw` → `complete`; a `"pt 2: {text}"` operation item appended; advance creates a FRESH codeweaver work item for it (new `execution-row-layer-widget` row live; ledger grows) |
| 2 | `spawn-agents`, 1× `codeweaver` (pt 2) | stub `done` | `op-cw pt 2` → `complete`; advance moves on. **Strict 1:1** — assert NO operation item ever had two work items    |

Repeat `partial` several times to confirm the codeweaver `pt N` chain is **unbounded** (unlocked role — never blocks).

### 2B — Verify role `partial` → bounded fixpoint

Seed so a locked verify role (e.g. `flowrider`) is next. Dispatch `partial` repeatedly.

| # | get-next-step                  | dispatch       | assert                                                                                                            |
|---|--------------------------------|----------------|------------------------------------------------------------------------------------------------------------------|
| 1 | `spawn-agents`, 1× `flowrider` | stub `partial` | `op-flow` complete; a `pt 2` flowrider item appended; a fresh flowrider work item runs (the fixpoint)             |
| … | repeat `partial`               | stub `partial` | the `pt N` chain grows until it reaches `slotManagerStatics.flowrider.maxAttempts` → **`blocked`** (no more append) |
| — | (or) `done` on any pass        | stub `done`    | convergence — advance moves to `siegemaster`. Convergence IS the verdict                                          |

**Critical:** confirm the redelivery no-op (G/A5) — call `signal-back` twice for the same terminal work item; the second
must NOT mint a second `pt N` or a second work item.

---

# Flow 3 — Ward, block, and resume

### 3A — Ward red → spiritmender operation item → re-ward (no ward loop)

Seed so a `ward(changed)` item is next. Break a real ward-catchable defect in a git-changed file (§5), then run real
`run-ward`.

| # | get-next-step               | dispatch                | assert                                                                                                                                         |
|---|-----------------------------|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | `run-ward`, `mode: changed` | `run-ward` (real, red)  | ward work item `failed` + `errorMessage: ward_failed`; ward operation item `complete`; `wardResults[]` +1 (exitCode 1); a `spiritmender` operation item + a fresh `ward` operation item (`pt N`, same `wardMode`) appended AFTER it; advance → the **spiritmender** is next | UI: ward row `FAILED` + `Ward exit code: 1 (changed)` + detail breakdown; new spiritmender + fresh ward rows appear live |
| 2 | `spawn-agents`, 1× `spiritmender` | stub `done`       | spiritmender operation item complete; advance → the fresh ward re-runs                                                                          |
| 3 | `run-ward`, `mode: changed` | `run-ward` (real, green — restore the file first) | fresh ward operation item complete; advance → the next role                                                        |

### 3B — Ward budget exhausted → blocked

Repeat 3A's red ward without fixing until the red-ward chain of the `wardMode` reaches `slotManagerStatics.ward.maxRetries`.

| # | get-next-step               | dispatch               | assert                                                                                                                      |
|---|-----------------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------|
| N | `run-ward`, `mode: changed` | `run-ward` (real, red) | budget spent → `questBlockOnFailureBroker`: ward item `failed`, every pending work item → `skipped`, quest `blocked`; nothing appended | next `get-next-step` → `idle`; UI: `FAILED` row, skipped hidden, no banner, RESUME visible |

### 3C — Orphan → resume (no restart, no duplicate)

Seed a work item at `in_progress` (as if a session was mid-flight), then call `get-next-step`.

- **Assert:** `recover-orphaned-work-items-layer-broker` flips the orphaned `in_progress` work item back to `pending`,
  **keeps** its `sessionId`/`agentId`, sets a `resume` marker, and bumps `retryCount`. Node/UI dispatch then resumes the
  retained Claude session (`claude --resume`). **No duplicate work item** (strict 1:1). A crash-looping session reaching
  `slotManagerStatics.orphanRecovery.maxResets` → `blocked`.
- (The MCP `/dumpster-launch` Task path fresh-spawns rather than resumes — its `sessionId` is the parent loop session.)

---

# Prompt-walk pass (static desk-check)

Verify each agent prompt still gives an LLM enough to do its job — every capability maps to a real, callable thing.
**Static desk-check only** — read and trace; do not execute.

### Targets

Every static under `packages/orchestrator/src/statics/` ending in `-prompt` or `-minion`: `codeweaver-prompt`,
`flowrider-prompt`, `siegemaster-prompt`, `lawbringer-prompt`, `blightwarden-prompt`, `spiritmender-prompt`,
`pesteater-prompt`, `glyphsmith-prompt`, `dumpster-create-prompt`, `dumpster-hunt-prompt`; the minions
`codeweaver-minion`, `lawbringer-minion`, the 5 `blightwarden-*-minion`, `chaoswhisperer-gap-minion`.

### Procedure (per prompt)

1. **Read** the static.
2. **Enumerate the role's required capabilities** (e.g. Codeweaver: read its operation item + git + ledger, verify it's
   the right next step, dispatch + verify `codeweaver-minion`s, edit inline, commit a prose handoff, signal
   `done`/`partial`; Flowrider: self-scope all flows, author the suite, own its dev server, signal `done`/`partial`;
   Spiritmender: read the failed ward result + detail, fix, signal `done`/`partial`; Blightwarden: dispatch the 5
   report-only minions, judge `planningNotes.blightReports`, clean up, signal `done`/`partial`).
3. **Trace each capability to a real mechanism:** does the prompt name the exact MCP tool / command / file path /
   static, and does it still exist? (`discover` to confirm — don't trust the prompt.) Are referenced signals/fields
   valid against current contracts (`signal-back` = `complete` + `operationStatus`; agents never write `operations`;
   `modify-quest` at `in_progress` limited to `planningNotes.blightReports`)? Any holes — a value never provided in the
   interpolated scope, a tool the role can't call, a file read before it's written, stale wording?
4. **Record findings:** capabilities covered ✓, capabilities with a hole ✗ (name the missing link), stale/ambiguous
   wording. A hole is a real bug — the agent stalls or improvises at runtime.

---

# Findings log + execution order

Keep `/tmp/smoke-mcp-notes.md`: per probe, the role, **expected vs observed** for the `NextStep` JSON, the `quest.json`
mutation, and the web view; quest/operation/work-item ids; screenshots for any web discrepancy. Classify blocking (wrong
next step, mutation didn't land, strict-1:1 violated, UI mis-rendered) vs non-blocking vs prompt-walk hole. On a real
bug, use the Fix Agent / TDD-First / Bug Procedure from `playbook/smoketest-orchastrator.md`; the orchestrator does not
edit source directly. Session-level running state goes in `playbook/smoketest-mcp-handoff.md`.

**Order:** (1) setup — build, **wipe `.dungeonmaster/guilds/21523917-…/quests`**, `npm run prod`, browser on `:4801`;
(2) Flow 1 (pre-seeded relay) end to end; (3) Flow 2 (partial → pt N, both bounded and unbounded); (4) Flow 3 (ward red
→ spiritmender, ward budget → block, orphan → resume), clean FIFO before each; (5) prompt-walk; (6) abandon all
smoketest quests, confirm the quest queue is clean.
