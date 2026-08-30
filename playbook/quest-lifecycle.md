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
  (a continuation is auto-named `"pt N: {text}"`); `locked` marks orchestrator-owned items the user's
  `modify-quest` cannot delete; `wardMode` (`changed | full`) is present only on `role: ward` items. There is **no
  `partial` status** — a `partial` outcome becomes a `pt N` continuation (see §8). The ledger has exactly **ONE
  writer: the orchestrator.** No agent ever writes it — the implementation ledger is DERIVED at Start Quest, not
  authored by any chat role.
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
  (role from `questTypeRegistryStatics` — `chaoswhisperer` for feature, `bughunt` for bug-hunt);
- one seeded intake work item whose `relatedDataItems` is stitched to the plan item (`operations/<planId>`). **So
  every work item, from the first, carries an `operations/<id>` link.**

Returns `{ questId, guildSlug }`.

---

## 3. Spec phase (ChaosWhisperer / BugHunt) — created → approved

The intake role (the `/dumpster-create` or `/dumpster-hunt` slash-command session, NOT a Task agent) interviews the
user and writes the spec via `modify-quest`, walking the status gates:

```
created → explore_flows → review_flows → [user APPROVE] → flows_approved
        → explore_observables → review_observables → [user APPROVE] → approved
        → (optional design) explore_design → review_design → [APPROVE] → design_approved
```

It writes: **flows** (mermaid-style node/edge graphs; `flowType: runtime | operational`), **observables** (BDD
given/when/then embedded in `flows[].nodes[].observables[]`), **contracts** (branded data/endpoint/event shapes),
**designDecisions**, **toolingRequirements**, and **packagesAffected[]**.

**The intake role authors NO ledger at all.** `operations` is off the modify-quest allowlist entirely, for every role
at every status — the implementation ledger is DERIVED at Start Quest instead, from the flow nodes' `packages` tags
and the contracts' `source` paths (see §4). The **approval gate** refuses `approved` only for empty `flows`; it
demands no ledger item. The two APPROVE buttons are the only manual gates; `approved` (or `design_approved`) is the
launch-ready state.

> Smoke tests usually start *here* — at `approved`, with flows + observables — because the spec phase is interactive
> and expensive.

---

## 4. Start Quest — approved → in_progress (seeds the relay)

The Web UI "Start Quest" button → `orchestration-start-responder`. It seeds the relay and flips status to `in_progress`
(it spawns nothing — the active dispatcher picks the quest up on its next scan). `questBuildRelayGraphBroker`, reading
`questTypeRegistryStatics[quest.questType]`, in one atomic `questOperationsUpdateBroker` persist:

1. Force-completes any non-complete intake (`chaoswhisperer` / `glyphsmith` / `bughunt`) operation item.
2. Appends the type's `startImplementationOps` + the fixed verify tail (`relayTail`) as **pending** operation items
   (locked, except the `codeweaver` seed). `codeweaver` becomes ONE ITEM PER PACKAGE; `flowrider` and `siegemaster`
   each become ONE ITEM PER FLOW (of either flow type), because their work is strictly serial per flow and each flow
   needs its own budget.
3. Creates ONE work item for the first actionable (`pending`) operation item, linked `operations/<id>`, depending on
   the completed chat work items.

The seed is idempotent — a re-Start detects the already-appended locked ward tail and skips straight to the transition.

**The two quest types share ONE relay** — `questTypeRegistryStatics`' own colocated test asserts `startImplementationOps`,
`relayTail` and `roles` are identical between `feature` and `bug-hunt`. The only difference is the INTAKE:

- **feature** (`/dumpster-create`): seeds a `chaoswhisperer` chat item.
- **bug-hunt** (`/dumpster-hunt`): seeds a `bughunt` chat item. Its spec shape is ONE FLOW PER BUG — the reproduction
  path forks into `ACTUAL:` / `EXPECTED:` terminal nodes, with observables on the `EXPECTED:` side only. Each becomes
  one failing test, written by the **codeweaver** session that owns the package the fix lands in — there is no
  separate bug-hunt implementation role; it lands on the same derived `codeweaver` items a feature quest gets.

So the full relay, for either quest type, is:

```
codeweaver ×N (DERIVED at Start, one item PER PACKAGE)
  → ward(changed)
  → flowrider ×N (DERIVED at Start, one item PER FLOW)
  → siegemaster ×N (DERIVED at Start, one item PER FLOW)
  → ward(full)
```

Each of `codeweaver`, `flowrider`, `siegemaster` is an **operator**: it runs on **opus**, reads code itself, briefs
GENERIC sub-agents (plain `general-purpose` `Agent` dispatches, briefed in its own words) to make the edits, reads the
diff, and summons exactly ONE named sonnet reviewer sub-agent — `codeweaver-reviewer`, `flowrider-reviewer`, or
`siegemaster-reviewer` (siegemaster also dispatches `siegemaster-walker` to drive the system by hand). The operator's
own prompt offers only `done` and `blocked` — the loop inside one session is unbounded, ended by its own reviewer's
`NEXT: pass` verdict, never by a round cap. **No standards-review item is seeded, and none is ever appended** — the
five standards concerns are guidance taken by the operator's own named reviewer, in the same reading pass, and nothing
about that review is written to `quest.json`.

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
   its scope (text, package, contracts, file paths). A codeweaver operation item names its own `packageNames`; a
   flowrider or siegemaster item names a single `flowId`.

Ward is the exception: it is a command item (`spawnerType: 'command'`) with no `get-agent-prompt` call — the dispatcher
calls the `run-ward` MCP tool for it (§10).

A NAMED sub-agent (a role's own reviewer, or `siegemaster-walker`) never goes through this dispatch path at all — its
parent operator summons it directly via the `Agent` tool, fetching its prompt with `{ agent, questId }` and NO
`workItemId`. It owns no work item and never calls `signal-back`.

---

## 7. Result handoff — `signal-back`

When an agent finishes it calls `signal-back({ questId, workItemId, signal: 'complete', operationItemId?,
operationStatus?, blockedReason? })`. `complete` is the **sole** signal kind — a session-terminal marker. The operation
OUTCOME rides on the same call as `operationStatus` (`done | partial | blocked`; `failed` is rejected). There is **no
failure signal for work the agent could have done** — agents fix their own problems and move forward.
`quest-handle-signal-back-responder` applies the outcome server-side (authoritative — an agent cannot forget to patch
the ledger, because agents never write it), in ONE atomic `questOperationsUpdateBroker` persist:

1. Marks the signaled work item terminal (`completedAt`) — `complete`, or `failed` on `blocked`.
2. Resolves the linked operation item (the call's `operationItemId`, else the work item's `operations/<id>` ref).
3. `operationStatus: 'done'` (or absent) → marks that operation item `complete`.
4. `operationStatus: 'partial'` → marks it `complete` AND appends a `"pt N: {text}"` continuation item (same role,
   `locked`/`wardMode` preserved) immediately after it — **duplicate-on-partial**. This mechanism is generic to any
   code-changing role, but `codeweaver`/`flowrider`/`siegemaster`'s own prompts never send `partial` — each loops
   internally, unbounded, until its own named reviewer says `pass`, and offers only `done`/`blocked`.
5. `operationStatus: 'blocked'` (requires `blockedReason`) → the **environment wall**: same `complete` + `pt N` append
   as `partial` (so a resume re-dispatches this scope), but the work item carries `blockedReason` as its
   `errorMessage`, the pt budget is bypassed, and the quest halts immediately instead of advancing. Use it when no fresh
   session of the role could pass the wall — a denied command, a missing credential, an unreachable service.
6. Calls `questAdvanceBroker` to create the next work item — skipped on the halt routes (`blocked`, spent pt chain).

**Only ONE gate runs before any of this: commit-before-signal.** For every role that changes code (the three operator
roles plus `spiritmender` and `warpgate`), `signal-back` THROWS while the quest worktree carries uncommitted changes —
on `done`, `partial` and `blocked` alike. There is no separate sign-off-completeness gate and no review-coverage gate:
an unsigned verification unit refuses nothing, and the standards concerns a named reviewer takes are never recorded
against a work item, so nothing checks for their presence at signal time.

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
3. Else create ONE work item for the operation's `role` (`spawnerType: 'command'` for `ward`/`riftcarver`, else
   `agent`; copying `wardMode`), linked `operations/<id>`, depending on the most-recent terminal work item, and mark the
   operation `in_progress`.

**Duplicate-on-partial is the verify fixpoint for `ward`.** A red ward run marks its operation item `complete` and the
appended `pt N` continuation makes a FRESH ward run re-verify the new state (a spiritmender splices in ahead of it —
see §9). The chain converges when a run comes back green — convergence IS the verdict. `codeweaver`, `flowrider` and
`siegemaster` do NOT use this fixpoint and do not gate `done` on sign-off completeness: each is an **operator** that
reads code, briefs sub-agents, and signals `done` once its own named reviewer's verdict says `pass` — never merely
because a pass changed code, and never because every unit happened to carry a sign-off. A locked role's `pt N` chain
(were it ever exercised) is bounded by `slotManagerStatics.<role>.maxAttempts`
(ward by `slotManagerStatics.ward.maxRetries`); a spent chain blocks the quest. An unlocked `codeweaver` item's `pt N`
chain is unbounded. A `blocked` signal appends its `pt N` regardless of budget — the
halt is the bound, and dropping the append would make a resume skip the scope. A chain is keyed on role + base text.
`flowrider` and `siegemaster` each hold one tail item PER FLOW, so each gets its own budget; the continuation copies
BOTH its `flowIds` and its `packageNames`.

Trace a two-flow feature quest end to end: `riftcarver → codeweaver ×N (one per package) → ward(changed) →
flowrider ×2 (one per flow) → siegemaster ×2 (one per flow) → ward(full)`. Nothing is appended between two of those
items. After `ward(full)` is green, no `pending`
operation item remains and the operation-aware status transformer derives `complete`. The dispatcher's next
`get-next-step` picks up the next FIFO quest.

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

A ward exit-code red is the **only** failure concept in the orchestrator that is not agent-reported.

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

- **blocked → halt** (§7) — an agent that hits an ENVIRONMENT wall (denied command, missing credential, unreachable
  service) signals `blocked` with a reason; the quest stops for the user instead of burning the pt budget on successors
  that hit the identical wall.
- **partial → pt N** (§8) — a code-changing role that can't finish its scope may signal `partial`; the orchestrator
  continues its work as a fresh `pt N` session. In practice only `spiritmender` and `warpgate` use this — the three
  operator roles' own prompts never do.
- **ward red → spiritmender → re-ward** (§9) — a red ward inserts a spiritmender fix + a fresh ward.
- **orphan → resume** — an `in_progress` work item observed during a scan is orphaned (the one-session-at-a-time
  invariant means get-next-step only runs when nothing is dispatching). `recover-orphaned-work-items-layer-broker`
  flips it back to `pending`, **keeps** `sessionId`/`agentId`, and sets a `resume` marker; `retryCount` increments.
  Node/UI dispatch then **resumes** the retained Claude session (`claude --resume`) so partial work survives. Fallbacks
  fresh-spawn: an early-crash orphan with no captured `sessionId`, and the MCP `/dumpster-launch` Task path (its
  `sessionId` is the parent loop session).
- **API overload → wait it out** — a child that exits non-zero after emitting a 529 / `overloaded_error` marker did not
  fail; the upstream Anthropic API did. `spawn-one-agent-layer-broker` re-dispatches the SAME work item on
  `apiOverloadRetryStatics`' schedule (10 retries a minute apart, then 20 five minutes apart — a ~110 minute window),
  resuming the captured session so any work already done survives. This sits BELOW orphan recovery deliberately: a 529
  death takes seconds, so without it three of them inside a few minutes spend the whole `orphanRecovery.maxResets`
  budget and block the quest over an outage that would have cleared on its own.

The **sole** path to `blocked` (needs-human) is `quest-block-on-failure-broker`, reached only from a spent bounded loop:
ward-retry exhaustion, a locked role's pt-N chain exhaustion, or orphan-recovery exhaustion
(`retryCount ≥ slotManagerStatics.orphanRecovery.maxResets`). It marks the failed work item `failed`, drains every
still-`pending` work item to `skipped`, and sets status `blocked`.

A block ends the scan it happened in: `scan-once-layer-broker` returns `null` the moment recovery reports it blocked,
rather than falling through to the advance self-heal. Otherwise advance would mint the next ledger scope's work item and
the same scan would dispatch an agent against a quest that just halted.

The user resumes a blocked quest (`blocked → in_progress`) through the resume endpoint, which **rearms** it:
`quest-resume-rearm-work-items-transformer` returns every work item whose linked operation item is still unfinished to
`pending` with `retryCount` cleared to 0, keeping `sessionId` + the `resume` marker. Without the rearm a resume is
cosmetic — the blocking item is still `failed` at the budget, so the next recovery pass re-escalates it and blocks again.
An item whose operation item is `complete` is left alone, which is what stops a red ward's already-superseded `failed`
work item from being resurrected.

---

## 13. The validation gates (what blocks a write, and when)

`modify-quest` (= every agent write, and every internal `get-agent-prompt`/`signal-back`/`run-ward` mutation) runs, in
order:

1. **Input allowlist** (`questStatusInputAllowlistStatics`) — per current status, which input fields are writable.
   `operations` is off the allowlist entirely, at every status — no agent authors the ledger, ever. `workItems`/
   `wardResults`/`riftcarverResults`/`designPort`/`pausedAtStatus` are **server-only** (set by internal brokers;
   stripped from the MCP tool surface). The orchestrator's own runtime ledger writes go through
   `questOperationsUpdateBroker`, which bypasses the allowlist.
2. **Status-transition guard** — the from→to hop must be legal (only when `status` is in the input).
3. **Gate-content guard** — required content present for the target status (`flows` before `approved`/`design_approved`
   — nothing else, for either quest type).
4. **Save-invariants** (EVERY write, post-mutation) — structural integrity, lenient: no duplicate ids; `dependsOn` ids
   resolve; `relatedDataItems` reference valid collections (`operations`/`wardResults`/`riftcarverResults`/`flows`) +
   existing ids; the work-item graph is a DAG.

**Direct disk edits to `quest.json` bypass ALL of these** — that's why hand-seeding is the way to stage arbitrary
states. But the moment an MCP tool touches the quest, save-invariants (4) run on the whole thing, so a seed must at
least satisfy those invariants.

---

## 14. Keep-consistent rules when hand-editing `quest.json`

- A work item's `relatedDataItems` MUST include exactly one `operations/<id>` pointing at an `operations[]` item that
  exists on the quest (or `get-agent-prompt` cannot resolve the scope). `wardResults/<id>` / `riftcarverResults/<id>`
  are stamped by their brokers, not by you.
- Each operation item is worked by exactly ONE work item over its life (strict 1:1) — never re-link, never revert an
  operation's status by hand.
- `dependsOn` between work items is the ONLY ordering mechanism — no hardcoded role sequence.
- A ready ward or riftcarver item always dispatches via its `run-ward`/`run-riftcarver` MCP tool, alone.
- Use an `operational` flow for siegemaster runtime seeds to avoid needing a dev server (a siegemaster item resolves
  `.dungeonmaster.json` dev-server config; flowrider's runtime-flow suites bring their own via Playwright's
  `webServer` config instead).
