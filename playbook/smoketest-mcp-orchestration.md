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
re-ward append come from the **real ward exit code inside `quest-run-ward-broker`**, not a `signal-back`. Riftcarver
is the other command role, dispatched the same way via `run-riftcarver`.

**There is no failure signal.** `signal: 'complete'` is the sole signal kind; the outcome rides on `operationStatus`
(`done | partial | blocked`; `failed` is rejected). The orchestrator applies it server-side (authoritative — an agent
cannot forget to patch the ledger, because agents never write it).

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

### The relay shape — identical for both quest types

- **feature** (`questType: feature`): the intake role (ChaosWhisperer) authors NO ledger at all — `operations` is off
  its modify-quest allowlist. Start Quest DERIVES the `codeweaver` items (`fanOutBy: 'implementation'`, ONE ITEM PER
  PACKAGE, each carrying every flow that package tags a node in plus every contract whose `source` resolves under it)
  and appends the verify tail `ward(changed) → flowrider → siegemaster → ward(full)` (all `locked`). `flowrider` and
  `siegemaster` each fan out (`fanOutBy: 'flow'`) to ONE OPERATION ITEM PER FLOW, of either flow type — a flow-less
  quest still gets exactly one item of each, so the off-map probe families keep an owner. **There is no
  standards-review item on the tail and none is ever appended to it** — the five standards concerns are guidance a
  role's own named reviewer takes, and nothing about that review lands in `quest.json`.
- **bug-hunt** (`questType: bug-hunt`): Start Quest seeds the SAME relay — the only difference is the intake role
  (`bughunt` instead of `chaoswhisperer`, driven by `/dumpster-hunt`). Its spec shape is ONE FLOW PER BUG, forking into
  `ACTUAL:`/`EXPECTED:` terminal nodes with observables on the `EXPECTED:` side; each becomes a failing test written by
  the codeweaver session that owns the package the fix lands in. There is no separate bug-hunt implementation role.

Each of `codeweaver`, `flowrider`, `siegemaster` is an **operator** (`agentPromptClassificationStatics.operatorRoleNames`)
running on **opus**. It reads code itself (never opens the round-loop / minion machinery of an older design — there is
none any more), briefs GENERIC `general-purpose` sub-agents in its own words to make edits, reads the diff itself, and
summons exactly ONE named sonnet reviewer sub-agent to grade the pass — `codeweaver-reviewer`, `flowrider-reviewer`, or
`siegemaster-reviewer` (siegemaster also dispatches `siegemaster-walker`, one at a time, to drive the flow by hand
against a running system). The operator's own signal table offers only `done` and `blocked` — the session loops,
unbounded, until its own reviewer's `NEXT:` line reads `pass`; a `partial` (and its `pt N` continuation) is a mechanism
the responder still applies generically to any code-changing role, but these three operators never choose it. Only the
named reviewer builds, wards (`npm run ward -- --staged`), commits (once), and pushes (bare) — no code-writing
sub-agent does any of that.

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

**MCP `modify-quest` strips `workItems`, `wardResults`, `riftcarverResults`, `pausedAtStatus`** (`quest-handle-responder.ts`),
AND the input allowlist forbids `operations` entirely, so you can't stage work-item/operation states through the
MCP. You stage them by **editing the ready-made `quest.json` directly on disk** — which bypasses the status-transition
gates and the input allowlist, so you can drop the quest into any state:

1. `mcp__dungeonmaster__create-quest({ userRequest, questType? })` mints a schema-valid quest at status `created` with a
   seeded intake work item AND a seeded **plan** operation item the work item links (`operations/<planId>`).
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
`related-data-item-contract` regex is `^(operations|wardResults|riftcarverResults|flows)/[a-z0-9-]+$`. **An
`operational` flow needs no dev server** — use it so a seeded siegemaster doesn't trigger `.dungeonmaster.json`
dev-server resolution (a seeded flowrider brings its own via the project's Playwright config on a runtime flow, and
needs none on an operational one).

```jsonc
// quest.operations[] — the ledger; each item is worked by exactly one work item
"operations": [
  { "id": "11111111-1111-1111-1111-111111111111", "role": "codeweaver", "text": "smoketest: build core adapter", "status": "pending", "locked": false },
  { "id": "22222222-2222-2222-2222-222222222222", "role": "ward", "text": "ward (changed)", "status": "pending", "locked": true, "wardMode": "changed" },
  { "id": "33333333-3333-3333-3333-333333333333", "role": "flowrider", "text": "author the flow-perspective test suite — flow: flow-1", "status": "pending", "locked": true, "flowIds": ["flow-1"] }
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
- **Flowrider and Siegemaster each fan out to ONE OPERATION ITEM PER FLOW** — seed one item per `quest.flows[]` entry
  for each role, each naming a single `flowId` (never every flow id on one item). Each item's work item links
  `operations/<id>` (NOT a `flows/<id>` ref) — `flowIds` on the operation item is what `get-agent-prompt` interpolates
  as the session's flow, and the session reads `quest.flows` directly for the rest of the context.

---

# REFERENCE A — quest.json transition data points

Source of truth for "what value should each field be at each transition." Assert these in `quest.json` (read on disk —
the MCP `get-quest` view strips `workItems`/`wardResults`).

## A1. Operation-item fields (`quest.operations[]`)

| Field      | Enum / type                          | Who writes it & when                                                                                                                                                                  |
|------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `status`   | `pending \| in_progress \| complete` | advance → `in_progress` (when it creates the work item); signal-back/run-ward → `complete`. NO `partial`                                                                              |
| `role`     | `workItemRoleContract`               | seeded by the relay seed / advance — no agent authors it                                                                                                                              |
| `text`     | branded string                       | prose; a continuation is auto-named `"pt N: {text}"` by `operationPtChainTransformer`                                                                                                 |
| `locked`   | boolean                              | orchestrator-owned items (the plan item + the fixed verify tail) are `locked`; codeweaver = false                                                                                     |
| `wardMode` | `changed \| full`                    | present only on `role: ward` items; preserved on the `pt N` re-ward                                                                                                                   |
| `flowIds`  | `FlowId[]`, defaults `[]`            | the flows the item lands on. Each `flowrider`/`siegemaster` item (one per flow) gets a single-element array naming its own flow; other tail roles get none. Copied onto the `pt N` continuation |

## A2. Work-item fields (the ones that move)

| Field              | Enum / type                                                         | Seeded    | Who writes it & when                                                                                          |
|--------------------|-----------------------------------------------------------------------|-----------|------------------------------------------------------------------------------------------------------------|
| `status`           | `pending \| queued \| in_progress \| complete \| failed \| skipped` | `pending` | get-agent-prompt → `in_progress`; signal-back → `complete`; run-ward → `complete`/`failed`; block → `skipped` |
| `sessionId`        | uuid (parent)                                                       | absent    | **get-agent-prompt** (identity resolved MCP-side); retained across an orphan resume                          |
| `agentId`          | realAgentId                                                         | absent    | **get-agent-prompt**; retained across an orphan resume                                                       |
| `startedAt`        | ISO ts                                                              | absent    | **get-agent-prompt** (same stamp). NOT set for ward (no get-agent-prompt)                                     |
| `completedAt`      | ISO ts                                                              | absent    | signal-back / run-ward on terminal                                                                           |
| `actualSignal`     | `complete`                                                          | absent    | signal-back on terminal (the sole signal kind)                                                               |
| `errorMessage`     | branded string                                                      | absent    | run-ward red only → `'ward_failed'`; run-riftcarver red → `riftcarver_<step>_failed`. Agents never fail so no agent sets it, except a `blocked` signal's `blockedReason` |
| `dependsOn`        | uuid[]                                                              | per seed  | advance chains each new work item after the most-recent terminal work item                                   |
| `relatedDataItems` | `(operations\|wardResults\|riftcarverResults\|flows)/<id>[]`         | per seed  | **exactly one `operations/<id>`** always; run-ward stamps `wardResults/<id>` on the ward item at completion   |
| `resume`           | marker                                                              | absent    | `recover-orphaned-work-items-layer-broker` on an orphaned `in_progress` item (kept `sessionId`)              |
| `retryCount`       | int                                                                 | 0         | bumped on each orphan resume; `≥ slotManagerStatics.orphanRecovery.maxResets` → `blocked`                     |
| `wardMode`         | `changed \| full`                                                   | per seed  | ward items; preserved on the `pt N` re-ward                                                                  |
| `spawnerType`      | `agent \| command`                                                  | per seed  | `command` for ward/riftcarver, `agent` for everything else                                                   |

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
- **signal-back:** `signal: 'complete'` is the SOLE kind. The outcome is `operationStatus: 'done' | 'partial' | 'blocked'`
  (`failed` is explicitly rejected). The three operator roles' own prompts choose only `done`/`blocked`.
- **quest status (15):** `created, explore_flows, review_flows, flows_approved, explore_observables,
  review_observables, approved, explore_design, review_design, design_approved, in_progress, paused, blocked, complete,
  abandoned`. Terminal = {complete, abandoned}. **`blocked` is NOT terminal** (resumable → in_progress). There are NO
  `seek_*` statuses.
- **roles** (`workItemRoleContract`, 11): `chaoswhisperer, glyphsmith, bughunt, tavernkeeper, riftcarver, codeweaver,
  ward, spiritmender, flowrider, siegemaster, warpgate`. The Claude-dispatched agent-role subset
  (`agentRoleContract`, 5) is `codeweaver, flowrider, siegemaster, spiritmender, warpgate` — `riftcarver`/`ward` are
  deliberately excluded (they are commands, terminal by exit code) and the four chat roles are excluded too. No
  minion name is ever a role: `codeweaver-reviewer`, `flowrider-reviewer`, `siegemaster-reviewer`,
  `siegemaster-walker`, and `chaoswhisperer-gap-minion` are `agentPromptNameContract` names only — a parent summons
  them via the `Agent` tool with `{ agent, questId }` and NO `workItemId`, so they are never work items and never
  appear on the ledger. `agentPromptClassificationStatics.roleNames` and `.minionNames` are DISJOINT, and the
  colocated test pins that.
- **ward retry budget** = `slotManagerStatics.ward.maxRetries` (the red-ward chain of a `wardMode` since the last green
  of that mode); riftcarver's repairable chain uses `slotManagerStatics.riftcarver.maxRetries` the same way. A locked
  role's `pt N` chain (if ever exercised) = `slotManagerStatics.<role>.maxAttempts` (3 for codeweaver, flowrider,
  siegemaster, spiritmender, warpgate). `flowrider` and `siegemaster` each get one budget PER FLOW. That pt
  budget is a DIFFERENT bound from the operator's own internal loop, which has no server-enforced cap — a session
  that spends its own patience and still has a remainder is expected to signal `done` once its reviewer says `pass`,
  or `blocked` on a genuine wall, never `partial`.

## A5. signal-back outcome application (assert the `quest.json` result)

`quest-handle-signal-back-responder`, in ONE atomic `questOperationsUpdateBroker` persist, marks the work item terminal
(`complete`, `completedAt`, `actualSignal`), resolves the linked operation item, then applies the outcome:

| operationStatus       | result in `quest.json`                                                                                                                    |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `done` (or absent)    | operation item → `complete`; advance creates the work item for the next `pending` operation item                                          |
| `partial`             | operation item → `complete` AND a `"pt N: {text}"` continuation appended immediately after it (same role, `locked`/`wardMode` preserved); advance creates a fresh work item for it. Locked role → the `pt N` chain is bounded by `slotManagerStatics.<role>.maxAttempts`; spent → `blocked`. Unlocked codeweaver → unbounded |
| `blocked`             | operation item → `complete` AND the same `pt N` continuation as `partial`, but the work item is `failed` carrying `blockedReason`; the pt budget is bypassed and the quest halts immediately (advance does NOT run) |

**Before any of the above, exactly ONE gate can refuse the call outright: commit-before-signal** — for the three
operator roles plus `spiritmender`/`warpgate`, `signal-back` throws while the quest worktree carries uncommitted
changes (tracked or untracked), on `done`/`partial`/`blocked` alike. There is no sign-off-completeness gate and no
review-coverage gate — an unsigned verification unit refuses nothing.

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
|-----------------------------------|-----------------------------------------------------|--------------------------------------|------------------------------------------------------------|
| role                             | `execution-row-role-badge`                        | `[CODEWEAVER]` etc. (uppercased)   | ward/riftcarver badges are warning-colored               |
| status                           | `execution-row-status-badge`                      | label from B1                      | live                                                     |
| ward exit code                   | `execution-row-ward-result`                       | `Ward exit code: {n}` (+ `(mode)`) | green if 0 else red — see B3                             |
| ward detail                      | `execution-row-ward-detail`                       | per-failure lines                  | HTTP fetch — see B3                                      |
| error                            | `execution-row-error-message`                     | `Error: ...`                       | populates for a failed **ward**/**riftcarver** run, or a `blocked` signal's `blockedReason` |
| agent transcript                 | inside `execution-row-expanded` (chat-entry-list) | text/tool rows/sub-agent chains    | auto-expands while `in_progress`; an operator's briefed sub-agents and its named reviewer/walker render as sub-agent chains inside its own row |

## B2b. Operations ledger (rendered in BOTH the execution panel AND the QUEST SPEC tab)

`data-testid="OPERATIONS_LEDGER"`, rows `OPERATIONS_LEDGER_ROW` — each row is `OPERATIONS_LEDGER_ROW_MARKER` (status
marker) + `OPERATIONS_LEDGER_ROW_ROLE` (role) + `OPERATIONS_LEDGER_ROW_TEXT` (text) + `OPERATIONS_LEDGER_ROW_FLOWS`
(`[Flow Name]` — present iff the item carries `flowIds`; an id that no longer resolves to a quest flow renders as the
raw id) + `OPERATIONS_LEDGER_ROW_WARD_MODE` (`(changed)`/`(full)` on ward rows). Each `flowrider` and `siegemaster` row
lists its OWN single flow name; every other tail row carries no flows element at all. The ledger grows live
as advance appends a `pt N` / spiritmender / fresh ward.

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
  `SUBAGENT_CHAIN_HEADER` (`▾ SUB-AGENT "{desc}" ({n} entries)`), group `SUBAGENT_CHAIN`. A generic code-writing
  sub-agent, a named reviewer (`codeweaver-reviewer`/`flowrider-reviewer`/`siegemaster-reviewer`), or
  `siegemaster-walker` all render as a chain inside their parent operator's row.

## B5. NOT observable in the UI — assert ONLY in `quest.json`

- **`skipped` work items are hidden** in the active render branches. A BLOCK shows the failed row as `FAILED` and its
  skipped siblings **vanish** — assert skipped in `quest.json`.
- **`blocked` does not render the status banner** (`execution-panel-status-banner` uses
  `shouldRenderStatusBanner` = {complete, merging, merged, abandoned}). A blocked quest keeps the status bar + the
  RESUME button; verify `blocked` via `quest.json` status + the failed row.
- `relatedDataItems` linkage, operation-item `locked`, `pausedAtStatus` value, `questType`, and `resume`/`retryCount`
  are not shown as text (only effects are). Assert in `quest.json`. **Sign-off fields (`codeweaverSignoff` /
  `flowriderSignoff` / `siegemasterSignoff`) and standards-review activity are never rendered in the execution panel at
  all** — read them from `quest.json` (sign-offs) or accept that standards review leaves no trace in quest state to
  assert against.

---

# REFERENCE C — the repeatable probe cycle

> ## ⛔ HARD RULE — DISPATCH EXACTLY WHAT ONE `get-next-step()` RETURNS
> **You may ONLY dispatch what a single `get-next-step()` returns, then wait for it to land before calling
> `get-next-step()` again.** The relay hands you exactly the one session that is ready; you do not pick the next item or
> run ahead of the ledger.
>
> - The relay is **one session at a time.** `questAdvanceBroker` creates ONE work item for the first `pending` operation
>   item and does not create the next until that session's outcome is applied. So `get-next-step` returns exactly one
>   `spawn-agents` entry (or one `run-ward`/`run-riftcarver`). **Never add an entry the orchestrator did not return, and
>   never parallel-dispatch different roles** — `signal-back` does not gate on readiness, so a hand-batched pipeline
>   force-completes items out of order and invalidates the run.
> - The ONLY sub-agent activity in the model is a real operator role briefing generic sub-agents and its own named
>   reviewer (or `siegemaster-walker`) via the `Agent` tool. Those are inside the parent's turn, not separate
>   `get-next-step` dispatches — you never dispatch them, and a smoketest stub agent should not simulate them either
>   (the stub's whole point is to exercise `get-agent-prompt`/`signal-back`, not the operator's internal briefing loop).
> - **Operationally:** ONE `get-next-step` → dispatch its single returned entry → wait → assert `quest.json` →
>   `get-next-step` again. Drive strictly off the returned `workItemId`; never off the seed array or a remembered id.
>   When in doubt, do one tool call per turn.

Every step of every flow is the same six beats:

1. **CALL** `get-next-step()`.
2. **ASSERT NextStep** JSON: `type` (`spawn-agents`/`run-ward`/`run-riftcarver`/`idle`), the single `agents[].role` +
   `workItemId` (or the command's `mode`). Record raw JSON.
3. **DISPATCH** the stub agent per the recipe below (or `run-ward`/`run-riftcarver` for a command step) with the
   test-case `operationStatus`.
4. **ASSERT quest.json** (on disk):
    - after get-agent-prompt: work item `in_progress` + non-empty `sessionId`+`agentId`+`startedAt`; its operation item
      `in_progress` (if these stay empty, identity resolution failed — a finding);
    - after signal-back: work item terminal (`complete` + `completedAt` + `actualSignal`); operation item `complete`;
      on `partial`/`blocked`, a `pt N` continuation appended; the NEXT operation item's work item created by advance
      (skipped on `blocked`);
    - after run-ward/run-riftcarver: work item + operation item per A6 (green → both `complete` + a result ref; red →
      `failed`/`complete` + spiritmender + fresh command, or `blocked` when the budget is spent);
    - confirm strict 1:1: no second work item minted for one operation item.
5. **ASSERT web** (no refresh):
    - the row status badge shows the right **label** (B1): `RUNNING` on dispatch → `DONE`/`FAILED` on outcome;
    - the agent's log renders **under its own row**; a briefed sub-agent or named reviewer/walker renders as a chain
      (B4);
    - **work-item insertions appear live** (advance's next row, a `pt N` continuation, a spliced spiritmender/fresh
      command) within a couple seconds; the operations ledger (B2b) grows;
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
   operationStatus:"<done|partial|blocked>" }).
4. Report: the prompt you got, the operationStatus you sent, any error from either call.
```

Optionally pre-seed `smoketestPromptOverride` (trivial prompt) + `smoketestExpectedSignal`.

### Gotchas to keep front of mind

- **G1 — `run-ward`/`run-riftcarver`'s param is `mode`/its own inputs, NOT `wardMode`.** The work-item/operation-item
  field is spelled `wardMode`, but the **MCP tool argument is `mode`**. Passing `wardMode` errors `Unrecognized
  key(s): wardMode` and the ward never runs. Always call `run-ward({ questId, workItemId, mode })`.
- **G2 — `signal: 'complete'` is the sole kind; the outcome is `operationStatus`.** There is no `failed`/`failed-replan`
  signal. `operationStatus: 'partial'` is the "more remains" outcome; the orchestrator continues it as a `pt N` item —
  but a real codeweaver/flowrider/siegemaster session never sends it, so a stub sending `partial` for one of these
  roles is testing the responder's generic mechanism, not a real prompt behavior.
- **G3 — get-agent-prompt stamping is identity-resolved.** No identity → no `in_progress`/`sessionId`/`agentId` stamp.
  Verify the stamp happened.
- **G4 — get-agent-prompt needs the linked operation item present.** A seeded work item whose `operations/<id>` has no
  matching ledger entry can't have its prompt built. Seed the operation item.
- **G5 — skipped rows vanish in the UI; blocked shows no banner** (B5). Assert those in `quest.json`.
- **G6 — ward detail renders null** while loading / on error / when green. Only assert the breakdown for a failing ward.
- **G7 — never parallel-dispatch different roles; one logical step per turn; act only on echoed ids.** This is the
  ⛔ HARD RULE above, restated because violating it is the single most common way a run goes bad:
    - `signal-back` does not gate on readiness, so concurrently dispatching e.g. two `flowrider` items out of ledger
      order force-completes them out of order — the end-state can *look* complete while never having exercised each
      advance. The relay is one session at a time; there is no legal cross-role parallel dispatch.
    - **Hallucinated / remembered ids → cancelled batch + possible corruption.** Use ONLY the `questId`/`workItemId`
      echoed back by the immediately-preceding tool result — never one retyped from the seed array or memory. When in
      doubt, do one tool call per turn.

---

# Flow 0 — Start Quest seed shape (the per-flow fan-out invariant)

Flow 1 hand-seeds the ledger, so it can only assert the shape you typed. This flow makes
`questBuildRelayGraphBroker` produce the ledger itself, which is the one place the per-flow fan-out invariant can
actually regress.

### Seed

`create-quest` (feature), then patch `quest.json` on disk to a launch-ready spec — the disk write bypasses the gates:

- `"status": "approved"`
- `flows[]`: THREE operational flows, ids `flow-a`, `flow-b`, `flow-c` (three so a count-off-by-one is visible)
- `operations[]`: the seeded plan item (leave it) plus ONE `{ role: 'codeweaver', locked: false, status: 'pending' }`
  item — `OrchestrationStartResponder` validates startability, and the relay needs an implementation item to hang its
  first work item on
- leave `workItems[]` as created

### Probe

1. Call `mcp__dungeonmaster__start-quest({ questId })`. It routes through the same
   `OrchestrationStartResponder` → `questBuildRelayGraphBroker` seed the Web UI's Start Quest button uses.
2. **ASSERT `quest.json`:**
    - status `in_progress`; the intake plan item force-completed to `complete`.
    - The appended tail is EXACTLY eight locked items in this order: `ward(changed)`, THREE `flowrider` (one per
      flow), THREE `siegemaster` (one per flow), `ward(full)`. **No standards-review item is seeded and none is
      appended later** — assert `operations.filter(o => o.role === 'flowrider').length === 3` and
      `operations.filter(o => o.role === 'siegemaster').length === 3`.
    - Each `flowrider` item's `flowIds` is a single-element array naming its own flow, and its `text` is suffixed
      `— flow: <id>`. Each `siegemaster` item is the same shape.
    - `ward` items' `flowIds` is `[]`.
    - ONE work item was created, for the first pending item, linked `operations/<id>`.
3. **ASSERT web** (~3s): the operations ledger shows 10 rows (plan item + codeweaver + the eight-item tail); each
   flowrider row and each siegemaster row shows its own single flow NAME in `OPERATIONS_LEDGER_ROW_FLOWS`; the status
   bar reads `EXECUTION — 1/10 OPERATIONS` (the force-completed plan item is the 1).
4. Abandon the quest — Flow 1 needs a clean FIFO.

**Repeat once with a ZERO-flow quest** (same seed, `flows: []`): both `flowrider` and `siegemaster` still get exactly
ONE item each (the flow-less fallback, so the off-map probe families — this quest's only security and performance
coverage — keep an owner), each with `flowIds: []`; the ledger rows render no flows element at all.

**PASS:** one `flowrider` item and one `siegemaster` item PER quest flow (or exactly one of each, on a flow-less
quest), each carrying its own single flow id.

---

# Flow 1 — Happy path relay (feature, pre-seeded)

Pre-seed the full operations ledger + the first work item, then drive the relay one session at a time to `complete`.
This mirrors the state a quest is in right after Start Quest seeded the relay.

### Seed

`create-quest` (feature), then patch `quest.json`: `status: in_progress`, an `operations[]` ledger with a codeweaver
item + the verify tail as operation items (all `locked` except the codeweaver), TWO `flows[]` operational flows, and a
FIRST work item for the codeweaver operation item. Two flows is deliberate: the tail is SEVEN items — TWO `flowrider`
items and TWO `siegemaster` items, one of each per flow.

```jsonc
"operations": [
  { "id": "op-cw",     "role": "codeweaver",   "text": "smoketest: core adapter", "status": "pending", "locked": false },
  { "id": "op-ward1",  "role": "ward",         "text": "ward (changed)",          "status": "pending", "locked": true, "wardMode": "changed" },
  { "id": "op-flow1",  "role": "flowrider",    "text": "author the flow-perspective test suite — flow: flow-1", "status": "pending", "locked": true, "flowIds": ["flow-1"] },
  { "id": "op-flow2",  "role": "flowrider",    "text": "author the flow-perspective test suite — flow: flow-2", "status": "pending", "locked": true, "flowIds": ["flow-2"] },
  { "id": "op-siege1", "role": "siegemaster",  "text": "manual-QA this flow and review its test suite — flow: flow-1", "status": "pending", "locked": true, "flowIds": ["flow-1"] },
  { "id": "op-siege2", "role": "siegemaster",  "text": "manual-QA this flow and review its test suite — flow: flow-2", "status": "pending", "locked": true, "flowIds": ["flow-2"] },
  { "id": "op-ward2",  "role": "ward",         "text": "ward (full)",             "status": "pending", "locked": true, "wardMode": "full" }
],
"workItems": [
  { "id": "wi-cw", "role": "codeweaver", "status": "pending", "spawnerType": "agent", "dependsOn": [], "relatedDataItems": ["operations/op-cw"], "createdAt": "..." }
],
"flows": [
  { "id": "flow-1", "name": "smoketest flow", "flowType": "operational", "entryPoint": "cli", "exitPoints": ["done"], "nodes": [], "edges": [] },
  { "id": "flow-2", "name": "second smoketest flow", "flowType": "operational", "entryPoint": "cli", "exitPoints": ["done"], "nodes": [], "edges": [] }
]
```

(Use real UUIDs for the operation ids. Seed only the FIRST work item — the relay creates each subsequent work item on
advance.)

### Probe sequence

| # | get-next-step                                     | dispatch                 | quest.json                                                                                                                                                                                              | web                                                                |
|---|-----------------------------------------------------|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| 1 | `spawn-agents`, 1× `codeweaver` (`wi-cw`)         | stub `done`              | `wi-cw`: in_progress(+sessionId/agentId/startedAt) → complete; `op-cw` → complete; advance creates a `ward` work item for `op-ward1`                                                                    | `RUNNING`→`DONE`; ledger row `op-cw` marks complete                |
| 2 | `run-ward`, `mode: changed`                       | `run-ward` (real, green) | ward work item complete; `op-ward1` complete; `wardResults[]` +1; ward `relatedDataItems` gains `wardResults/<id>`; advance → the FIRST `flowrider` work item                                            | `Ward exit code: 0 (changed)`; no detail (green)                   |
| 3 | `spawn-agents`, 1× `flowrider` (`op-flow1`)       | stub `done`              | `op-flow1` complete; advance → `op-flow2` (a SECOND, distinct `flowrider` work item — strict 1:1 holds because each links its own operation item)                                                       | `RUNNING`→`DONE`; the row lists ONLY `flow-1`'s name               |
| 4 | `spawn-agents`, 1× `flowrider` (`op-flow2`)       | stub `done`              | `op-flow2` complete; advance → `op-siege1`. Assert exactly TWO `role: flowrider` items total, each with a single-element `flowIds` naming its own flow                                                   | `RUNNING`→`DONE`; the row lists ONLY `flow-2`'s name               |
| 5 | `spawn-agents`, 1× `siegemaster` (`op-siege1`)    | stub `done`              | `op-siege1` complete; advance → `op-siege2`                                                                                                                                                              | `RUNNING`→`DONE`; the row lists ONLY `flow-1`'s name               |
| 6 | `spawn-agents`, 1× `siegemaster` (`op-siege2`)    | stub `done`              | `op-siege2` complete; advance → `ward(full)` work item. Assert exactly TWO `role: siegemaster` items total, each with a single-element `flowIds` naming its own flow, **and that NO new operation item was appended after `op-siege2`** — no standards-review item is ever minted | `RUNNING`→`DONE`; the row lists ONLY `flow-2`'s name               |
| 7 | `run-ward`, `mode: full`                          | `run-ward` (real, green) | ward complete; `op-ward2` complete; **no pending operation item → quest derives `complete`**                                                                                                            | terminal banner; all rows `DONE`; `EXECUTION — 7/7 OPERATIONS`     |
| 8 | `idle` (~25s long-poll)                           | —                        | no incomplete work                                                                                                                                                                                      | —                                                                  |

**PASS:** quest `complete`, every field asserted in `quest.json` and mirrored live (correct labels, distinct logs, ward
exit-code shown, ledger drained), terminal banner present. The two-flow quest ran SEVEN operation items — TWO
flowrider sessions and TWO siegemaster sessions, one of each per flow.

> **get-agent-prompt will fail** at any agent step if the linked operation item isn't in `operations[]` — that's the
> missing-seed failure mode (§6 / G4), not an orchestration bug. Confirm the operation items are present before
> dispatching.

---

# Flow 2 — Sad paths (partial → pt N, and the operator's real signal table)

None of these is a failure. Each keeps the quest `in_progress` and moves it forward.

The orchestrator's handling of `partial`/`blocked` is identical for every locked role — complete the item, append
`pt N`, bound the `partial` chain by `slotManagerStatics.<role>.maxAttempts`. What DIFFERS is what a REAL session of
each role ever sends: `flowrider` and `siegemaster` are **operators** whose own prompts offer only `done` and
`blocked` — each loops internally, unbounded, until its own named reviewer's verdict says `pass`, and never emits
`partial` at all. A stub sending `partial` for one of these roles is exercising the responder's generic mechanism
(useful for proving the plumbing), not something a real prompt does.

### 2A — Codeweaver `partial` → pt N (unbounded, mechanism-only)

Seed a single codeweaver operation item + work item (as Flow 1 step 1). Dispatch the stub with
`operationStatus: 'partial'` to exercise the generic mechanism.

| # | get-next-step                     | dispatch      | assert                                                                                                            |
|---|-------------------------------------|----------------|--------------------------------------------------------------------------------------------------------------------|
| 1 | `spawn-agents`, 1× `codeweaver`   | stub `partial`| work item terminal (`complete`); `op-cw` → `complete`; a `"pt 2: {text}"` operation item appended; advance creates a FRESH codeweaver work item for it (new `execution-row-layer-widget` row live; ledger grows) |
| 2 | `spawn-agents`, 1× `codeweaver` (pt 2) | stub `done` | `op-cw pt 2` → `complete`; advance moves on. **Strict 1:1** — assert NO operation item ever had two work items    |

Repeat `partial` several times to confirm the codeweaver `pt N` chain is **unbounded** (unlocked role — never blocks).

### 2B — Flowrider / Siegemaster: `blocked` on a wall, `done` on a real pass (bounded `partial` is mechanism-only)

Seed the Flow 1 ledger (TWO flows, two flowrider items + two siegemaster items) so the first `flowrider` item is
next.

- **The real path:** dispatch `done` once the stub reports its reviewer would say `pass`. `op-flow1` completes with no
  append; advance moves to `op-flow2`.
- **The wall path:** dispatch `blocked` with a `blockedReason`. `op-flow1` completes, a `pt 2` flowrider item is
  appended carrying the SAME single `flowId`, the work item is `failed` carrying the reason, and the quest halts
  immediately — advance does NOT run. This is the only sad path a real flowrider/siegemaster session takes.
- **Mechanism-only path (`partial`):** dispatch `partial` repeatedly to prove the generic pt-chain bound still works
  for a locked role — the chain grows until it reaches `slotManagerStatics.flowrider.maxAttempts` (3) → **`blocked`**
  (no more append). This is a responder-level property, not something a real flowrider prompt would ever trigger.

Repeat the whole table with a `siegemaster` item next (e.g. `op-siege1`): same shape, but its continuation (were
`partial` ever sent) carries only THAT item's single `flowId` — a chain reaching
`slotManagerStatics.siegemaster.maxAttempts` on one flow's item blocks the quest without touching the other flow's
separate item and separate budget.

There is no standards-review role to repeat this with: after the last `siegemaster` item settles, the next dispatched
item is `ward(full)` and NOTHING is appended in between. Assert that directly — a run that mints an extra operation
item after a committing session is the regression this shape exists to catch.

**Critical:** confirm the redelivery no-op (G/A5) — call `signal-back` twice for the same terminal work item; the second
must NOT mint a second `pt N` or a second work item.

---

# Flow 3 — Ward, block, and resume

### 3A — Ward red → spiritmender operation item → re-ward (no ward loop)

Seed so a `ward(changed)` item is next. Break a real ward-catchable defect in a git-changed file (§5), then run real
`run-ward`.

| # | get-next-step               | dispatch                | assert                                                                                                                                         |
|---|-------------------------------|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | `run-ward`, `mode: changed` | `run-ward` (real, red)  | ward work item `failed` + `errorMessage: ward_failed`; ward operation item `complete`; `wardResults[]` +1 (exitCode 1); a `spiritmender` operation item + a fresh `ward` operation item (`pt N`, same `wardMode`) appended AFTER it; advance → the **spiritmender** is next | UI: ward row `FAILED` + `Ward exit code: 1 (changed)` + detail breakdown; new spiritmender + fresh ward rows appear live |
| 2 | `spawn-agents`, 1× `spiritmender` | stub `done`       | spiritmender operation item complete; advance → the fresh ward re-runs                                                                          |
| 3 | `run-ward`, `mode: changed` | `run-ward` (real, green — restore the file first) | fresh ward operation item complete; advance → the next role                                                        |

### 3B — Ward budget exhausted → blocked

Repeat 3A's red ward without fixing until the red-ward chain of the `wardMode` reaches `slotManagerStatics.ward.maxRetries`.

| # | get-next-step               | dispatch               | assert                                                                                                                      |
|---|--------------------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------------|
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

The three operator roles each carry their OWN prompt file, and each summons its own named reviewer sub-agent(s):
`codeweaver-prompt` (+ `codeweaver-reviewer`), `flowrider-prompt` (+ `flowrider-reviewer`), `siegemaster-prompt` (+
`siegemaster-reviewer` and `siegemaster-walker`), plus the shared blocks they interpolate
(`standards-review-concerns-statics`, `flow-evidence-contract-statics`), the bespoke prompts `spiritmender-prompt`,
`warpgate-prompt`, `glyphsmith-prompt`, `tavernkeeper-prompt`, `dumpster-create-prompt`, `dumpster-hunt-prompt`, plus
`chaoswhisperer-gap-minion`. There is no shared operator template and no generic planner/worker/reviewer minion any
more — walk each of the ten `agentPromptClassificationStatics.promptNames` files on its own.

### Procedure (per prompt)

1. **Read** the static.
2. **Enumerate the required capabilities.** For an operator prompt: does it verify the item against git + the ledger
   itself, read the code it needs to change, write its own working notes, brief generic sub-agents in its own words,
   read the diff, summon exactly its own named reviewer (and, for siegemaster, `siegemaster-walker`), loop on `rework`,
   and stop only on `pass` (→ `done`) or `wall` (→ `blocked`)? For a named reviewer/walker: does it load the standards
   itself where relevant, does it fetch with `{ agent, questId }` and no `workItemId`, does it refuse to summon a
   sub-agent of its own (it is a LEAF), and does it refuse `signal-back` and (for the reviewer) do the git it owns —
   build, ward `--staged`, commit once, push bare?
3. **Trace each capability to a real mechanism:** does the prompt name the exact MCP tool / command / file path /
   static, and does it still exist? (`discover` to confirm — don't trust the prompt.) Are referenced signals/fields
   valid against current contracts (`signal-back` = `complete` + `operationStatus`; agents never write `operations`;
   `get-qa-checklist({ questId, operationItemId })` derives the track/flows/packages from the item itself)? Any holes —
   a value never provided in the interpolated scope, a tool the role can't call, a file read before it's written, stale
   wording?
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
(2) Flow 0 (Start Quest seed shape / per-flow fan-out); (3) Flow 1 (pre-seeded relay) end to end; (4) Flow 2
(partial → pt N — the responder's generic mechanism, plus the operator's real `done`/`blocked` signal table); (5) Flow
3 (ward red → spiritmender, ward budget → block, orphan → resume), clean FIFO before each; (6) prompt-walk; (7) abandon
all smoketest quests, confirm the quest queue is clean.
