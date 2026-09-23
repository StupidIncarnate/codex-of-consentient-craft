# Smoke Test — MCP Orchestration State Machine (family graph + step graph)

A manual, MCP-driven smoke test of the relay. You (an LLM session) play the **dispatcher** for `prompt`-kind steps —
either the `/queue` play button (Node/UI mode, the primary driver) or `/dumpster-launch` (MCP mode). Instead of
running real agents you **seed quest state on disk, call the MCP, assert what comes back, dispatch a stub agent that
just does the MCP handshake, then verify the mutation landed in `quest.json` AND streamed correctly into the web
execution view.**

**This playbook's reach is narrower than the old operations-relay model let it be.** `ward`, `carve`, `repair`,
`commit` and `cleanup` are now `deterministic` steps — code, not a Claude session — and `get-next-step` returns
`{ type: 'run-step', handler, args }` for them. **MCP mode has no tool that can run a `run-step`.** The
`run-ward`/`run-riftcarver` MCP tools still exist, but they take no scope argument and only fire for a work item
with NO step node at all (a hydrated or pre-step-graph quest) — for a quest seeded by today's
`questBuildRelayGraphBroker`, every work item has a step node, so these two tools are unreachable. **This playbook can
drive every `prompt`-kind step by hand** (`plan`, `work`, `review`, `happyWalk`, `adversarial`, `fixHappy`,
`fixAdversarial`, `recipe`, `read`) via a stub `Task()` that calls `get-agent-prompt` → `quest-work` → `signal-back`.
**It cannot drive a `deterministic` step by hand** — verifying `carve`/`repair`/`commit`/`ward`/`cleanup` needs the
real Node/UI dispatcher running, observed through `quest.json` and the web UI, exactly as a real run would exercise
it.

This is a different test from `playbook/smoketest-orchastrator.md` — that one is a heavyweight full-live UI run
(browser → ChaosWhisperer → Start Quest → real agents). This one is a surgical state-machine probe: it does **not**
build a real spec or write real code. It proves the *plumbing* — `get-next-step` math, `quest-work`'s marks and
outcome, `signal-back`'s terminal handoff, the router's re-cut/complete/block decisions, prompt delivery, identity
stamping, ward-result rendering, and live web streaming — behaves correctly for every step of every family it can
reach.

> **Why this exists.** Almost every orchestration decision reachable from a `prompt` step is reachable through the
> MCP. The bugs that only show up when the relay runs — wrong `get-next-step` output, a scope that never advances, a
> re-cut batch minted against the wrong units, ward results not showing in the UI, duplicate rows rendering the same
> agent log — a single LLM can exercise deterministically by driving the MCP directly and watching both `quest.json`
> and the browser.

> **Prerequisite — read `playbook/quest-lifecycle.md` first.** It's the soup-to-nuts model of how a quest is created
> and moves (create → spec → Start Quest → the family graph + step graph relay → complete), and
> `docs/quest-role-paths.md` for the exact step table of any one family. This doc assumes that understanding; without
> it the seeding rules below won't make sense.

When a probe finds a real bug, switch to the **Fix Agent Launch Protocol**, **TDD-First Fix Process**, and **Bug
Procedure** in `playbook/smoketest-orchastrator.md` — those rules are shared and unchanged.

---

## How the system works (quick recap — full model in `quest-lifecycle.md` and `docs/quest-role-paths.md`)

Execution is a relay over **the family graph** (`riftcarver → codeweaver → flowrider → siegemaster → wardFull →
@complete`) and, inside each scope, **the step graph** (`agentFlowStatics[family].steps`). Three actors:

1. **Dispatcher** (here: you) — polls `get-next-step()` → `Task()` (a `prompt` step) / Node-mode-only for a
   `deterministic` step → await → repeat.
2. **The MCP stdio child** — exposes the tools; quest tools route to the orchestrator via `orchestrator*Adapter`s.
3. **The orchestrator service** — owns `quest.operations[]` (one item per SCOPE) and `quest.workItems[]` (one item
   per STEP session, or per piece inside a parallel step), and all "what runs next" math. Reads `quest.json` fresh
   from disk every scan; never spawns Claude itself.

The closed loop, per `prompt`-kind step:

```
seed quest.json (status: in_progress, operations[...] + ONE work item at that scope's current step)  ← you, on disk
        │
        ▼
get-next-step()  ── MCP ──►  orchestrator scans quests (FIFO oldest), returns NextStep
        ▲                            │  (spawn-agents for a prompt step; run-step for a deterministic one — Node/UI only)
   assert NextStep ◄─────────────────┘
        │
        ▼
Task(stub agent)  ──►  get-agent-prompt(role, workItemId, questId)
        │                    │  ← flips the work item pending→in_progress, stamps sessionId+agentId,
        │                    │     serves the STEP's own prompt (agentFlowStatics[family].steps[step].prompt)
        │              quest-work(questId, workItemId, { kind: 'observations', observations: [...] })
        │                    │  ← marks every assigned unit met/cant-meet/unmet, with evidence
        │              quest-work(questId, workItemId, { kind: 'outcome', word, reason })
        │                    │  ← the step's own classification: done | unmet | empty | wall
        │              signal-back(questId, workItemId, signal: 'complete')
        │                    │  ← marks the work item terminal; the ROUTER (not the session) decides what's next
        ▼                    ▼
assert quest.json fields    assert web execution view (status badge labels, distinct per-row logs,
(exact values)              ward exit-code + detail, operations ledger + new rows appear live)
        │
        ▼
back to get-next-step()  (advance / route)
```

**There is no failure signal.** `signal: 'complete'` is the sole signal kind; the session's own verdict on its run
rides on the separate `quest-work` `outcome` payload (`done | unmet | empty | wall`), recorded BEFORE `signal-back`.
The router reads that record on the next scan and decides: re-cut a batch (`unmet`), complete the scope (`done`/
`empty`, once every work item at the step is terminal), or halt (`wall`). **The orchestrator applies it server-side —
authoritative, because agents never write the ledger.**

**One gate can refuse the whole handshake: the unmarked-unit gate.** `signalGateTransformer` refuses `signal-back`
while any of the work item's `assignedUnitIds` carries no `observations[]` entry. A mark's VALUE is irrelevant — only
the absence of an entry counts.

### Quest data transport to the web (matters for every UI assertion)

```
quest.json → questPersistBroker → event-outbox.jsonl ("quest-modified")
   → server outbox watcher loads the FULL quest → wsEventRelayBroadcastBroker → WS "quest-modified" {questId, quest}
   → web webSocketChannelState → useQuestChatBinding (q.id === questId) → setQuest() → ExecutionPanelWidget
```

**The entire quest object — status, every operation item, every work item's fields, wardResults, and work-item
INSERTIONS (a re-cut batch, the next family's scopes) — arrives live over the single WS `quest-modified` broadcast.
No HTTP refetch.** The **only** HTTP fetch in the execution view is the **ward-result detail breakdown** (GET
`/api/quests/:questId/ward-results/:wardResultId`).

> **Seed visibility:** a direct `quest.json` edit (your seed) bypasses `questPersistBroker`, so **no outbox event
> fires** — the web picks it up only via a ~3s fallback poll. MCP `get-next-step` reads disk fresh, so it sees the
> seed immediately. Every *subsequent* mutation you cause through MCP tools goes through the orchestrator's own
> update broker → outbox → web updates ~instantly.

### The relay shape — identical for both quest types, and there is no separate "ward" ledger row

- **feature** (`questType: feature`): the intake role (ChaosWhisperer) authors NO ledger at all — `operations` is
  off its `modify-quest` allowlist. Start Quest mints ONLY the entry family's scopes
  (`familyScopesMintTransformer({ family: 'riftcarver' })` — one scope). `codeweaver`'s scopes (one per
  PACKAGE×FLOW cell) are minted when riftcarver's `done` routes there; `flowrider`'s (one per RUNTIME flow) when
  codeweaver's last cell completes; `siegemaster`'s (one per flow) when flowrider's last scope completes;
  `wardFull`'s ONE whole-quest scope when siegemaster's last scope completes.
- **bug-hunt** (`questType: bug-hunt`): Start Quest mints the SAME family graph — the only difference is the intake
  role (`bughunt` instead of `chaoswhisperer`, driven by `/dumpster-hunt`). Its spec shape is ONE FLOW PER BUG,
  forking into `ACTUAL:`/`EXPECTED:` terminal nodes with observables on the `EXPECTED:` side; each becomes a failing
  test written by the codeweaver scope that owns the package the fix lands in.

**`ward` is NOT its own operation item any more.** Every family that changes code (`codeweaver`, `flowrider`,
`siegemaster`) carries its OWN `ward` step as the LAST step of its OWN step graph — one codeweaver cell runs
`plan → work → review → commit → ward` inside ONE scope, not four separate ledger rows. `wardFull` is the one family
whose ENTIRE scope is a bare ward gate (`args: []`) over the whole monorepo, reached once every other family has
drained. There is no `wardMode` field on the OPERATION ITEM any more — a family's own `ward` step carries
`args: ['--committed', '--uncommitted']` and `wardFull`'s carries `args: []`, passed to the handler verbatim. The
field survives on the `WardResult` ref each run appends to `quest.wardResults[]` (`wardMode?: 'committed' | 'full'`)
purely to label WHICH kind of run produced it for display — see B3.

Every `plan`/`work`/`review`/`happyWalk`/`adversarial`/`fixHappy`/`fixAdversarial` step is an ORDINARY
router-dispatched session — there is no operator layer above a step and no sub-agent it dispatches to make the edit
or grade the pass. `get-agent-prompt` resolves `agentFlowStatics[family].steps[step].prompt` directly
(`codeweaver-worker`, `codeweaver-reviewer`, `siege-happy-walker`, …); dispatching the bare role name
(`codeweaver`/`flowrider`/`siegemaster`) throws.

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
> `"No guild registered for current directory…"` when no guild matches the cwd.

### 2. Confirm MCP ↔ server ↔ browser share the prod home

Sanity check: `mcp__dungeonmaster__list-guilds` returns the `codex` guild, and after your first `create-quest`,
`mcp__dungeonmaster__list-quests` returns that quest. If list-quests is empty, the MCP child's `DUNGEONMASTER_HOME`
isn't `<repo>/.dungeonmaster` — stop and fix the `.mcp.json` wrapper before proceeding.

### 3. The guild + clean FIFO

`guildId = 21523917-83f7-4e23-a6de-8db1cae2ad96`; `create-quest` returns `guildSlug: "codex"`; quests land under
`.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/<questId>/quest.json`.

`get-next-step` picks the **oldest `in_progress` quest with incomplete work** (FIFO by `createdAt`), so before **every**
flow set every other non-terminal quest to `abandoned` (`mcp__dungeonmaster__modify-quest` `status: 'abandoned'`) so
your seeded quest is the only active one.

### 4. Browser on the execution view

Open `http://dungeonmaster.localhost:4801/...` for the seeded quest. Many assertions are about what the UI *streams*.
**Never refresh** — it kills live agents and corrupts state. If something doesn't appear live, that is the bug.

### 5. (Ward paths) deterministic ward via a real, ward-catchable defect — Node/UI mode only

Ward is a `deterministic` step now, so exercising it means running the REAL Node/UI dispatcher (the `/queue` play
button), not a hand-driven MCP call. The repo is green, so:

- **Ward happy path (exit 0 → step's `done` → scope routes onward):** let the dispatcher run `ward` against a clean
  tree.
- **Ward failure path (exit ≠ 0 → `unmet` → `repair` → `ward` re-runs):** **break something real ward catches** in a
  git-changed source file (a TS type error, an eslint violation, a failing `*.test.ts`), then let the dispatcher run
  `ward` for real — routing is keyed on ward's own exit code inside `stepHandlerWardBroker`, not something you can
  stage by editing `quest.json`. **Restore the file** once the case is asserted.

### 6. The seeding technique (the crux)

**MCP `modify-quest` strips `workItems`/`pausedAtStatus` and forbids `operations` entirely**, so you stage relay
states by **editing the ready-made `quest.json` directly on disk** — which bypasses the status-transition gates and
the input allowlist:

1. `mcp__dungeonmaster__create-quest({ userRequest, questType? })` mints a schema-valid quest at status `created` with
   a seeded intake work item AND a seeded **plan** operation item the work item links (`operations/<planId>`). Note
   the returned `questId` (+ `guildSlug: "codex"`).
2. Open the ready-made file: `.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/<questId>/quest.json`.
3. Patch `"status": "in_progress"`, replace `operations[]` with the scope(s) you want, and replace `workItems[]` with
   work items each carrying `step` and linked to exactly one `operations/<id>` (see "Seeding reference").
4. Save. MCP `get-next-step` sees it immediately; the web reflects a raw disk seed within ~3s.

> **Two non-obvious constraints:**
> 1. **`get-agent-prompt` resolves the work item's linked operation item AND its `step`.** A seeded work item is only
>    dispatchable if its operation item exists in the ledger AND its `step` names a real key in
>    `agentFlowStatics[family].steps`.
> 2. **Every mutation re-runs save-invariants on the whole quest.** A malformed seed makes the mutation silently
>    fail and the work item never leaves `pending`. The invariants are lenient (no duplicate ids; `dependsOn`
>    resolve; `relatedDataItems` reference valid collections + existing ids; DAG) — the shapes below satisfy them.

### 7. Seeding reference — minimal objects that pass save-invariants

Paste these into `quest.json`, swapping ids as needed. Operation-item ids are UUIDs (branded `OperationItemId`); the
`related-data-item-contract` regex is `^operations/[a-z0-9-]+$`.

```jsonc
// quest.operations[] — one item per SCOPE (one family's slice of the quest)
"operations": [
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "role": "codeweaver",
    "text": "Codeweaver: build this slice — package: web · flow: send-flow",
    "status": "in_progress",
    "locked": false,
    "flowIds": ["send-flow"],
    "packageNames": ["web"]
  }
],
// quest.workItems[] — one session per STEP the router has minted on that scope
"workItems": [
  {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "role": "codeweaver",
    "step": "work",
    "status": "pending",
    "spawnerType": "agent",
    "pieceId": "pc-badge",
    "assignedUnitIds": ["send-flow::terminal::execution-live"],
    "dependsOn": [],
    "relatedDataItems": ["operations/11111111-1111-1111-1111-111111111111"],
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
],
// quest.flows[] — read by the step's own session for context
"flows": [
  { "id": "send-flow", "name": "smoketest flow", "flowType": "runtime", "entryPoint": "cli", "exitPoints": ["done"],
    "nodes": [{ "id": "execution-live", "label": "…", "type": "terminal", "packages": ["web"] }], "edges": [] }
]
```

- Seed only the work item you want dispatched next — the relay creates each subsequent one on advance/route. But
  every operation item you want the relay to reach must be in `operations[]`.
- `assignedUnitIds` must name real unit ids the work item's own step could mark (see
  `docs/quest-role-paths.md`'s "Marking a unit" table) — the stub's `quest-work` call marks exactly these.
- **`flowrider` and `siegemaster` each fan out to ONE SCOPE PER FLOW** — seed one operation item per `quest.flows[]`
  entry for each family, each naming a single `flowId` (never every flow id on one item).
- A `deterministic` step (`commit`, `ward`, `cleanup`, `carve`, `repair`) is NOT hand-dispatchable — seed a
  `prompt`-kind step instead if you want to drive the scope by hand, and expect the dispatcher (not you) to carry it
  through any deterministic step in between.

---

# REFERENCE A — quest.json transition data points

Source of truth for "what value should each field be at each transition." Assert these in `quest.json` (read on disk
— the MCP `get-quest` view strips `workItems`).

## A1. Operation-item fields (`quest.operations[]`)

| Field      | Enum / type                          | Who writes it & when                                                                                                                                                                  |
|------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `status`   | `pending \| in_progress \| complete` | `questAdvanceBroker` → `in_progress` (when it creates the scope's first work item); `questRouteScopeBroker` → `complete` once the router answers `{ kind: 'complete' }`               |
| `role`     | `workItemRoleContract`               | seeded by the relay seed / the family-scope mint — no agent authors it                                                                                                                |
| `text`     | branded string                       | prose describing the scope, e.g. `"Codeweaver: build this slice — package: web · flow: send-flow"`                                                                                    |
| `locked`   | boolean                              | `codeweaver` scopes are UNLOCKED (`locked: false`); every other family's scopes are `locked: true`                                                                                     |
| `flowIds`  | `FlowId[]`, defaults `[]`            | each `flowrider`/`siegemaster` scope (one per flow) names a single-element array; `codeweaver` cells name every flow the cell's package tags a node in; `wardFull`/`riftcarver` carry `[]` |
| `packageNames` | `string[]`, defaults `[]`        | a `codeweaver` cell names its own package; other families carry `[]`                                                                                                                    |

## A2. Work-item fields (the ones that move)

| Field              | Enum / type                                                         | Seeded    | Who writes it & when                                                                                          |
|--------------------|-------------------------------------------------------------------|-----------|------------------------------------------------------------------------------------------------------------|
| `status`           | `pending \| queued \| in_progress \| complete \| failed \| skipped` | `pending` | `get-agent-prompt` → `in_progress`; `signal-back` → `complete`; a deterministic step's handler → `complete`/`failed`; block → `skipped` |
| `step`             | a key in `agentFlowStatics[family].steps`                          | per seed  | the router mints each fresh work item at a named step; ABSENT means a legacy command work item                |
| `sessionId`        | uuid (parent)                                                       | absent    | **get-agent-prompt** (identity resolved MCP-side); retained across an orphan resume                          |
| `agentId`          | realAgentId                                                         | absent    | **get-agent-prompt**; retained across an orphan resume                                                       |
| `assignedUnitIds`  | `UnitId[]`                                                          | per seed  | a `worker` step's assignment comes from its piece; a `reviewer`/walker step's is its scope's whole in-scope set |
| `observations`     | `UnitObservation[]`, default `[]`                                   | `[]`      | `quest-work`'s `observations` payload — `{ unitId, mark, evidence, toSettle? }` per entry                       |
| `pieceId`          | branded id, optional                                                | per seed  | present on a work item minted from a planner's piece; absent on a reviewer's whole-scope assignment            |
| `mintedBy`         | a work item id, optional                                            | absent    | the RETURN EDGE — set by the router when a step declares no `done` route of its own (e.g. `repair`)            |
| `completedAt`      | ISO ts                                                              | absent    | `signal-back` / a deterministic step's handler on terminal                                                     |
| `errorMessage`     | branded string                                                      | absent    | a `wall` outcome, or the router's own block message, lands here                                                |
| `dependsOn`        | uuid[]                                                              | per seed  | advance/route chains each new work item after the most-recent terminal work item OF THIS SCOPE                |
| `relatedDataItems` | `operations/<id>[]` (+ `wardResults/<id>` on a ward step's work item) | per seed  | **exactly one `operations/<id>`** always                                                                       |
| `resume`           | marker                                                              | absent    | `recover-orphaned-work-items-layer-broker` on an orphaned `in_progress` item (kept `sessionId`)              |
| `retryCount`       | int                                                                 | 0         | bumped on each orphan resume; `≥ slotManagerStatics.orphanRecovery.maxResets` → `blocked`                     |
| `spawnerType`      | `agent \| command`                                                  | per seed  | `command` for ward/riftcarver's LEGACY no-step-node path only; `agent` for every current-model step             |

## A3. Quest status derivation (`workItemsToQuestStatusTransformer`, family-graph-aware, precedence order)

1. Pre-execution / user-paused / abandoned / **`blocked`** / `merged` → **unchanged**.
2. **`complete` means the FAMILY GRAPH reached `@complete`**, never that the ledger drained — a family that routes to
   `@complete` must hold scopes, all of them complete.
3. Every work item terminal AND the graph complete → **`complete`**.
4. Any work item active → **`in_progress`**.
5. Only pending work items remain, all dead-ended on a `failed` dep, ledger drained → **`blocked`**; else
   **`in_progress`**.

> `blocked` is set explicitly by `questBlockOnFailureBroker`; it doesn't wait on derivation.

## A4. Enums + the dependency rule

- **operation-item status:** `pending, in_progress, complete`.
- **work-item status:** `pending, queued, in_progress, complete, failed, skipped`.
    - `isActive` = {queued, in_progress}. `isTerminal` = {complete, failed, skipped}.
    - **`satisfiesDependency` = {complete, failed}** — **`skipped` does NOT satisfy**.
- **a work item is READY** when `status === pending` AND every `dependsOn` id is `complete` or `failed`.
- **`quest-work`'s payload kinds:** `plan`, `observations` (`{ unitId, mark: 'met' | 'cant-meet' | 'unmet',
  evidence, toSettle? }[]`), `amendment`, `outcome` (`{ word: 'done' | 'unmet' | 'empty' | 'wall', reason }`),
  `invalidation`, `request`.
- **`signal-back`:** `{ questId, workItemId, signal: 'complete', operationItemId?, blockedReason? }` — `complete` is
  the SOLE kind. There is no `operationStatus` field.
- **quest status (15):** `created, pending, explore_flows, review_flows, flows_approved, explore_observables,
  review_observables, approved, in_progress, paused, blocked, complete, merging, merged, abandoned`. Terminal =
  {complete, abandoned}. `blocked` is NOT terminal (resumable → `in_progress`). `merging`/`merged` follow a
  `complete` quest through the merge action (`orchestration-merge-responder`, the `warpgate` family's own scope).
- **roles** (`workItemRoleContract`): `chaoswhisperer, bughunt, tavernkeeper, riftcarver, codeweaver, flowrider,
  siegemaster, ward, spiritmender, warpgate`. `wardFull` is a FAMILY key in `questFlowStatics`, never a role value —
  its one scope carries `role: 'ward'` (the ONLY family whose role is `'ward'`, so nothing needs to disambiguate it).
  Every code-changing family's own internal `ward` STEP runs inside a scope whose role is that FAMILY's name
  (`codeweaver`/`flowrider`/`siegemaster`), not `'ward'` — only `wardFull`'s dedicated scope carries `role: 'ward'`.
- **the one remaining named sub-agent:** `chaoswhisperer-gap-minion` — fetches with `{ agent, questId }` and NO
  `workItemId`, never a work item, never `signal-back`. `codeweaver-reviewer`/`flowrider-reviewer` are now ordinary
  STEP prompts (`agentPromptClassificationStatics.promptNames`), dispatched by the router like any other step —
  `siegemaster-reviewer`/`siegemaster-verifier`/`siegemaster-stress` are gone from every roster.
- **ward/riftcarver budget** = each step's own `maxVisits` on `agentFlowStatics[family].steps[step]`, counted as the
  work items on THIS scope at THAT step — not a chain of separate ledger items.

## A5. `quest-work` + `signal-back` (assert the `quest.json` result)

Applied server-side, in ONE atomic persist per call:

| Call | Result in `quest.json` |
|---|---|
| `quest-work({ kind: 'observations', ... })` | one `UnitObservation` appended to the work item's `observations[]` per entry |
| `quest-work({ kind: 'outcome', word, reason })` | the work item's `declaredWord`/outcome record is set; nothing is routed yet |
| `signal-back({ signal: 'complete' })` | the work item is marked terminal (`complete`/`failed`, `completedAt`); on the NEXT scan, `questRouteScopeBroker` reads every terminal work item's outcome and mints a re-cut batch (`unmet`), completes the scope (`done`/`empty`), or halts (`wall`) |

**Before any of the above, exactly ONE gate can refuse the call outright: the unmarked-unit gate** (`quest-work`
`observations`/`outcome` and `signal-back` alike) — refuses while any of the work item's `assignedUnitIds` carries no
`observations[]` entry. There is no sign-off-completeness gate and no review-coverage gate.

The handler is **idempotent**: a redelivered signal for an already-terminal work item is a no-op.

## A6. Deterministic-step routing (ward/carve/repair/commit/cleanup — Node/UI mode only)

- **`ward` (any family's own step) — exit 0 (green):** the step's `declaredWord` is `done`; the router takes that
  step's own `done` route (onward, or — for siegemaster — to `sweepOut`).
- **exit ≠ 0 (red), budget remains:** `declaredWord` is `unmet`; the router routes to `repair`, which returns to
  `ward` once it reports `done`.
- **exit ≠ 0 (red), budget spent:** the step's own `maxVisits` is spent → `{ kind: 'block', reason: 'max-visits' }`.
- **`carve` (riftcarver's own step):** a repairable red (`node_modules`/typecheck) routes to `repair`, same shape; a
  `git-state` red or a permission denial is a `wall` → `@blocked` immediately, since no worktree exists to dispatch
  a repair into.

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

Rows render in `workItems` order; each row name is its linked operation item's text, and its OWN `step`. Click
`execution-row-header` to expand.

| Field / transition               | testid                                            | shows                              | notes                                                    |
|-----------------------------------|-----------------------------------------------------|--------------------------------------|--------------------------------------------------------------|
| role                             | `execution-row-role-badge`                        | `[CODEWEAVER]` etc. (uppercased)   | a deterministic step's row is warning-colored             |
| status                           | `execution-row-status-badge`                      | label from B1                      | live                                                     |
| ward exit code                   | `execution-row-ward-result`                       | `Ward exit code: {n}` (+ `(committed)`/`(full)` when the result carries a `wardMode`) | green if 0 else red — see B3 |
| ward detail                      | `execution-row-ward-detail`                       | per-failure lines                  | HTTP fetch — see B3                                      |
| error                            | `execution-row-error-message`                     | `Error: ...`                       | populates on a `wall` outcome, or a router block message   |
| agent transcript                 | inside `execution-row-expanded` (chat-entry-list) | text/tool rows                     | auto-expands while `in_progress`                          |

## B2b. Operations ledger (rendered in BOTH the execution panel AND the QUEST SPEC tab)

`data-testid="OPERATIONS_LEDGER"`, rows `OPERATIONS_LEDGER_ROW` — each row is `OPERATIONS_LEDGER_ROW_MARKER` (status
marker) + `OPERATIONS_LEDGER_ROW_ROLE` (role) + `OPERATIONS_LEDGER_ROW_TEXT` (text) + `OPERATIONS_LEDGER_ROW_FLOWS`
(`[Flow Name]` — present iff the item carries `flowIds`). Each `flowrider` and `siegemaster` row lists its OWN
single flow name. The ledger grows live as the router mints the next family's scopes.

Status bar: `execution-status-bar-layer-widget` → `EXECUTION — {completedOps}/{totalOps} OPERATIONS`, or `EXECUTION —
AWAITING PLAN` when the ledger is empty (pre-seed). Pause/Resume: `EXECUTION_PAUSE_BUTTON` (visible iff
`isAnyAgentRunning(status)`), `EXECUTION_RESUME_BUTTON` (visible iff `isQuestResumable(status)` = {paused, blocked}).

## B3. Ward result rendering (two stages, both must hold)

**Stage 1 — exit-code row (live via WS):** a ward step's row shows `execution-row-ward-result` ("Ward exit code: N",
with `(committed)` or `(full)` appended when the `WardResult` entry carries a `wardMode`) ONLY when the work item has
`relatedDataItems` including a `wardResults/<id>` ref matching an entry on the quest. Assert the exit-code **text**,
not just visibility.

**Stage 2 — detail breakdown (HTTP, on mount):** `execution-row-ward-detail` fetches GET
`/api/quests/:questId/ward-results/:wardResultId` when the row's detail widget mounts. It renders **nothing** while
loading, on fetch error, OR when there are zero failures. So a green ward shows only the exit-code line; assert the
detail breakdown only for a known-**failing** ward run.

## B4. Agent-log grouping (the "duplicate rows show the same log" surface — two distinct keys)

- **Which transcript a row shows = `workItemId`.** The binding keeps `entriesByWorkItem` keyed by work-item id; a row
  resolves `entriesByWorkItem.get(wi.id) ?? (wi.sessionId ? entriesBySession.get(wi.sessionId) : []) ?? []`. Scope to
  `execution-row-layer-widget`.nth(N) and assert each row's transcript is **distinct**.
- **A step's own session may still dispatch a bounded, plain sub-agent for a SEARCH** (a planner step's own prompt
  allows this) — that renders as a chain inside the parent row via `collectSubagentChainsTransformer`
  (`SUBAGENT_CHAIN_HEADER`, `SUBAGENT_CHAIN`). A `work`/`review`/`happyWalk`/`adversarial` step's own session
  dispatches no sub-agent at all — its own served prompt says so directly.

## B5. NOT observable in the UI — assert ONLY in `quest.json`

- **`skipped` work items are hidden** in the active render branches. A BLOCK shows the failed row as `FAILED` and its
  skipped siblings **vanish** — assert skipped in `quest.json`.
- **`blocked` does not render the status banner** (`shouldRenderStatusBanner` = {complete, merging, merged,
  abandoned}). A blocked quest keeps the status bar + the RESUME button; verify `blocked` via `quest.json` status +
  the failed row.
- `relatedDataItems` linkage, operation-item `locked`, `pausedAtStatus` value, `questType`, `mintedBy`, and
  `resume`/`retryCount` are not shown as text (only effects are). Assert in `quest.json`. **`observations[]` is
  never rendered in the execution panel at all** — read it from `quest.json`.

---

# REFERENCE C — the repeatable probe cycle

> ## ⛔ HARD RULE — DISPATCH EXACTLY WHAT ONE `get-next-step()` RETURNS
> **You may ONLY dispatch what a single `get-next-step()` returns, then wait for it to land before calling
> `get-next-step()` again.** `select-batch-layer-broker` admits every ready item sharing ONE role AND ONE step, so a
> batch may hold several entries (several codeweaver cells' pieces at the same step) — it never mixes steps or
> families. **Never add an entry the orchestrator did not return.**
> - **You cannot dispatch a `deterministic` step at all.** If `get-next-step` returns `{ type: 'run-step', handler,
>   ... }`, that step is Node/UI mode's alone to run — stop the MCP probe there, start the real dispatcher, and
>   resume the probe once the scope has moved past it.
> - **Operationally:** ONE `get-next-step` → dispatch its returned entry/entries → wait → assert `quest.json` →
>   `get-next-step` again. Drive strictly off the returned `workItemId`; never off the seed array or a remembered id.

Every step of every flow is the same six beats:

1. **CALL** `get-next-step()`.
2. **ASSERT NextStep** JSON: `type` (`spawn-agents` / `run-step` / `idle`), the `agents[].role` + `step` +
   `workItemId` (or the `run-step`'s `handler`). Record raw JSON.
3. **DISPATCH** the stub agent per the recipe below (for a `spawn-agents` entry) — or start the real dispatcher for a
   `run-step` entry and wait for it to land.
4. **ASSERT quest.json** (on disk):
    - after `get-agent-prompt`: work item `in_progress` + non-empty `sessionId`+`agentId`; its operation item
      `in_progress`;
    - after `quest-work` + `signal-back`: work item terminal (`complete` + `completedAt`); on `unmet`, a fresh
      re-cut batch minted on the SAME scope; on `done`/`empty` with every work item at the step terminal, the scope
      moves to its next step or completes;
    - after a `run-step` (ward/carve/repair/commit/cleanup): the work item + scope per A6;
    - confirm the `operations/<id>` link never re-points and the operation item's status matches the scope's real
      progress.
5. **ASSERT web** (no refresh):
    - the row status badge shows the right **label** (B1): `RUNNING` on dispatch → `DONE`/`FAILED` on outcome;
    - **work-item insertions appear live** (a re-cut batch, the next family's scopes) within a couple seconds; the
      operations ledger (B2b) grows;
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
3. Call mcp__dungeonmaster__quest-work({ questId:"<id>", workItemId:"<id>", payload: { kind: "observations",
   observations: [{ unitId: "<id>", mark: "met", evidence: "smoketest stub — no real measurement" }, ...one per
   assignedUnitId] } }).
4. Call mcp__dungeonmaster__quest-work({ questId:"<id>", workItemId:"<id>", payload: { kind: "outcome",
   word: "<done|unmet|empty|wall>", reason: "smoketest stub" } }).
5. Call mcp__dungeonmaster__signal-back({ questId:"<id>", workItemId:"<id>", signal:"complete" }).
6. Report: the prompt you got, the marks + outcome you sent, any error from any call.
```

### Gotchas to keep front of mind

- **G1 — a `deterministic` step is not dispatchable from MCP mode, ever, for a current-model quest.** `run-ward`/
  `run-riftcarver` still exist but take no scope argument and only fire on a work item with NO `step` field — seeding
  one with a `step` set routes it through `run-step` instead, which MCP mode cannot run.
- **G2 — `quest-work` must mark EVERY assigned unit before `signal-back`.** `signal-back` throws naming every
  unmarked unit if you skip straight to it.
- **G3 — get-agent-prompt stamping is identity-resolved.** No identity → no `in_progress`/`sessionId`/`agentId`
  stamp. Verify the stamp happened.
- **G4 — get-agent-prompt needs the linked operation item present AND the work item's `step` to be real.** A seeded
  work item whose `operations/<id>` has no matching ledger entry, or whose `step` names nothing in
  `agentFlowStatics[family].steps`, can't have its prompt built.
- **G5 — skipped rows vanish in the UI; blocked shows no banner** (B5). Assert those in `quest.json`.
- **G6 — ward detail renders null** while loading / on error / when green. Only assert the breakdown for a failing
  ward run.
- **G7 — never parallel-dispatch different steps or families; one logical step per turn; act only on echoed ids.**
  Use ONLY the `questId`/`workItemId` echoed back by the immediately-preceding tool result — never one retyped from
  the seed array or memory.

---

# Flow 0 — Start Quest seed shape (the per-flow fan-out invariant)

Flow 1 hand-seeds the ledger, so it can only assert the shape you typed. This flow makes
`questBuildRelayGraphBroker` produce the ledger itself, which is the one place the per-flow fan-out invariant can
actually regress.

### Seed

`create-quest` (feature), then patch `quest.json` on disk to a launch-ready spec — the disk write bypasses the gates:

- `"status": "approved"`
- `flows[]`: THREE runtime flows, ids `flow-a`, `flow-b`, `flow-c`, each tagging ONE package's node
- `packagesAffected`: the one package those flows tag

### Probe

1. Call `mcp__dungeonmaster__start-quest({ questId })`. It routes through the same `OrchestrationStartResponder` →
   `questBuildRelayGraphBroker` seed the Web UI's Start Quest button uses.
2. **ASSERT `quest.json`:**
    - status `in_progress`; the intake plan item force-completed to `complete`.
    - **ONLY the entry family's scope exists** — one `riftcarver` operation item, `pending`, `locked: true`,
      `flowIds: []`, `packageNames: []`. **No `codeweaver`/`flowrider`/`siegemaster`/`wardFull` scope exists yet** —
      those are minted later, as the family graph is routed to them.
    - ONE work item was created, at `step: 'carve'`, linked to the riftcarver scope.
3. **ASSERT web** (~3s): the operations ledger shows 2 rows (the force-completed plan item + the pending riftcarver
   scope); the status bar reads `EXECUTION — 1/2 OPERATIONS`.
4. Abandon the quest — Flow 1 needs a clean FIFO.

**PASS:** the ledger at Start holds ONLY the entry family's scope — proving the LAZY-MINT invariant (later families'
scopes do not exist until the family graph routes to them).

---

# Flow 1 — Driving one codeweaver scope through its own step graph

Pre-seed ONE codeweaver scope already `in_progress` with its first work item at `plan`, then drive it through
`plan → work → review → commit → ward` — noting exactly where MCP mode's reach ends.

### Seed

`create-quest` (feature), then patch `quest.json`: `status: in_progress`, one `flows[]` runtime flow tagging one
package, ONE `codeweaver` operation item for that (package, flow) cell, and a work item at `step: 'plan'`.

```jsonc
"operations": [
  { "id": "op-cw", "role": "codeweaver", "text": "Codeweaver: build this slice — package: web · flow: send-flow",
    "status": "in_progress", "locked": false, "flowIds": ["send-flow"], "packageNames": ["web"] }
],
"workItems": [
  { "id": "wi-plan", "role": "codeweaver", "step": "plan", "status": "pending", "spawnerType": "agent",
    "dependsOn": [], "relatedDataItems": ["operations/op-cw"], "createdAt": "..." }
],
"flows": [
  { "id": "send-flow", "name": "smoketest flow", "flowType": "runtime", "entryPoint": "cli", "exitPoints": ["done"],
    "nodes": [{ "id": "execution-live", "label": "…", "type": "terminal", "packages": ["web"] }], "edges": [] }
]
```

### Probe sequence

| # | get-next-step | dispatch | assert |
|---|---|---|---|
| 1 | `spawn-agents`, `codeweaver`/`plan` (`wi-plan`) | stub: `outcome: 'done'` (a planner marks no units) | `wi-plan` terminal; the router mints the FIRST `work` piece(s) as fresh work item(s) on `op-cw` |
| 2 | `spawn-agents`, `codeweaver`/`work` | stub marks its `assignedUnitIds` `met`, `outcome: 'done'` | work item terminal; once every `work` piece has drained, the router mints `review` |
| 3 | `spawn-agents`, `codeweaver`/`review` | stub marks the scope's whole in-scope set, `outcome: 'done'` | review terminal; router mints `commit` |
| 4 | `run-step`, handler `commit` | **STOP — start the real Node/UI dispatcher here.** MCP mode cannot run this. | once it lands: `commit` step's work item `complete`; router mints `ward` |
| 5 | `run-step`, handler `ward` | (Node/UI dispatcher, real ward) | on green: `ward`'s work item `complete`, `relatedDataItems` gains `wardResults/<id>`; `op-cw`'s scope marked `complete`; once EVERY codeweaver cell is complete, the family graph mints `flowrider`'s scopes |
| 6 | `idle` or the next family's first step | — | confirm no stray work item was minted twice for `op-cw` |

**PASS:** every `prompt` step (`plan`, `work`, `review`) was driven entirely by hand through the MCP; every
`deterministic` step (`commit`, `ward`) required the real dispatcher, and `quest.json` shows exactly one scope
(`op-cw`) carrying every one of those work items via the SAME `operations/<id>` link.

> **A re-cut batch, not a continuation.** If a stub sends `outcome: 'unmet'` at `review`, the router mints a FRESH
> work item at `work` (review's own `routes.unmet`), scoped to exactly the units still `unmet` — there is no `pt N`
> append, and no second scope. Confirm this directly: send `unmet` once during step 3 above, watch the router mint a
> `work` item instead of `commit`, mark it `met`, and only then see `review` re-run and reach `commit`.

---

# Flow 2 — The `wall` halt

Seed a scope's work item exactly as Flow 1, but at step 3 (`review`) mark every assigned unit and send
`quest-work({ kind: 'outcome', word: 'wall', reason: '<a made-up environment wall>' })`, then `signal-back`.

- **Assert:**
    - The router reads `wall`, answers `{ kind: 'block', reason: 'wall', message: '<reason>' }`.
    - `quest-block-on-failure-broker` marks the work item `failed` carrying the message as `errorMessage`, and the
      quest goes `blocked` immediately — no re-cut batch is minted, nothing advances.
    - `get-next-step` for that quest now returns `idle` (the scan filters on `in_progress`).
    - UI: the failed row shows `FAILED` + the error message; no terminal banner; RESUME button visible.
- Resume: `mcp__dungeonmaster__modify-quest({ questId, status: 'in_progress' })` through the resume path rearms
  every work item on an unfinished scope back to `pending` — confirm the SAME `review` step re-dispatches rather
  than a fresh scope being minted.

**PASS:** `wall` halts on the FIRST occurrence, names the reason on the failed row, and resume rearms the same scope
rather than skipping or duplicating it.

---

# Flow 3 — Orphan → resume (no restart, no duplicate)

Seed a work item at `in_progress` (as if a session was mid-flight), then call `get-next-step`.

- **Assert:** `recover-orphaned-work-items-layer-broker` flips the orphaned `in_progress` work item back to
  `pending`, **keeps** its `sessionId`/`agentId`, sets a `resume` marker, and bumps `retryCount`. Node/UI dispatch
  then resumes the retained Claude session (`claude --resume`). **No duplicate work item** — the SAME `step` and the
  SAME `operations/<id>` link. A crash-looping session reaching `slotManagerStatics.orphanRecovery.maxResets` →
  `blocked`.
- (The MCP `/dumpster-launch` Task path fresh-spawns rather than resumes — its `sessionId` is the parent loop
  session.)

---

# Prompt-walk pass (static desk-check)

Verify each served prompt still gives an LLM enough to do its job — every capability maps to a real, callable thing.
**Static desk-check only** — read and trace; do not execute.

### Targets

Every entry in `agentPromptClassificationStatics.promptNames` — one file per step (`codeweaver-planner`,
`codeweaver-worker`, `codeweaver-reviewer`, `flowrider-planner`, `flowrider-worker`, `flowrider-reviewer`,
`siege-planner`, `siege-happy-walker`, `siege-happy-fixer`, `siege-adversarial-walker`, `siege-adversarial-fixer`,
`siegemaster-reader`, `recipe-maker`, …), plus the shared blocks they interpolate
(`standards-review-concerns-statics`, `flow-evidence-contract-statics`), the bespoke prompts `spiritmender-prompt`,
`warpgate-prompt`, `tavernkeeper-prompt`, `dumpster-create-prompt`, `dumpster-hunt-prompt`, plus
`chaoswhisperer-gap-minion`. There is no shared operator template and no generic planner/worker/reviewer minion —
walk each prompt file on its own.

### Procedure (per prompt)

1. **Read** the static.
2. **Enumerate the required capabilities.** For a `worker` step: does it read the code it needs to change, write the
   edit itself (no sub-agent), mark its assigned units through `quest-work`, and record an `outcome`? For a
   `reviewer`/walker step: does it read every file the pass produced, take its own judgment (and, for
   `codeweaver`/`flowrider`'s `review` step, the five standards concerns), mark the scope's whole in-scope set, ward
   `--uncommitted`, commit once, push bare? For a `planner` step: does it cut pieces, use `Agent()` for a SEARCH ONLY
   and nowhere else?
3. **Trace each capability to a real mechanism:** does the prompt name the exact MCP tool / command / file path /
   static, and does it still exist? (`discover` to confirm — don't trust the prompt.) Are referenced tools valid
   against current contracts (`quest-work`'s six payload kinds; `signal-back` = `complete` only; agents never write
   `operations`)? Any holes — a value never provided in the interpolated scope, a tool the step can't call, a file
   read before it's written, stale wording?
4. **Record findings:** capabilities covered ✓, capabilities with a hole ✗ (name the missing link), stale/ambiguous
   wording. A hole is a real bug — the agent stalls or improvises at runtime.

---

# Findings log + execution order

Keep `/tmp/smoke-mcp-notes.md`: per probe, the family/step, **expected vs observed** for the `NextStep` JSON, the
`quest.json` mutation, and the web view; quest/operation/work-item ids; screenshots for any web discrepancy. Classify
blocking (wrong next step, mutation didn't land, a scope's link broke, UI mis-rendered) vs non-blocking vs
prompt-walk hole. On a real bug, use the Fix Agent / TDD-First / Bug Procedure from
`playbook/smoketest-orchastrator.md`; the orchestrator does not edit source directly. Session-level running state
goes in `playbook/smoketest-mcp-handoff.md`.

**Order:** (1) setup — build, **wipe `.dungeonmaster/guilds/21523917-…/quests`**, `npm run prod`, browser on `:4801`;
(2) Flow 0 (Start Quest seed shape — the lazy-mint invariant); (3) Flow 1 (one codeweaver scope's own step graph,
noting the MCP/Node-mode boundary); (4) Flow 2 (`wall` → block → resume); (5) Flow 3 (orphan → resume), clean FIFO
before each; (6) prompt-walk; (7) abandon all smoketest quests, confirm the quest queue is clean.
