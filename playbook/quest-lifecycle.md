# Quest Lifecycle — Fundamentals (LLM reference)

How a quest comes into being and moves from a user request to built, verified code. Read this to understand the model
before driving or testing orchestration. Companion: `docs/quest-role-paths.md` (deeper state-machine reference) and
`packages/orchestrator/CLAUDE.md` (wiring).

---

## The mental model (the one thing to internalize)

**Execution is a reactive relay over an ordered `operations` ledger on the quest.** The orchestrator does NOT spawn
execution agents — it is the state machine that works the ledger one agent *session* at a time. A dispatcher drives it.
Actors:

1. **Dispatcher** — the loop that actually spawns agents. Two interchangeable drivers, both sharing the same brain
   (`quest-get-next-step-broker` + `signal-back` + the dispatch scan):
    - **Node/UI mode (primary)** — the `/queue` page play button starts the server-side Node dispatch runner, which
      loops `get-next-step` in-process and spawns headless `claude -p` children (one per instruction).
    - **MCP mode** — `/dumpster-launch`, a brainless loop in the user's own Claude session: `get-next-step()` →
      `Task()` (agents) / `run-ward` (ward) → await → repeat. Decides nothing.
2. **MCP stdio child** — exposes the tools (`create-quest`, `get-next-step`, `get-agent-prompt`, `signal-back`,
   `run-ward`, `modify-quest`, …). Quest tools route to the orchestrator.
3. **Orchestrator service** — owns `quest.operations[]` (the ledger), `quest.workItems[]` (the sessions), and all
   "what runs next" math. Reads `quest.json` fresh from disk every scan; never spawns Claude itself.

Everything below is state stored in one `quest.json` file per quest, on disk under
`<DUNGEONMASTER_HOME>/guilds/<guildId>/quests/<questId>/quest.json`.

---

## 0. Guilds (the container)

A **guild** = one repo registered with dungeonmaster. Stored in `<home>/config.json` as
`{ guilds: [{ id: <UUID>, name, path, urlSlug, createdAt }] }`. `create-quest` matches the guild whose `path` equals the
MCP child's cwd; if none matches it **throws** (`"No guild registered for current directory… Run dungeonmaster init"`).
(Auto-create-on-first-quest is an in-progress feature, not yet merged.) Quests live under `guilds/<guildId>/quests/`.

---

## 1. The operations ledger + work items (the core data model)

Two arrays on the quest drive everything:

- **`quest.operations: OperationItem[]`** — the durable, ordered plan/status ledger. Each item is
  `{ id, role, text, status: pending | in_progress | complete, locked, wardMode? }`. `text` is a prose description
  (a continuation is auto-named `"pt N: {text}"`); `locked` marks orchestrator/Chaos-owned items the user's
  `modify-quest` cannot delete; `wardMode` (`changed | full`) is present only on `role: ward` items. There is **no
  `partial` status** — a `partial` outcome becomes a `pt N` continuation (see §8). The ledger has exactly **two
  writers**: ChaosWhisperer (authors the implementation items at spec time) and the orchestrator (mutates status at
  runtime). Execution agents NEVER write it.
- **`quest.workItems[]`** — one agent *session* each (`role`, `status`, `dependsOn`, `relatedDataItems`, `sessionId`,
  `agentId`). **Strict 1:1 invariant: every work item links to exactly one operation item via
  `relatedDataItems: ['operations/<id>']`, and each operation item is worked by exactly one work item over its life.**

The relay is the sequential progression of work-item sessions through the ledger, one active work item at a time. Git
is the record of what was built; the ledger is the plan/status; commit messages are the cross-session handoff.

---

## 2. Creation

`mcp__dungeonmaster__create-quest({ userRequest, questType? })` →
`<home>/guilds/<guildId>/quests/<questId>/quest.json` at `status: "created"`, with:

- the verbatim `userRequest`, a placeholder `title`, `questType` (`feature` default, or `bug-hunt`);
- a seeded **plan** operation item `{ role, text: "Author spec + implementation plan", status: in_progress, locked }`
  (role from `questTypeRegistryStatics` — `chaoswhisperer` for feature; bug-hunt seeds no chat work item);
- one seeded intake work item (feature's `chaoswhisperer`) whose `relatedDataItems` is stitched to the plan item
  (`operations/<planId>`). **So every work item, from the first, carries an `operations/<id>` link.**

Returns `{ questId, guildSlug }`.

---

## 3. Spec phase (ChaosWhisperer) — created → approved

ChaosWhisperer (the `/dumpster-create` slash-command session, NOT a Task agent) interviews the user and writes the spec
via `modify-quest`, walking the status gates:

```
created → explore_flows → review_flows → [user APPROVE] → flows_approved
        → explore_observables → review_observables → [user APPROVE] → approved
        → (optional design) explore_design → review_design → [APPROVE] → design_approved
```

It writes: **flows** (mermaid-style node/edge graphs; `flowType: runtime | operational`), **observables** (BDD
given/when/then embedded in `flows[].nodes[].observables[]`), **contracts** (branded data/endpoint/event shapes),
**designDecisions**, **toolingRequirements**, and **packagesAffected[]**.

**ChaosWhisperer also authors the operations ledger** — during `explore_observables` it appends the ordered
`{ role: 'codeweaver', text }` implementation items (one per scope a Codeweaver session builds) via `modify-quest`.
This is the **only** ledger authoring an agent ever does. The **approval gate** refuses `approved` until the ledger has
at least one `role: 'codeweaver'` item (feature quests). The two APPROVE buttons are the only manual gates;
`approved` (or `design_approved`) is the launch-ready state.

> Smoke tests usually start *here* — at `approved`, with flows + observables + a codeweaver-bearing operations ledger —
> because the spec phase is interactive and expensive.

---

## 4. Start Quest — approved → in_progress (seeds the relay)

The Web UI "Start Quest" button → `orchestration-start-responder`. It seeds the relay and flips status to `in_progress`
(it spawns nothing — the active dispatcher picks the quest up on its next scan). `questBuildRelayGraphBroker`, reading
`questTypeRegistryStatics[quest.questType]`, in one atomic `questOperationsUpdateBroker` persist:

1. Force-completes any non-complete intake (`chaoswhisperer` / `glyphsmith`) operation item.
2. Appends the type's `startImplementationOps` + the fixed verify tail (`relayTail`) as **locked, pending** operation
   items.
3. Creates ONE work item for the first actionable (`pending`) operation item, linked `operations/<id>`, depending on
   the completed chat work items.

The seed is idempotent — a re-Start detects the already-appended locked ward tail and skips straight to the transition.

The two quest types differ only in their ledger shape:

- **feature** (`/dumpster-create`): `startImplementationOps` is empty (ChaosWhisperer authored the `codeweaver` items
  at spec time). Verify tail = `ward(changed) → flowrider → siegemaster → lawbringer → blightwarden → ward(full)`.
- **bug-hunt** (`/dumpster-hunt`): `startImplementationOps` = a single orchestrator-seeded `pesteater` item. Verify
  tail = `ward(changed) → lawbringer → blightwarden → ward(full)` (no flowrider/siegemaster).

So the full feature relay is:

```
codeweaver ×N (Chaos-authored)
  → ward(changed) → flowrider → siegemaster → lawbringer → blightwarden → ward(full)
```

---

## 5. The dispatch engine — `get-next-step`

The dispatcher polls `get-next-step()`. Each call:

1. **Load active quests** across all guilds; filter to `in_progress` with incomplete work; pick the **oldest by
   `createdAt`** (FIFO, single active quest). A `blocked`/`paused` quest is not scanned.
2. **Compute the ready work item.** Because advance creates only ONE work item at a time (depending on the last
   terminal item), there is at most one dispatchable work item at any moment.
3. **Return a NextStep:**
    - a ready `ward` item → `{ type: 'run-ward', questId, workItemId, mode }` — **ward always dispatches alone**;
    - else the single first ready work item → `{ type: 'spawn-agents', agents: [{ questId, role, workItemId,
      taskPrompt }] }`;
    - nothing ready → long-poll (~25s) → `{ type: 'idle' }`.
4. **Self-heal.** As a last resort — after nothing dispatchable is found — the scan calls `questAdvanceBroker` for a
   quest that has an actionable operation item but no live linked work item, then re-scans. This is how a server that
   stopped between an operation `complete` and the advance still makes progress on restart.

The `taskPrompt` is a stub telling the agent to call `get-agent-prompt` then `signal-back`. For a resumed session the
dispatcher hands a resume prompt instead and spawns `claude --resume` (see §12).

---

## 6. Agent dispatch — `get-agent-prompt`

For each `spawn-agents` agent, the dispatcher spawns a sub-agent (Task under `/dumpster-launch`, or a headless child
under Node mode) that first calls `get-agent-prompt({ agent, workItemId, questId })`. This does two things:

1. **Stamps identity:** flips the work item `pending → in_progress`, sets `sessionId` (parent) + `agentId`
   (the sub-agent's realAgentId) + `startedAt`. Identity is resolved MCP-side from
   `request.params._meta.claudecode/toolUseId` scanned against the session's `subagents/agent-*.jsonl` files.
2. **Builds the role prompt** by resolving the work item's linked operation item (`operations/<id>`) and interpolating
   its scope (text, package, contracts, file paths). Flowrider / Siegemaster / Lawbringer / Blightwarden self-scope
   over ALL quest flows / the whole diff — they read the quest context directly, not a per-flow ref.

Ward is the exception: it is a command item (`spawnerType: 'command'`) with no `get-agent-prompt` call — the dispatcher
calls the `run-ward` MCP tool for it (§10).

---

## 7. Result handoff — `signal-back`

When an agent finishes it calls `signal-back({ questId, workItemId, signal: 'complete', operationItemId?,
operationStatus? })`. `complete` is the **sole** signal kind — a session-terminal marker. The operation OUTCOME rides
on the same call as `operationStatus` (`done | partial`; `failed` is rejected). There is **no failure signal** — agents
fix their own problems and move forward. `quest-handle-signal-back-responder` applies the outcome server-side
(authoritative — an agent cannot forget to patch the ledger, because agents never write it), in ONE atomic
`questOperationsUpdateBroker` persist:

1. Marks the signaled work item terminal (`complete`, `completedAt`).
2. Resolves the linked operation item (the call's `operationItemId`, else the work item's `operations/<id>` ref).
3. `operationStatus: 'done'` (or absent) → marks that operation item `complete`.
4. `operationStatus: 'partial'` → marks it `complete` AND appends a `"pt N: {text}"` continuation item (same role,
   `locked`/`wardMode` preserved) immediately after it — **duplicate-on-partial**.
5. Calls `questAdvanceBroker` to create the next work item.

The handler is **idempotent**: a redelivered signal for an already-terminal work item is a no-op (no second `pt N`, no
second work item).

---

## 8. The operations relay — advance, from create to complete

`questAdvanceBroker` is the relay engine. Called from TWO places, both idempotent: the signal-back handler (after
marking a work item terminal) and the dispatch scan's self-heal. In one `questOperationsUpdateBroker` write:

1. Find the FIRST operation item with `status === 'pending'`. None → create nothing (the status transformer derives
   `complete`).
2. **Strict-1:1 resume guard:** if that pending item already has ANY linked work item, do NOTHING (its session is live,
   or orphan recovery will resume it). No duplicate work item is ever possible — across double signals, re-entrant
   scans, and restarts.
3. Else create ONE work item for the operation's `role` (`spawnerType: 'command'` for `ward`, else `agent`; copying
   `wardMode`), linked `operations/<id>`, depending on the most-recent terminal work item, and mark the operation
   `in_progress`.

**Duplicate-on-partial is the verify fixpoint.** For a verify/review role (flowrider, siegemaster, lawbringer,
blightwarden), a session signals `partial` when its pass changed code; the appended `pt N` continuation makes a FRESH
session of the same role re-run against the new state. The role converges when a pass changes nothing and signals
`done` — convergence IS the verdict. A locked role's `pt N` chain is bounded by `slotManagerStatics.<role>.maxAttempts`
(ward by `slotManagerStatics.ward.maxRetries`); a spent chain blocks the quest. An unlocked `codeweaver` item's `pt N`
chain is unbounded — codeweavers pivot in place freely.

Trace a feature quest end to end: `codeweaver ×N → ward(changed) → flowrider → siegemaster → lawbringer → blightwarden
→ ward(full)`. After `ward(full)` is green, no `pending` operation item remains and the operation-aware status
transformer derives `complete`. The dispatcher's next `get-next-step` picks up the next FIFO quest.

---

## 9. Ward — `run-ward` (the one non-agent role)

Ward items are `spawnerType: 'command'`. The dispatcher calls `run-ward({ questId, workItemId, mode })` instead of a
Task. `quest-run-ward-broker` runs `dungeonmaster-ward`, appends a `wardResults[]` ref
(`{ id, createdAt, exitCode, runId?, wardMode }`), and applies the result to the ledger + work item — keyed on the real
exit code inside the broker (it cannot be staged by editing `quest.json`):

- **green (exit 0)** → mark the ward operation item `complete` + the ward work item `complete` (adding
  `relatedDataItems += wardResults/<id>`), advance to the next role.
- **red (exit ≠ 0)** → mark the ward work item `failed` and the ward operation item `complete`, then append a
  `spiritmender` operation item PLUS a fresh ward continuation (`"pt N"`, same `wardMode`) immediately after it, and
  advance. The next dispatched item is the spiritmender (never two wards back-to-back); the fresh ward re-verifies after
  the fix.
- **red, budget spent** → the red-ward chain is bounded: once the ward operation items of this `wardMode` since the
  last GREEN ward of the same mode reach `slotManagerStatics.ward.maxRetries`, the broker calls
  `quest-block-on-failure-broker` instead of appending another fix loop.

A ward exit-code red is the **only** failure concept in the orchestrator.

---

## 10. The work-item state machine

```
pending → in_progress → complete            (agent signals complete / ward exit 0)
pending → in_progress → failed              (ward exit ≠ 0)
in_progress → pending                       (orphan recovery — resume, keeps sessionId/agentId)
pending → skipped                           (only via BLOCK; terminal but does NOT satisfy dependents)
```

| status               | terminal? | satisfies a `dependsOn`? | counts as failure? |
|----------------------|-----------|--------------------------|--------------------|
| pending              | no        | no                       | no                 |
| queued / in_progress | no        | no                       | no                 |
| complete             | yes       | **yes**                  | no                 |
| failed               | yes       | **yes**                  | yes                |
| skipped              | yes       | **no**                   | no                 |

The single most important rule: **`failed` satisfies a dependency, `skipped` does not.** A `skipped` dep dead-ends its
dependents permanently — which is how a blocked quest halts. (`queued` exists in the enum but the one-session-at-a-time
relay never batches, so work items sit `pending` until advance creates the single active one.)

---

## 11. Quest status is *derived* (not set by roles)

`workItemsToQuestStatusTransformer` is **operation-aware** and runs inside `questOperationsUpdateBroker` on every ledger
write (precedence order):

1. Pre-execution / user-paused / abandoned / **blocked** statuses → **unchanged** (nothing implicitly reopens
   `blocked`).
2. **Never derive `complete` while any operation item is `pending` or `in_progress`** — that window is exactly "last
   session finished, advance hasn't created the next work item yet." This is the no-false-complete invariant.
3. Every work item terminal AND the ledger drained (all operations `complete`) → **`complete`**.
4. Any work item active → **`in_progress`**.
5. Only pending work items remain, all dead-ended on a `failed` dep, ledger drained → **`blocked`**; otherwise
   **`in_progress`**.

`blocked` is set explicitly by `quest-block-on-failure-broker`; it is NOT terminal (resumable → `in_progress`).
Terminal statuses are `complete` and `abandoned`.

---

## 12. Failure handling & recovery (no failures, only forward)

There is **no PathSeeker, no replan, no `failed` agent signal.** The three non-failure "sad" paths all keep the quest
`in_progress` and move it forward:

- **partial → pt N** (§8) — an agent that can't finish its scope signals `partial`; the orchestrator continues its work
  as a fresh `pt N` session.
- **ward red → spiritmender → re-ward** (§9) — a red ward inserts a spiritmender fix + a fresh ward.
- **orphan → resume** — an `in_progress` work item observed during a scan is orphaned (the one-session-at-a-time
  invariant means get-next-step only runs when nothing is dispatching). `recover-orphaned-work-items-layer-broker`
  flips it back to `pending`, **keeps** `sessionId`/`agentId`, and sets a `resume` marker; `retryCount` increments.
  Node/UI dispatch then **resumes** the retained Claude session (`claude --resume`) so partial work survives. Fallbacks
  fresh-spawn: an early-crash orphan with no captured `sessionId`, and the MCP `/dumpster-launch` Task path (its
  `sessionId` is the parent loop session).

The **sole** path to `blocked` (needs-human) is `quest-block-on-failure-broker`, reached only from a spent bounded loop:
ward-retry exhaustion, a locked role's pt-N chain exhaustion, or orphan-recovery exhaustion
(`retryCount ≥ slotManagerStatics.orphanRecovery.maxResets`). It marks the failed work item `failed`, drains every
still-`pending` work item to `skipped`, and sets status `blocked`. The user resumes a blocked quest (`blocked →
in_progress`).

---

## 13. The validation gates (what blocks a write, and when)

`modify-quest` (= every agent write, and every internal `get-agent-prompt`/`signal-back`/`run-ward` mutation) runs, in
order:

1. **Input allowlist** (`questStatusInputAllowlistStatics`) — per current status, which input fields are writable.
   `operations` is writable ONLY at `flows_approved` / `explore_observables` (and the `review_observables` back-edge),
   where ChaosWhisperer authors the plan — so an execution agent's `modify-quest{operations}` at `in_progress` is
   rejected. `workItems`/`wardResults`/`designPort`/`pausedAtStatus` are **server-only** (set by internal brokers;
   stripped from the MCP tool surface). The orchestrator's own runtime ledger writes go through
   `questOperationsUpdateBroker`, which bypasses the allowlist.
2. **Status-transition guard** — the from→to hop must be legal (only when `status` is in the input).
3. **Gate-content guard** — required content present for the target status (`flows` before `approved`/`design_approved`;
   plus, for a **feature** quest, an `operations` ledger with ≥1 `role: 'codeweaver'` item before `approved`).
4. **Save-invariants** (EVERY write, post-mutation) — structural integrity, lenient: no duplicate ids; `dependsOn` ids
   resolve; `relatedDataItems` reference valid collections (`operations`/`wardResults`/`flows`) + existing ids; the
   work-item graph is a DAG.

**Direct disk edits to `quest.json` bypass ALL of these** — that's why hand-seeding is the way to stage arbitrary
states. But the moment an MCP tool touches the quest, save-invariants (4) run on the whole thing, so a seed must at
least satisfy those invariants.

---

## 14. Keep-consistent rules when hand-editing `quest.json`

- A work item's `relatedDataItems` MUST include exactly one `operations/<id>` pointing at an `operations[]` item that
  exists on the quest (or `get-agent-prompt` cannot resolve the scope). `wardResults/<id>` is stamped by `run-ward`,
  not by you.
- Each operation item is worked by exactly ONE work item over its life (strict 1:1) — never re-link, never revert an
  operation's status by hand.
- `dependsOn` between work items is the ONLY ordering mechanism — no hardcoded role sequence.
- A ready ward item always dispatches via `run-ward`, alone.
- Use an `operational` flow for flowrider/siegemaster runtime seeds to avoid needing a dev server (runtime flows
  resolve `.dungeonmaster.json` dev-server config; operational flows don't).
