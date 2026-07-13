# Quest Orchestration — Role Paths & the Operations Relay

This is the end-to-end reference for how a quest moves from a user request to built, tested, and
quality-checked code. Unit tests cover individual brokers and transformers; this doc covers the
**system-level behavior** — the dispatch model, the operations ledger, the work-item relay, the
per-role happy and sad paths, and how quest status is derived.

Orchestration integration tests are written against this document (every role, happy path AND sad
path, per repo policy), so it is precise about each role's transitions and the orchestrator's
reaction to every signal.

The JSONL chat-translation pipeline (raw Claude CLI output → `ChatEntry[]`) is a separate concern
documented in `packages/orchestrator/CLAUDE.md`. This doc focuses on orchestration control flow.

---

## The model in one paragraph

A quest carries a small, ordered **`operations` ledger** (`quest.operations: OperationItem[]`) — the
durable plan-and-status record. The orchestrator runs a **reactive relay**: it works the ledger one
work-item session at a time. `questAdvanceBroker` finds the first `pending` operation item, creates
exactly ONE work item for it (marking the operation `in_progress` in the same atomic write), and the
dispatch scan spawns that work item's agent. When the agent finishes it calls `signal-back`; the
orchestrator marks the operation `complete` and calls `questAdvanceBroker` again to create the next
work item. There is **no failure concept except a ward exit-code red**, and **no recovery-first
routing, no PathSeeker, no replan, no pre-built work-item chain.** "Sad" paths are not failures: an
agent that can't finish its scope signals `partial` and the orchestrator continues its work as a
fresh `pt N` session; a ward red appends a spiritmender fix and re-wards; a server crash resumes the
orphaned session. The **sole** path to `blocked` (needs-human) is `quest-block-on-failure-broker`,
reached only when a bounded loop is spent.

---

## Core concepts

- **Operations ledger (`quest.operations`)** — an ordered `OperationItem[]`. The durable plan and
  status record. NOT committed to git. It has exactly **two writers**: ChaosWhisperer authors the
  implementation items at spec time (via `modify-quest`, allowlist-gated), and the orchestrator
  mutates status at runtime (via `questOperationsUpdateBroker`). **Execution agents never write it** —
  they read git + the ledger for context and signal an outcome.
- **OperationItem** — `{ id, role, text, status, locked, wardMode? }`
  (`operation-item-contract.ts`). `status` is `pending | in_progress | complete` (there is **no
  `partial` status** — see duplicate-on-partial). `text` is a prose description; a continuation is
  auto-named `"pt N: {text}"`. `locked` marks orchestrator/Chaos-owned items (the plan item and the
  fixed verify tail) that `modify-quest` cannot delete. `wardMode` (`changed | full`) is present only
  on `role:ward` items.
- **Work item (`quest.workItems[]`)** — one agent *session* (`sessionId` / `agentId` / transcript).
  **Strict 1:1 invariant: every work item links to exactly one operation item via
  `relatedDataItems: ['operations/<id>']`, and each operation item is worked by exactly ONE work item
  over its life** — never re-linked, never status-reverted. Ward work items additionally carry a
  `wardResults/<id>` ref.
- **Relay** — the sequential progression of work-item sessions through the ledger, one active work
  item at a time.
- **Duplicate-on-partial** — when an agent signals `operationStatus: 'partial'`, the orchestrator
  marks that operation item `complete` and appends a NEW `"pt N: {text}"` item (same role, `locked`
  flag preserved) immediately after it; advance creates the next work item against the new item. This
  preserves strict 1:1 and gives an immutable `pt` audit trail instead of reverting a shared item's
  status.
- **Fixpoint** — the `pt N` chain for a verify/review role. Each pass that changes something completes
  its item and spawns `pt N+1`; a pass that changes nothing signals `done` and the chain ends.
  Convergence IS the verdict: a fresh pass that changed nothing is acceptance.
- **Git is the record of what was built.** The ledger is the plan/status; commit messages are the
  cross-session handoff. A stale ledger self-heals because the next agent verifies against git first.

---

## Quest types and their relay tails

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). `questTypeRegistryStatics`
(`@dungeonmaster/shared/statics`) is the single source of truth per type: the intake slash command,
the create-time seed role (`initialWorkItemRole`), the implementation operation items the orchestrator
seeds at Start (`startImplementationOps`), and the fixed verify tail (`relayTail`).
`questBuildRelayGraphBroker` appends `startImplementationOps` + `relayTail` as **locked, pending**
operation items at Start Quest.

| Type       | Intake                              | Implementation ops                                                         | Verify tail (appended at Start, all locked)                                               |
|------------|-------------------------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `feature`  | `/dumpster-create` (ChaosWhisperer) | **Chaos-authored** `codeweaver` items (`startImplementationOps` is empty)  | `ward(changed) → flowrider → siegemaster → lawbringer → blightwarden → ward(full)`        |
| `bug-hunt` | `/dumpster-hunt` (BugHunt intake)   | orchestrator-seeded `pesteater` (`initialWorkItemRole` is null)            | `ward(changed) → lawbringer → blightwarden → ward(full)`                                   |

So the full feature relay is:

```
chaoswhisperer (plan item)   → codeweaver ×N (Chaos-authored)
  → ward(changed) → flowrider → siegemaster → lawbringer → blightwarden → ward(full)
```

and the full bug-hunt relay is:

```
pesteater
  → ward(changed) → lawbringer → blightwarden → ward(full)
```

Each verify/review role is **ONE** operation item that self-scopes over **every** quest flow / the
**whole** diff internally — there is no per-flow chaining and no per-package chunking in the ledger.
Bug-hunt reuses the same flow/observable spec lifecycle (the reproduction path is a flow, the expected
behavior is an observable that PestEater turns into a failing test).

---

## Dispatchers: two drivers, one relay

The same relay is driven by two interchangeable dispatchers; both share `questAdvanceBroker`,
`signal-back`, and the dispatch scan, so the relay logic is identical for both. **Node/UI mode is the
primary driver.**

| Surface                          | Dispatcher                     | What it does                                                                                                                                        |
|----------------------------------|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| Web UI `/queue` page play button | **Node/UI mode (primary)**     | The server-side Node dispatch runner loops `get-next-step` in-process and spawns headless `claude -p` children (one per SpawnInstruction).           |
| `/dumpster-launch` slash command | **MCP mode**                   | A brainless loop in the user's own Claude session: `get-next-step()` → `Task()` for agents / `run-ward` MCP tool for ward → await → repeat.          |
| Web UI "Start Quest" button      | —                              | Calls `OrchestrationStartResponder`: seeds the relay and flips status `approved → in_progress`. **Spawns nothing** — the active dispatcher picks it up. |

The two modes are mutually exclusive via `<dungeonmasterHome>/dispatch-state.json`. `get-next-step`
long-polls internally (~25s) before returning `{ type: 'idle' }` when nothing is ready.

---

## Quest status lifecycle

```
created → explore_flows → review_flows → [Gate#1 user approves] → flows_approved
        → explore_observables → review_observables → [Gate#2 user approves] → approved
        → (optional) explore_design → review_design → [Gate#3 user approves] → design_approved
        → in_progress → complete
                        ├→ blocked → in_progress      (needs-human; user resumes)
                        └→ abandoned
   (paused is reachable from any pre-terminal status and returns to it)
```

There are no `seek_*` statuses. **`approved → in_progress` and `design_approved → in_progress` are
direct** — the only manual transitions in the execution phase. Everything after `in_progress` is
driven by the operations relay.

| Status                                          | Set by                                    | Notes                                                                       |
|-------------------------------------------------|-------------------------------------------|-----------------------------------------------------------------------------|
| `created`                                       | `create-quest`                            | Intake agent's first action; seeds the plan operation item (see below)      |
| `explore_flows` … `review_observables`          | ChaosWhisperer (via `modify-quest`)       | The only roles that set status directly                                     |
| `flows_approved`, `approved`, `design_approved` | **User** (APPROVE button)                 | The approval gates; `approved` requires a valid operations ledger           |
| `in_progress`                                   | `start-quest` / Start Quest button        | Spec locked; the relay is seeded and dispatch begins                        |
| `complete`, `blocked`                           | Derived / set by the orchestrator         | `complete` derived by `workItemsToQuestStatusTransformer`; `blocked` set only by `quest-block-on-failure-broker` |
| `paused`, `abandoned`                           | User                                      | Not derived over — owned by the user                                        |

**The approval gate** (`quest-gate-content-requirements-statics`) requires, for a **feature** quest,
that the operations ledger contain at least one `role:codeweaver` item before `approved` is reachable.
Bug-hunt is exempt (its `pesteater` implementation op is orchestrator-seeded at Start, not authored at
spec time). The gate is enforced in `quest-modify-broker` (the `approved` transition) and the web
approve button.

---

## The operations ledger, from create to complete

Trace one feature quest end to end.

1. **Quest create** (`quest-create-broker`). For a type with an intake agent (feature's
   `chaoswhisperer`), create seeds ONE **plan** operation item
   `{ role: chaoswhisperer, text: "Author spec + implementation plan", status: in_progress, locked }`
   and stitches its `operations/<id>` ref into the caller-supplied intake work item. **Every work
   item, from the first, carries exactly one `operations/<id>` link.**

2. **ChaosWhisperer** builds flows / observables / contracts / `packagesAffected[]` and **appends the
   `codeweaver` implementation operation items** (e.g. `core: config load+validate`, `cli:
   precheck+dispatch`, …) via `modify-quest`. These items are **unlocked** (Chaos-authored). The
   approval gate refuses `approved` until at least one `codeweaver` item exists.

3. **User approves** → **Start Quest** (`OrchestrationStartResponder`):
   - `questBuildRelayGraphBroker` force-completes any non-complete intake (`chaoswhisperer` /
     `glyphsmith`) operation item, appends `startImplementationOps` + the fixed verify tail as
     **locked, pending** operation items, and creates ONE work item for the first actionable
     (`pending`) operation item — the first `codeweaver` — linked `operations/<id>`, depending on the
     completed chat work items.
   - The seed is persisted via `questOperationsUpdateBroker` **before** the status flips to
     `in_progress`. Both the seed and the transition are idempotent (a re-Start detects the already-
     appended locked ward tail and skips straight to the transition).

4. **The dispatch loop** picks up that codeweaver work item. The agent reads its operation item + git
   + the ledger, verifies it's the right next step, builds, commits a prose handoff, and signals
   `complete` carrying `operationItemId` + `operationStatus: 'done'`.

5. **`QuestHandleSignalBackResponder`**, in ONE atomic `questOperationsUpdateBroker` write, marks the
   work item terminal (`complete`) + the linked operation item `complete`, then calls
   `questAdvanceBroker` → the next `pending` operation item (the next `codeweaver`) gets its work item.
   Repeat until all codeweaver items are complete.

6. **Ward operation items** are dispatched as `run-ward` (`spawnerType: 'command'`) and handled by
   `quest-run-ward-broker` (see the ward path below).

7. **Verify/review roles** (flowrider → siegemaster → lawbringer → blightwarden) each run as one
   session, looping via the `pt N` fixpoint until a pass changes nothing. After `blightwarden`
   converges, `ward(full)` runs; on green, no `pending` operation item remains and the
   operation-aware status transformer derives `complete`.

---

## The relay engine

### `questAdvanceBroker` — creates the next work item

Called from TWO places, both idempotent: (i) `QuestHandleSignalBackResponder` after marking a work
item terminal, and (ii) the dispatch scan as a **self-heal** (`scan-once-layer-broker`), so a server
that stopped between an operation `complete` and the advance still progresses on restart. In one
`questOperationsUpdateBroker` write:

1. Find the FIRST operation item with `status === 'pending'`. None → create nothing (the status
   transformer derives `complete`).
2. **Strict-1:1 resume guard:** if that pending item already has ANY linked work item, do NOTHING
   (its session is live, or orphan recovery will resume it). No duplicate work item is ever possible —
   across double signals, re-entrant scans, and restarts.
3. Else create ONE work item for the operation's `role` (`spawnerType: 'command'` for `ward`, else
   `agent`; copying `wardMode`), linked `operations/<id>`, depending on the most-recent
   dependency-satisfying work item (a linear chain used for dispatch ordering), and mark the operation
   `in_progress`.

### Dispatch selection

`compute-next-step-from-quest-layer-broker` + `select-batch-layer-broker` return **one session at a
time**: a ready `ward` item is dispatched alone as `run-ward`; otherwise the single first ready work
item is returned as `spawn-agents`. Because advance only ever creates one work item and it depends on
the last terminal item, there is at most one dispatchable work item at any moment.

### Status derivation (`workItemsToQuestStatusTransformer`)

Runs inside `questOperationsUpdateBroker` on every ledger write (this is where terminal-operation
`complete` fires — there is no trailing `workItems` write when the last operation completes). Given
`{ workItems, operations, currentStatus }`:

1. Pre-execution / user-paused / abandoned / **blocked** statuses are returned unchanged (nothing
   re-opens `blocked` except the user's resume transition).
2. **Never derive `complete` while any operation item is `pending` or `in_progress`** — that window
   is exactly "last session finished, advance hasn't created the next work item yet." This is the
   no-false-complete invariant.
3. Every work item terminal AND the ledger drained (all operations `complete`) → **`complete`**.
4. Every work item terminal, an unrecovered sink failure exists, and no operation is pending →
   **`blocked`** (defensive; the block path normally sets `blocked` explicitly).
5. Any work item active → **`in_progress`**.
6. Only pending work items remain, all dead-ended on a `failed` dep, ledger drained → **`blocked`**;
   otherwise **`in_progress`**.

---

## Per-role paths (happy + sad)

Every execution role signals with the sole signal kind `complete`; the outcome rides on the call as
`operationStatus: 'done' | 'partial'` and the orchestrator applies it server-side (authoritative — an
agent cannot forget to patch the ledger, because agents never write the ledger). Ward is the one
role whose terminal state comes from an exit code, not a signal.

### Chat / intake

| Role               | Operation item                          | Happy                                                                    | Sad                                                                 |
|--------------------|-----------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------|
| **ChaosWhisperer** | the plan item (seeded `in_progress`, locked) | Authors flows/observables/contracts + the `codeweaver` implementation items; at Start Quest `questBuildRelayGraphBroker` force-marks the plan item `complete`. | No execution sad path. The approval gate rejects `approved` if the ledger has no `codeweaver` item. |
| **Glyphsmith**     | (optional design phase)                 | Walks `approved → design_approved`; its plan item is force-completed at Start like ChaosWhisperer. | —                                                                  |

### Implementation

| Role           | Locked? | Happy (`done`)                                                    | Sad (`partial`)                                                                                             |
|----------------|---------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Codeweaver** | No (Chaos-authored) | operation `complete`, work item `complete`, advance → next operation | operation `complete` + a `pt N` continuation appended (unlocked → **unbounded** pt chain — codeweavers pivot in place freely); advance creates a fresh work item that continues from git |
| **PestEater** (bug-hunt) | Yes | operation `complete`, advance → `ward(changed)`                | operation `complete` + `pt N` (locked → **bounded** by `slotManagerStatics.pesteater.maxAttempts`); spent chain → `blocked` |

### Verify / review (feature tail; each self-scopes ALL flows / the whole diff, fixes inline)

Each is a single **locked** operation item. `done` (a pass that changed nothing) advances; `partial`
(a pass that changed something) appends `pt N` for a fresh pass. The `pt N` chain is the fixpoint,
**bounded** by `slotManagerStatics.<role>.maxAttempts`; a spent chain blocks the quest via
`quest-block-on-failure-broker`.

| Role            | Happy (`done`)                    | Sad (`partial`)                                              |
|-----------------|-----------------------------------|-------------------------------------------------------------|
| **Flowrider**   | advance → `siegemaster`           | `pt N` continuation → fresh flowrider pass (bounded)        |
| **Siegemaster** | advance → `lawbringer`            | `pt N` continuation → fresh siegemaster pass (bounded)      |
| **Lawbringer**  | advance → `blightwarden`          | `pt N` continuation → fresh lawbringer pass (bounded)       |
| **Blightwarden**| advance → `ward(full)`            | `pt N` continuation → fresh blightwarden pass (bounded)     |

> `blightwarden` is a single operation item that audits cross-cutting concerns across the whole diff.
> (The `work-item-role-contract` additionally defines five `blightwarden-*-minion` roles; the relay
> tail seeds only one `blightwarden` operation item, so the minions are not relay stages — they are an
> in-session concern of the blightwarden prompt, not documented here.)

### Command

| Role       | Terminal by | Happy (green, exit 0)                                   | Sad (red, exit ≠ 0)                                                                                          |
|------------|-------------|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Ward**   | exit code   | `quest-run-ward-broker` marks the ward work item `complete` + the ward operation item `complete`, advance → next role | work item `failed`, ward operation item `complete`, then appends a **spiritmender** operation item + a **fresh ward** operation item (`pt N`, same `wardMode`) AFTER it, advance → the spiritmender runs next (never a ward back-to-back), then the fresh ward re-verifies |

### Recovery

| Role             | Locked? | Happy (`done`)                                          | Sad (`partial`)                                                             |
|------------------|---------|--------------------------------------------------------|-----------------------------------------------------------------------------|
| **Spiritmender** | Yes     | fixes build/lint/type/test errors; advance → the fresh ward re-runs | `pt N` continuation → fresh spiritmender pass (bounded by `slotManagerStatics.spiritmender.maxAttempts`) |

---

## The three non-failure "sad" paths in detail

None of these is a failure signal. They all keep the quest `in_progress` and move it forward.

### (a) partial → pt N (duplicate-on-partial) — `QuestHandleSignalBackResponder`

On `operationStatus: 'partial'`, in one atomic write: the work item is marked terminal, the linked
operation item is marked `complete`, and a `"pt N: {base text}"` continuation item (same role, same
`locked` flag, same `wardMode`) is inserted immediately after it. `operationPtChainTransformer`
computes `N` from the count of same-base items already on the ledger. Advance then creates a fresh
work item for the continuation. For a **locked** role the chain is bounded by
`slotManagerStatics.<role>.maxAttempts`; reaching it blocks the quest instead of appending. An
**unlocked** codeweaver item is unbounded. The handler is **idempotent**: a redelivered signal for an
already-terminal work item is a no-op (it will not mint a second `pt N`).

### (b) ward red → spiritmender operation item → re-ward — `quest-run-ward-broker`

A red ward marks its work item `failed` and its ward operation item `complete`, then appends a
`spiritmender` operation item plus a fresh `ward` operation item (`pt N`, same `wardMode`) after it.
Advance dispatches the spiritmender next, then the fresh ward re-runs. The red chain is **bounded**:
the broker counts the ward operation items of this `wardMode` since the last GREEN ward of the same
mode; once that count reaches `slotManagerStatics.ward.maxRetries`, it calls
`quest-block-on-failure-broker` instead of appending another fix loop. Ward is the **only** failure
concept in the orchestrator.

### (c) orphan → resume — `recover-orphaned-work-items-layer-broker`

An `in_progress` work item observed during a scan is orphaned (the server restarted, the user killed
it, or it crashed) — under the one-session-at-a-time invariant, get-next-step only runs when nothing
is dispatching. Recovery flips the orphan back to `pending`, **keeps** `sessionId` / `agentId`, and
sets a `resume` marker (when a `sessionId` was captured); `retryCount` increments. `compute-ready`
then selects it and dispatch **resumes** the retained Claude session (`claude --resume`, prompting it
to finish and signal back — Node/UI path). Fallbacks fresh-spawn instead: an early-crash orphan with
no captured `sessionId`, and the MCP `/dumpster-launch` Task path (its `sessionId` is the parent loop
session, so a re-`Task()` is always fresh). Because of strict 1:1, resume never produces a duplicate
work item. Budget: `retryCount ≥ slotManagerStatics.orphanRecovery.maxResets` → the crash loop is
terminal → `quest-block-on-failure-broker`.

A **reconcile net** in the same broker covers the (atomically-unreachable) case where a work item is
terminal but its operation item is still `in_progress`: flip the work item back to `pending` (keeping
identity + resume marker) so it re-dispatches and re-signals. It can never un-complete a quest,
because the status transformer never derived `complete` while an operation was non-complete.

---

## Block ownership

`quest-block-on-failure-broker` is the **sole** path to `blocked`. It marks the failed work item
`failed`, drains every still-`pending` work item to `skipped`, and sets quest status `blocked`. It is
reached only from a spent bounded loop:

1. **Ward retry exhausted** — `quest-run-ward-broker`, when the red-ward chain of a `wardMode` reaches
   `ward.maxRetries` since the last green of that mode.
2. **pt-N chain exhausted** — `QuestHandleSignalBackResponder`, when a **locked** role's `pt N` chain
   reaches `slotManagerStatics.<role>.maxAttempts`.
3. **Orphan recovery exhausted** — `recover-orphaned-work-items-layer-broker`, when a work item's
   `retryCount` reaches `orphanRecovery.maxResets`.

There is no PathSeeker and no replan. A `blocked` quest is not dispatched: the scan filters on
`isAnyAgentRunningQuestStatusGuard` (`== in_progress`), so a `blocked` quest is skipped and dispatch
halts. The user can resume it (`blocked → in_progress`).

---

## Invariants (testable — assert these in integration tests)

### Relay

- **REL-1 — Strict 1:1.** Each operation item is worked by exactly one work item; advance never
  creates a second (the resume guard: a `pending` operation item that already has a linked work item
  is untouched). No duplicate is possible across double signals, re-entrant scans, or restarts.
- **REL-2 — Universal operations link.** Every work item, from the first, carries exactly one
  `operations/<id>` ref (seeded by `quest-create-broker`, `questBuildRelayGraphBroker`, and
  `questAdvanceBroker`).
- **REL-3 — One session at a time.** `select-batch-layer-broker` returns the single first ready work
  item; a ready ward item dispatches alone via `run-ward`.
- **REL-4 — Advance is atomic + idempotent.** Work-item-terminal + operation-`complete` + optional
  `pt N` land in ONE `questOperationsUpdateBroker` persist, so a crash is all-or-nothing. Advance is
  called from both the signal handler AND the scan self-heal, and is safe from both.
- **REL-5 — No false complete.** `workItemsToQuestStatusTransformer` never derives `complete` while
  any operation item is `pending`/`in_progress` (the "all work items momentarily terminal, advance not
  yet run" window).
- **REL-6 — Duplicate-on-partial fixpoint.** `partial` → operation `complete` + a `pt N` continuation
  → a fresh work item. A locked role's chain is bounded; convergence is a fresh pass that signals
  `done` having changed nothing.
- **REL-7 — Idempotent signal.** A redelivered signal for an already-terminal work item is a no-op
  (no second `pt N`, no second advance side effect).

### Ward

- **WARD-1 — Non-looping.** Green ward → advance to the next role (never another ward
  back-to-back); red ward → spiritmender operation item + fresh ward operation item, so the
  spiritmender is dispatched before the re-ward.
- **WARD-2 — Bounded.** The red-ward chain of a `wardMode` since the last green of that mode is
  bounded by `ward.maxRetries`; exceeding it blocks.

### Orphan recovery

- **ORPH-1 — Resume, don't restart.** An orphaned `in_progress` work item flips to `pending` keeping
  `sessionId`/`agentId` + a resume marker; Node/UI dispatch resumes the session (`claude --resume`).
  MCP-Task and no-sessionId orphans fresh-spawn.
- **ORPH-2 — Bounded.** `retryCount ≥ orphanRecovery.maxResets` → `blocked`.

### Block

- **BLK-1 — Sole block owner.** `quest-block-on-failure-broker` is the only writer of `blocked`,
  reached only from ward-retry exhaustion, pt-N-chain exhaustion, or orphan-recovery exhaustion.
- **BLK-2 — A blocked quest is not dispatched.** The scan filters on `in_progress`, so a `blocked`
  quest is skipped and dispatch halts; the user resumes it explicitly.

### Contract integrity

- **C-1 — `dependsOn` references resolve** to existing work items in the same quest.
- **C-2 — The graph is a DAG** (no cycles).
- **C-3 — `relatedDataItems` reference valid collections** — `operations`, `wardResults`, `flows` —
  and existing ids.
- **C-4 — Chat roles set status only within their phase** (ChaosWhisperer: `created` →
  `review_observables`; Glyphsmith: `approved` → `design_approved`).

---

## Full happy path (feature, E2E reference)

```
[USER] /dumpster-create → quest created, plan operation item seeded (in_progress, locked)
   ChaosWhisperer authors flows/observables/contracts + codeweaver operation items
   created → … → review_observables
[USER] APPROVE observables (gate requires ≥1 codeweaver item) → approved
[USER] Start Quest → questBuildRelayGraphBroker appends verify tail (locked, pending),
        force-completes the plan item, creates the first codeweaver work item
        approved → in_progress
[DISPATCHER] Node/UI play button (or /dumpster-launch)
   ▼ codeweaver ×N (one session each)   → done → advance
   ▼ ward (changed)   [run-ward]        → green → advance
   ▼ flowrider                          → done → advance     (pt N until a pass changes nothing)
   ▼ siegemaster                        → done → advance     (pt N fixpoint)
   ▼ lawbringer                         → done → advance     (pt N fixpoint)
   ▼ blightwarden                       → done → advance     (pt N fixpoint)
   ▼ ward (full)      [run-ward]        → green → advance
   No pending operation item remains → workItemsToQuestStatusTransformer derives complete ✓
The dispatcher's next get-next-step picks up the next FIFO quest.
```

Sad-path insertions (all keep the quest `in_progress`): a codeweaver `partial` inserts a `pt N`
codeweaver; a red ward inserts `spiritmender → fresh ward`; a verify role `partial` inserts a `pt N`
of that role; a server crash resumes the in-flight session. Only an exhausted bounded loop
(ward-retry, locked pt-N chain, or orphan recovery) reaches `blocked`.
