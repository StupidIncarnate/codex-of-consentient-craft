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
durable plan-and-status record. Its FIRST item, on every quest type, is a **`riftcarver`**: the
command role that carves the quest branch, its worktree and the preflight build, so the workspace
every later role runs in is forged when the quest is next in line rather than the moment its spec is
approved. The orchestrator runs a **reactive relay**: it works the ledger one work-item session at a
time. `questAdvanceBroker` finds the first `pending` operation item, creates exactly ONE work item
for it (marking the operation `in_progress` in the same atomic write), and the dispatch scan spawns
that work item's agent — or, when the role is in `workItemRoleStatics.command`, runs the command
itself. When the agent finishes it calls `signal-back`; the orchestrator marks the operation
`complete` and calls `questAdvanceBroker` again to create the next work item. The failure concepts
are the **two command roles' exit codes** — a `riftcarver` red and a `ward` red — plus an agent's
self-reported environment wall; there is **no recovery-first routing, no PathSeeker, no replan, no
pre-built work-item chain.** Most "sad" paths are not failures: an agent that can't finish its scope
signals `partial` and the orchestrator continues its work as a fresh `pt N` session; a ward red
appends a spiritmender fix and re-wards; a repairable riftcarver red does the same and re-carves; a
server crash resumes the orphaned session. The **sole** path to `blocked` (needs-human) is
`quest-block-on-failure-broker`, reached when a bounded loop is spent, when an agent reports an
environment wall, or when a riftcarver hits a git-state or permission failure.

---

## Core concepts

- **Operations ledger (`quest.operations`)** — an ordered `OperationItem[]`. The durable plan and
  status record. NOT committed to git. It has exactly **ONE writer: the orchestrator.** `operations` is
  off the modify-quest allowlist entirely — ChaosWhisperer never authors it, at any status, and no
  execution agent ever writes it either. All ledger content comes from the orchestrator itself: DERIVED
  at Start (`questBuildRelayGraphBroker`, expanding each `questTypeRegistryStatics` seed through
  `relayTailFanOutTransformer`) and mutated at runtime (via `questOperationsUpdateBroker`).
  **Execution agents never write it** — they read git + the ledger for context and signal an outcome.
- **OperationItem** — `{ id, role, text, status, locked, wardMode?, flowIds, packageNames }`
  (`operation-item-contract.ts`). `status` is `pending | in_progress | complete` (there is **no
  `partial` status** — see duplicate-on-partial). `text` is a prose description; a continuation is
  auto-named `"pt N: {text}"`. `locked` enrolls an item in its role's `slotManagerStatics` pt-chain
  budget; every verify-tail item is locked, but the derived `codeweaver` items are minted UNLOCKED on
  purpose, so that chain stays unbounded (the flows are the acceptance target and the work has to
  land). No agent can delete ANY operation item any more, locked or not — `operations` is off the
  modify-quest allowlist entirely. `wardMode` (`changed | full`) is present only on `role:ward` items.
- **Work item (`quest.workItems[]`)** — one agent *session* (`sessionId` / `agentId` / transcript).
  **Strict 1:1 invariant: every work item links to exactly one operation item via
  `relatedDataItems: ['operations/<id>']`, and each operation item is worked by exactly ONE work item
  over its life** — never re-linked, never status-reverted. A COMMAND work item additionally carries
  its own result ref — `wardResults/<id>` for ward, `riftcarverResults/<id>` for riftcarver — which
  is the only route the execution panel has to that run's persisted log.
- **Relay** — the sequential progression of work-item sessions through the ledger, one active work
  item at a time.
- **Duplicate-on-partial** — when an agent signals `operationStatus: 'partial'`, the orchestrator
  marks that operation item `complete` and appends a NEW `"pt N: {text}"` item (same role, `locked`
  flag preserved) immediately after it; advance creates the next work item against the new item. This
  preserves strict 1:1 and gives an immutable `pt` audit trail instead of reverting a shared item's
  status.
- **Environment wall** — `operationStatus: 'blocked'`. Duplicate-on-partial still appends the `pt N`
  continuation, but the work item is marked `failed` with the agent's `blockedReason`, the pt budget is bypassed, and
  the quest halts for the user instead of advancing (see § (d)).
- **Fixpoint** — the `pt N` chain for `ward`. A red run completes its ward operation item and spawns a fresh `pt N+1`
  ward continuation (with a spiritmender spliced in ahead of it — see "The sad paths in detail" § (b)); a run that
  comes back green ends the chain. Convergence IS the verdict: a fresh run that came back green is acceptance.
- **Orchestrator role** — one of the five roles in `roleToDisciplineStatics` (`codeweaver→implementation`,
  `pesteater→bug-repro`, `flowrider→below-browser`, `groundstomper→browser-e2e`, `siegemaster→manual-qa`). All five
  are served ONE template, `operationOrchestratorPromptStatics`, with their discipline pack interpolated at
  `$DISCIPLINE`. **The session never opens a source file**; it runs a **round loop** (below) and signals. Only
  `spiritmender` and `warpgate` keep bespoke prompts and run no round.
- **Round loop** — the unit of work inside ONE orchestrator session, capped at **3 rounds**:
  `build → planner-minion → read the plan back → worker-minions ONE AT A TIME → reviewer-minion → build → scoped ward
  → commit the round → loop on the reviewer's REMAINDER`. Only the orchestrator runs `npm run build`, which is why
  workers are serial: concurrent `tsc` corrupts the shared `dist/`. An empty `REMAINDER` ends the loop.
- **Minion** — `planner-minion`, `worker-minion`, `reviewer-minion` (generic; all five disciplines summon the same
  three, parameterized by `discipline` at fetch time) plus the spec-phase `chaoswhisperer-gap-minion`. A minion owns
  NO work item, fetches with `{ agent, questId, discipline }` and **no `workItemId`**, and **never calls
  `signal-back`**. Only the planner may spawn a sub-agent, and only for a bounded spike.
- **Operator convergence** — `flowrider`, `groundstomper` and `siegemaster` do NOT use the fixpoint.
  They signal on
  remaining SCOPE, measured **per track**: `done` once every unit in scope is settled on that role's OWN track
  (`flowriderSignoff` for flowrider and groundstomper over disjoint package kinds, `siegemasterSignoff` for
  siegemaster), `partial` only when a
  named remainder is left. Verdicts are per role; **there is no aggregate
  status** and no unit-level "done" that both roles share. Every one of them runs the round loop, so the reviewer is
  already the fresh pair of eyes a `pt N` session would supply — authoring a test, walking a path, or landing a fix is
  the job, not a reason to respawn the role.
- **Standards review** is NOT a role and NOT a ledger item. The five concerns (`craft`, `perf`, `dedup`, `integrity`,
  `test-cases`, from `standardsReviewConcernsStatics`) are taken by the `reviewer-minion` of EVERY round, over
  `get-blight-checklist({ scope: 'working-tree' })`, and recorded in `quest.planningNotes.blightLedger`.
- **Sign-off** — `{ verdict, evidence, question?, workItemId, at }` on a verification unit, where `verdict` is
  `confirmed | unconfirmable`. Two independent top-level fields per unit, one per track. See "The two verification
  tracks" below.
- **Quest note** (`quest.planningNotes.questNotes[]`) — `{ id, kind, role, workItemId, flowId?, unitId?, summary,
  detail, at }` with `kind` one of `open-question | tooling-error | out-of-scope | walk-reset`. A durable side channel
  beside the tracks. **A note NEVER closes a unit.**
- **Git is the record of what was built.** The ledger is the plan/status; commit messages are the
  cross-session handoff. A stale ledger self-heals because the next agent verifies against git first.

---

## Quest types and their relay tails

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). `questTypeRegistryStatics`
(`@dungeonmaster/shared/statics`) is the single source of truth per type: the intake slash command,
the create-time seed role (`initialWorkItemRole`), the implementation operation items the orchestrator
seeds at Start (`startImplementationOps`), and the fixed verify tail (`relayTail`).
`questBuildRelayGraphBroker` mints `startImplementationOps` + `relayTail` as **pending** operation
items at Start Quest (locked, except the feature `codeweaver` seed — see below).

| Type       | Intake                              | Implementation ops                                                        | Verify tail (appended at Start, all locked)                     |
|------------|-------------------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------------|
| `feature`  | `/dumpster-create` (ChaosWhisperer) | `riftcarver` (always the first entry, exactly one item) then **DERIVED** `codeweaver` items — one `fanOutBy: 'implementation'` seed, never authored | `ward(changed) → flowrider → groundstomper → siegemaster → ward(full)` |
| `bug-hunt` | `/dumpster-hunt` (BugHunt intake)   | `riftcarver` (always the first entry, exactly one item) then orchestrator-seeded `pesteater` | `ward(changed) → ward(full)`                     |

`riftcarver` heads `startImplementationOps` for **both** types, and neither seed carries a `fanOutBy`,
so each mints exactly one item. Nothing on the ledger can run before it: every later role works
inside the worktree it creates.

So the full feature relay is:

```
chaoswhisperer (plan item)
  → riftcarver (branch + worktree + node_modules mirror + preflight build)
  → codeweaver ×N (DERIVED at Start, not authored)
  → ward(changed)
  → flowrider ×N (one per package it owns + one seam item)
  → groundstomper ×N (one per runtime flow a browser can reach)
  → siegemaster ×N (one per flow)
  → ward(full)
```

Every one of `codeweaver`, `flowrider`, `groundstomper`, `siegemaster` and `pesteater` above is an ORCHESTRATOR
session that runs the round loop internally. Its planner/worker/reviewer minions are NOT ledger items and never
appear on it.

and the full bug-hunt relay is:

```
riftcarver
  → pesteater
  → ward(changed) → ward(full)
```

**Neither tail seeds a blight-review item, and nothing appends one.** The dispatch order above IS the dispatch order
at run time — `QuestHandleSignalBackResponder` appends only the `pt N` continuation, and the ward/riftcarver brokers
only their failure splices. Standards review happens INSIDE each of those sessions: the `reviewer-minion` of each
round takes the five concerns over `get-blight-checklist({ scope: 'working-tree' })` before its parent commits, and
`signal-back`'s review-coverage gate refuses `done` when that left no trace (see "The sad paths in detail" § (f)).
`questTypeRegistryStatics.feature.relayTail` carries a comment at the point such a seed would otherwise sit, so the
absence reads as a decision.

`flowrider` is an **operator** role that owns test coverage BELOW the browser, and its one registry tail entry fans
out BY PACKAGE (`relayTailFanOutTransformer`, `fanOutBy: 'package'`): one operation item per package the quest's
runtime nodes tag whose kind is in `signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes`, plus ONE seam item
for the glue nodes where two such packages meet. Each item carries its own `packageNames` and therefore its own
pt-continuation chain, and one session owns that slice across every runtime flow it touches. A node landing only in a
browser-reachable kind mints no flowrider item — those units belong to `groundstomper` — so a quest whose every runtime
node is frontend gets none at all; a quest with no runtime node to slice on falls back to a single whole-quest item.
Its GATE is narrower than its `flowIds` in the other direction too: the `flowrider` track counts RUNTIME flows only,
because an operational flow is a one-time task sequence whose end state Siegemaster hand-checks and which no test can
assert.
`groundstomper` is the **operator that owns Playwright**, and it is the only role that authors `.e2e.ts` files: it
fans out to ONE OPERATION ITEM PER RUNTIME FLOW that reaches a browser-reachable package, and its round writes
`flowriderSignoff` over the package kinds Flowrider's list excludes.
`siegemaster` is also an **operator**, but fans out to ONE OPERATION ITEM PER FLOW instead — each carries a single
`flowId`, so each flow gets its own pt-continuation chain. Its track counts runtime and operational flows alike, plus
the seven off-map probe families, which Flowrider's denominator excludes. A flow-less quest still gets exactly one
siegemaster item, because those off-map families — `hostile-input` and `perf` above all — are where the quest's
security and performance are established at all, and they belong to no drawn flow.

`pesteater` is the bug-hunt front and is an orchestrator role like the four above, discipline `bug-repro`. Bug-hunt
reuses the same flow/observable spec lifecycle (the reproduction path is a flow, the expected behavior is an
`EXPECTED:` observable the round turns into a failing test). Its tail has no verify roles at all, and no sign-off
track exists on that discipline, so `signal-back` recomputes no denominator for it — which makes the round's
`reviewer-minion` the only thing standing between a false green and a shipped bug, and is why the `bug-repro` pack's
reviewer block is its longest.

Standards review has **no role and no ledger item on either type.** Its five concerns (`craft`, `perf`, `dedup`,
`integrity`, `test-cases`) belong to every `reviewer-minion`. Dead-code detection is deliberately UNOWNED pending a
deterministic orphan-export tool: whether an export still has a consumer is a property of the whole post-fix import
graph, which no per-file crossing can answer. `blightConcernGatingStatics` further withholds `perf` and `integrity`
from declaration-shaped files (`-contract.ts`, `.stub.ts`, `.proxy.ts`, `.test.ts`, `.e2e.ts`, `.harness.ts`,
`index.ts`) — across 88 review units on one real quest those two produced ZERO findings on that file mix, which is a
property of the question rather than of the reviewer.

---

## Dispatchers: two drivers, one relay

The same relay is driven by two interchangeable dispatchers; both share `questAdvanceBroker`,
`signal-back`, and the dispatch scan, so the relay logic is identical for both. **Node/UI mode is the
primary driver.**

| Surface                          | Dispatcher                     | What it does                                                                                                                                        |
|----------------------------------|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| Web UI `/queue` page play button | **Node/UI mode (primary)**     | The server-side Node dispatch runner loops `get-next-step` in-process and spawns headless `claude -p` children (one per SpawnInstruction).           |
| `/dumpster-launch` slash command | **MCP mode**                   | A brainless loop in the user's own Claude session: `get-next-step()` → `Task()` for agents / `run-ward` or `run-riftcarver` MCP tool for a command role → await → repeat. |
| Web UI "Start Quest" button      | —                              | Calls `OrchestrationStartResponder`: seeds the relay and flips status `approved → in_progress`. **Spawns nothing and touches no git** — pure `quest.json` bookkeeping, so the POST answers in milliseconds and the active dispatcher picks the quest up. |

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
| `flows_approved`, `approved`, `design_approved` | **User** (APPROVE button)                 | The approval gates; each requires non-empty `flows` — nothing else         |
| `in_progress`                                   | `start-quest` / Start Quest button        | Spec locked; the relay is seeded and dispatch begins. Start is pure `quest.json` bookkeeping — it spawns nothing and touches no git, so the panel swap is immediate; the branch, worktree, `node_modules` mirror and preflight build belong to the `riftcarver` item it seeds at the head of the ledger |
| `complete`, `blocked`                           | Derived / set by the orchestrator         | `complete` derived by `workItemsToQuestStatusTransformer`; `blocked` set only by `quest-block-on-failure-broker` |
| `paused`, `abandoned`                           | User                                      | Not derived over — owned by the user                                        |

**The approval gate** (`quest-gate-content-requirements-statics`) requires only non-empty `flows` for
`flows_approved`, `approved`, and `design_approved` alike — for EVERY quest type. It no longer demands a
`role:codeweaver` item: the codeweaver ledger is DERIVED at Start (`fanOutBy: 'implementation'`, exactly like
bug-hunt's `pesteater` always was), not authored at spec time by anyone, so coverage is definitional rather than
checked — a quest that clears `flows_approved` already carries every input the generator reads. The gate is enforced
in `quest-modify-broker` (the `approved` transition) and the web approve button.

---

## The operations ledger, from create to complete

Trace one feature quest end to end.

1. **Quest create** (`quest-create-broker`). For a type with an intake agent (feature's
   `chaoswhisperer`), create seeds ONE **plan** operation item
   `{ role: chaoswhisperer, text: "Author spec + implementation plan", status: in_progress, locked }`
   and stitches its `operations/<id>` ref into the caller-supplied intake work item. **Every work
   item, from the first, carries exactly one `operations/<id>` link.**

2. **ChaosWhisperer** builds flows / observables / contracts / `packagesAffected[]` — it writes NONE of
   the operations ledger. `operations` is off the modify-quest allowlist entirely, at every status, so
   there is no `codeweaver` item on the ledger yet at all. The approval gate no longer needs one: it
   only requires non-empty `flows`.

3. **User approves** → **Start Quest** (`OrchestrationStartResponder`):
   - Start is **pure `quest.json` bookkeeping**: the startable gate, the package dependency graph
     (one `package.json` read per declared package plus Kahn's order — milliseconds), the relay seed,
     then the status flip and the queue entry. It spawns no child and runs no git, which is what
     keeps the POST at millisecond scale and lets the WebSocket-driven panel swap land instantly.
   - `questBuildRelayGraphBroker` force-completes any non-complete intake (`chaoswhisperer` /
     `glyphsmith`) operation item, then mints `startImplementationOps` + the fixed verify tail as
     pending operation items (locked, except the `codeweaver` seed itself — see below) and creates ONE
     work item for the first actionable (`pending`) operation item — the `riftcarver`, minted
     `spawnerType: 'command'` off `isCommandWorkItemRoleGuard` — linked `operations/<id>`, depending
     on the completed chat work items.
   - It stamps **no `baseRef`**. Start runs before any worktree exists, so the only HEAD it could read
     is the server process's own checkout; `riftcarver` is the sole writer of that field and reads it
     from the worktree's own HEAD once the worktree is real.
   - **This is also where the codeweaver items are born.** `startImplementationOps` for a feature
     quest is TWO seeds — the `riftcarver` above, then
     `{ role: 'codeweaver', fanOutBy: 'implementation', locked: false }`. `questBuildRelayGraphBroker`
     runs it through `relayTailFanOutTransformer`, which expands it into one item per (package, flow)
     cell across both flow types, plus one flow-less **foundation** item per package holding the
     contracts — and the individual contract PROPERTIES, each of which may carry its own `source` —
     resolving under it (this is the only reason a package with zero tagged
     nodes gets an item at all). A cell's membership is "this package TAGS a node in this flow", so a
     glue node appears in BOTH sides' cells: a seam has two halves and each side builds its own, in the
     tier order below. Items are ordered by package KIND tier (`packageBuildOrderStatics`)
     first, then `packageGraph` depth as a tiebreak — tier outranks depth because manifest depth is
     Kahn's order over `package.json` edges, which is INVERTED across an HTTP seam (this repo's
     `server` depends on `web` to serve its bundle, so raw depth would rank the browser package ahead
     of the backend route it calls). `locked: false` is why this is the one seed minted unlocked: it
     enrols an item in its pt budget, and a codeweaver chain has to stay unbounded because the flows
     are the acceptance target and the work has to land regardless of how many passes it takes.
   - The seed is persisted via `questOperationsUpdateBroker` **before** the status flips to
     `in_progress`. Both the seed and the transition are idempotent (a re-Start detects the already-
     appended locked ward tail and skips straight to the transition).

4. **The dispatch loop** picks up the riftcarver work item and runs it as `run-riftcarver`
   (`spawnerType: 'command'`) via `quest-run-riftcarver-broker`: detect the base branch, `git worktree
   add`, pin `baseRef` from the new tree's HEAD, mirror `node_modules` for the repo root and every
   workspace root, then run the preflight build to convergence. Every line streams live to the
   execution row and is persisted to `<questFolder>/riftcarver-results/<id>.log`. On green the
   operation completes and advance dispatches the first `codeweaver`; on a red it routes by failure
   class (see the riftcarver path below).

5. **The dispatch loop** picks up that first codeweaver work item. The agent reads its operation item
   + git + the ledger, verifies it's the right next step, builds, commits a prose handoff, and signals
   `complete` carrying `operationItemId` + `operationStatus: 'done'`.

6. **`QuestHandleSignalBackResponder`**, in ONE atomic `questOperationsUpdateBroker` write, marks the
   work item terminal (`complete`) + the linked operation item `complete`, then calls
   `questAdvanceBroker` → the next `pending` operation item (the next `codeweaver`) gets its work item.
   Repeat until all codeweaver items are complete.

7. **Ward operation items** are dispatched as `run-ward` (`spawnerType: 'command'`) and handled by
   `quest-run-ward-broker` (see the ward path below).

8. **Verify roles** run in tail order — `flowrider`, `groundstomper`, then `siegemaster`. All
   three are
   **operators**: `flowrider` runs one session per package slice below the browser, `groundstomper` one per
   browser-reachable runtime flow, each signalling `done` once every unit in
   scope is settled on their own track; `siegemaster` runs one session PER flow,
   each signalling on that flow's own scope and its own track. The two flow tracks are INDEPENDENT — an authoring
   signature does nothing to Siegemaster's gate, and vice versa. Each role's chain is keyed on role + base
   text — `flowrider` holds one chain per package slice,
   `groundstomper` and `siegemaster` one PER flow. There is no blight-review item in this tail and none is appended
   to it: each of these sessions' own `reviewer-minion` takes the standards concerns over its round before that
   session commits (see "Quest types and their relay tails" above).
   After `siegemaster` converges, `ward(full)` runs; on green, no `pending` operation item
   remains and the operation-aware status transformer derives `complete`.

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
3. Else create ONE work item for the operation's `role` (`spawnerType: 'command'` when
   `isCommandWorkItemRoleGuard` matches — `workItemRoleStatics.command` is `['ward', 'riftcarver']` —
   else `agent`; copying `wardMode`), linked `operations/<id>`, depending on the most-recent
   dependency-satisfying work item (a linear chain used for dispatch ordering), and mark the operation
   `in_progress`.

That guard is the SINGLE predicate deciding both `spawnerType` and "is this Claude's to run", and it
is data rather than a `role === 'ward'` ternary for a reason: a dispatch site that missed the second
member would hand a riftcarver work item to `build-spawn-instruction-layer-broker`, which parses
`agentRoleContract` and throws on a name it does not enumerate. `agentRoleContract` deliberately does
NOT list `riftcarver`.

### Dispatch selection

`compute-next-step-from-quest-layer-broker` + `select-batch-layer-broker` return **one session at a
time**: a ready COMMAND item is dispatched alone — a `riftcarver` as `run-riftcarver`, a `ward` as
`run-ward` — and only what is left is batched, so the single first ready work item is returned as
`spawn-agents`. Each command owns the whole tree for the length of its run (riftcarver creates the
workspace, ward grades it), so batching one alongside an agent would let that agent edit the tree
mid-run. Because advance only ever creates one work item and it depends on the last terminal item,
there is at most one dispatchable work item at any moment.

**The missing-worktree halt exempts riftcarver, and only riftcarver.** `scan-once-layer-broker`
blocks a quest whose recorded `worktreePath` does not resolve, because dispatching any other role
would run it against the repo-root checkout. The carve is the role that OWNS creating that path — its
own done-check reads a recorded-but-missing directory as "not done" and re-creates it — so halting
ahead of it would leave the quest permanently blocked by the one step that could have repaired it.
The exemption keys on the step already computed (`run-riftcarver`), never on quest status, so only
the work actually about to be dispatched earns the pass.

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
`operationStatus: 'done' | 'partial' | 'blocked'` and the orchestrator applies it server-side (authoritative — an agent
cannot forget to patch the ledger, because agents never write the ledger). The two COMMAND roles —
`riftcarver` and `ward`, the members of `workItemRoleStatics.command` — are the ones whose terminal state comes from an
exit code rather than a signal; neither is a Claude session, so neither has a signal to give.

`blocked` is available to EVERY role in the tables below and behaves identically for all of them, so it is documented
once in § (d) rather than repeated per role: the operation item completes and gets a
`pt N` continuation exactly as for `partial`, but the work item is marked `failed` carrying
`blockedReason`, the pt budget is bypassed, and the quest halts immediately.

**Three gates can REFUSE a signal outright, before any of the above happens**, and none of them is per-role prose —
each is documented once and applies by membership: the commit-before-signal gate (§ (e)), the sign-off completion gate
(§ "The two verification tracks"), and the review-coverage gate (§ (f)). A refusal persists nothing, so it is not a
sad path in the ledger sense — the session fixes what the message names and signals again.

### Chat / intake

| Role               | Operation item                          | Happy                                                                    | Sad                                                                 |
|--------------------|-----------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------|
| **ChaosWhisperer** | the plan item (seeded `in_progress`, locked) | Authors flows/observables/contracts/`packagesAffected` — never `operations`; at Start Quest `questBuildRelayGraphBroker` force-marks the plan item `complete` AND derives the `codeweaver` items themselves. | No execution sad path. The approval gate rejects `approved`/`flows_approved`/`design_approved` only for empty `flows`; it no longer checks for a `codeweaver` item. |
| **Glyphsmith**     | (optional design phase)                 | Walks `approved → design_approved`; its plan item is force-completed at Start like ChaosWhisperer. | —                                                                  |

### Implementation

| Role           | Locked? | Happy (`done`)                                                    | Sad (`partial`)                                                                                             |
|----------------|---------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Codeweaver** | No (DERIVED at Start, `fanOutBy: 'implementation'`) | operation `complete`, work item `complete`, advance → next operation | operation `complete` + a `pt N` continuation appended (unlocked → **unbounded** pt chain — codeweavers pivot in place freely); advance creates a fresh work item that continues from git |
| **PestEater** (bug-hunt) | Yes | operation `complete`, advance → `ward(changed)`                | operation `complete` + `pt N` (locked → **bounded** by `slotManagerStatics.pesteater.maxAttempts`); spent chain → `blocked` |

### Verify / review (feature tail; flowrider, groundstomper, siegemaster all operators, all running the round loop)

Each is a **locked** operation item, and `partial` always appends a `pt N` continuation for a fresh pass — **bounded**
by `slotManagerStatics.<role>.maxAttempts`, with a spent chain blocking the quest via `quest-block-on-failure-broker`. A
chain is keyed on role + base text. `flowrider` holds one tail item PER PACKAGE SLICE (its text carries the package
or the seam's package set); `groundstomper` and `siegemaster` each hold one tail item PER FLOW (its text carries the
flow id), so each flow gets its own budget. The continuation carries the same `flowIds` AND the same `packageNames`.

All three are **operators** and signal on remaining **scope**, never on whether a pass changed code. Each role asks ONE
question and answers only its own:

- **`flowrider` — is every observable BELOW THE BROWSER proven by a test?** Its scope is the RUNTIME flows, narrowed to
  the package kinds a browser cannot reach and then to its own item's `packageNames`. It authors Jest work only — no
  Playwright, no dev server — and signals `done`
  once every unit in that slice carries a `flowriderSignoff`. Its `worker-minion`s author the suite and its
  `reviewer-minion` is **the only writer of that track**, because the session that wrote a test cannot be the one that
  certifies it — a separation that is now the shape of the pipeline rather than an instruction a single session had to
  keep.
- **`groundstomper` — does the flow hold when a browser walks it?** Its scope is the ONE runtime flow its item names,
  narrowed to that flow's browser-reachable packages. It is the sole author of `.e2e.ts` Playwright specs, and its
  round writes `flowriderSignoff` over the package kinds Flowrider's list excludes. It inventories the
  existing e2e suite for its flow first, so it extends a spec rather than adding a parallel one.
- **`siegemaster` — does it hold when a human drives the real system, and can I break it?** Its scope is the ONE flow
  its item names, runtime or operational, plus the SEVEN off-map breakage families it owns: `re-entry`,
  `concurrency`, `interruption`, `staleness`, `configuration`, `hostile-input`, `perf`. `hostile-input` is where this
  quest's security is established and `perf` is where its performance is measured, both off the running system. It
  signals `done` once every unit on that flow carries a `siegemasterSignoff`.

| Role             | Happy (`done`)                                                                                            | Sad (`partial`)                                                                       |
|------------------|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| **Flowrider**    | advance → the next `flowrider` slice, or `groundstomper` on the last one (every unit in that package slice carries a `flowriderSignoff`) | `pt N` continuation → fresh flowrider pass for that slice, named remainder (bounded)     |
| **Groundstomper**| advance → the next `groundstomper` item, or `siegemaster` on the last one (every browser-reachable unit on that flow carries a `flowriderSignoff`) | `pt N` continuation → fresh groundstomper pass for that flow, named remainder (bounded) |
| **Siegemaster**  | advance → the next `siegemaster` item, or `ward(full)` on the last one (every unit on that flow carries a `siegemasterSignoff`) | `pt N` continuation → fresh siegemaster pass for that flow, named remainder (bounded)    |

**`unconfirmable` is not `partial`.** A unit no session of that role could ever settle is signed `unconfirmable` with
its question and the pass moves on. Handing it to a `pt N` continuation instead burns the chain to
`slotManagerStatics.<role>.maxAttempts` on sessions that provably cannot close it, and then blocks the quest with the
unit still open. `partial` is for scope a fresh session really could finish.

### The round loop — the paths INSIDE one orchestrator session

Everything above is the relay BETWEEN sessions. Inside any one of the five orchestrator roles' sessions there is a
second, bounded loop, and its paths need their own coverage because none of them reaches `signal-back`.

| Gate | Step | Happy | Sad |
|---|---|---|---|
| 1 | `git log` (bodies, whole quest) + `git diff --name-only` + `git status` | scope confirmed against what is really on disk | a `pt N:` prefix means a predecessor did part of this; a dirty tree means a dead session left work — neither is a reason to stop |
| 2 | `npm run build`, its OWN command, unpiped | exit 0 | red → dispatch a `worker-minion` with the error; the orchestrator fixes nothing itself |
| 3 | fetch the denominator the discipline names | a recomputed number | — |
| 4 | ONE `planner-minion` | plan persisted to `planningNotes.operationPlans[]`, 3-5 line return | no honest plan → the planner says so in `DECISIONS FOR YOU` and persists what is honest |
| 5 | `get-quest-planning-notes` to read the plan back | the persisted plan, not the planner's summary | — |
| 6 | `worker-minion`s, **ONE per assistant message**, in `dependsOn` order | each piece built red-first inside its own `files` | a thin return → ONE re-dispatch with a sharper brief; after that the piece becomes a REMAINDER for the next round |
| 7 | ONE `reviewer-minion` over everything the round produced | structured return with an empty `REMAINDER` | `VERDICT: rework` / non-empty `REMAINDER` |
| 8 | `npm run build`, then `npm run ward -- -- <this round's FILE paths>` | green | a red it cannot close this round is a remainder, not a reason to stop |
| 9 | commit the round | every path commits, `--allow-empty` included | — |
| 10 | decide | `REMAINDER` empty + ward green → signal `done` | non-empty → back to gate 4 with that remainder as the next planner's brief; **3 rounds spent** → commit and signal `partial`, naming the remainder in the commit body |

Round-loop invariants worth asserting:

- **Two `Agent` calls in one assistant message is the bug**, not slowness — that runs the workers concurrently, and
  concurrent `tsc` corrupts the shared `dist/`. "Independent" in a plan means safe to order any way, not safe to run
  at once.
- **Only the orchestrator builds.** Planner, workers and reviewer are all forbidden `npm run build`, and all three are
  forbidden `git` entirely; the parent makes the round's one commit and writes the handoff body.
- **The plan is read back from the quest, never from the planner's message.** A pasted plan body defeats the
  persistence the reviewer and any successor session both depend on.
- **`Agent` coming back actually DENIED is `blocked` (Operating Rule 5), not a licence to hand-code.** A tool that was
  never called is not a tool that was denied — attempt it once and quote the refusal. And a constraint read out of a
  predecessor's commit is a CLAIM, not an observation: one session's ad-hoc reading of this exact conflict propagated
  through three later sessions via `git log` and took the delegation mandate out of all of them.

### The two verification tracks

Every verification unit — each terminal, each labelled branch, each observable, and each off-map probe family — carries
**two independent top-level sign-offs**:

| Field | Written by | Answers |
|---|---|---|
| `flowriderSignoff` | the Flowrider round's `reviewer-minion` over its package slice, and the Groundstomper round's over the browser-reachable package kinds — never the worker that authored the test | is this proven by a test? |
| `siegemasterSignoff` | the Siegemaster round's `reviewer-minion`, over what its workers walked | does this hold when a human drives the real system? |

Each is `{ verdict, evidence, question?, workItemId, at }` and each `verdict` is one of exactly TWO values:

- **`confirmed`** — Flowrider: a test `file:line` PLUS what makes that test fail (the production line broken, the
  assertion that went red). Siegemaster: the value measured off the running system.
- **`unconfirmable`** — genuinely unable to settle it after real effort. `evidence` says what was tried; a `question`
  is REQUIRED and the contract refuses the verdict without one.

**A unit is done when BOTH sign-off FIELDS have been written.** Both verdicts CLEAR the gate; what the gate refuses is
the ABSENCE of a sign-off. There are TWO fields (`signoffTrackContract`) and THREE denominators over them
(`signoffDenominatorTrackContract`), and every difference between the denominators is DATA in
`signoffTrackEligibilityStatics` rather than role branches in the gate: the authoring ones exclude the off-map families
(Siegemaster's charter — breakage classes a flow graph cannot draw) and exclude observables whose `addedBy` is
`siegemaster` (a role that runs strictly after them), and Flowrider and Groundstomper split `flowriderSignoff` between
them by `packageTypes` — disjoint, and their union is Siegemaster's.

**A measured defect is a NEW observable, not a third verdict.** An observable is a positive expectation; "send it
`bleh` and the server crashes instead of returning 400" is the INVERSE expectation, so it is ADDED to the flow through
the additive spec authority both roles hold, and then carries its own two sign-offs. If it cannot be closed this
session it sits `unconfirmable` with the reason. There is no `defect`, `deferred`, `gap` or `recorded` verdict.

**Provenance is a separate axis.** `addedBy` on the observable (`spec | chaoswhisperer | codeweaver | flowrider |
siegemaster | operator`) answers "was this in the spec at approval, or added mid-quest, and by whom" — never whether
the unit is settled.

**Sign-offs are written via `modify-quest`, batched.** One call patches `{ id, <track>Signoff }` on many elements at
once — observables, nodes, edges, and `offMapSignoffs` entries (whose `id` IS the probe family). A signing element may
carry ONLY `id` plus the sign-off field: a transformer rejects anything else on it, and rejects a sign-off written
against a unit id that does not already exist. One call per unit is refused by policy, not by the schema — a 45-unit
flow signed singly is 45 quest writes, 45 outbox appends and 45 browser refetches of a growing file.

`get-qa-checklist` takes a `track` param and an optional `packageNames`. **`track` names the DENOMINATOR — the role you
were dispatched as — not the field you write**, so a Groundstomper session passes `groundstomper` even though it writes
`flowriderSignoff`; passing the sibling's name returns the exact complement of its own units. With either authoring
track and no `flowId` it returns RUNTIME flows only, and its `remainingItemIds` is the per-track sign-off difference
over the declared slice — the same set the completion gate recomputes, which is why the gate's refusal quotes the call
verbatim.

### The reset lever

`reset-flow-signoffs({ questId, workItemId, flowId, reason })` clears **Siegemaster's** track across ONE flow and
appends a `walk-reset` note to `quest.planningNotes.questNotes`. **Flowrider's track is untouched by it.**

It exists because a sign-off is a measurement of a system at a moment. When Siegemaster fixes a defect mid-walk, every
sign-off already written on that flow describes the code as it stood BEFORE the repair — each is now a claim about a
system that no longer exists. The operator resets and re-walks rather than shipping a track full of measurements of
deleted behaviour.

**Resets are FREE within a session**: they cost no pt-chain attempt and carry no failure semantics. The `walk-reset`
note is what makes the reset auditable after the session ends.

### `questNotes` — the durable side channel

`quest.planningNotes.questNotes[]` holds `{ id, kind, role, workItemId, flowId?, unitId?, summary, detail, at }`, with
`kind` one of:

| Kind | For |
|---|---|
| `open-question` | something genuinely unsettled that a later session or a human must answer |
| `tooling-error` | a tool or harness that failed in a way the quest's own code cannot fix |
| `out-of-scope` | a real finding this role has no authority to close — e.g. a coverage hole a mutation-only audit surfaced |
| `walk-reset` | appended by `reset-flow-signoffs`, recording that a flow's Siegemaster track was cleared and why |

**A note NEVER closes a unit.** Only a sign-off does. A note is how information that is not a verdict survives the
session that found it.

### Command

Two roles are commands rather than agents — `workItemRoleStatics.command` is `['ward', 'riftcarver']`,
and `isCommandWorkItemRoleGuard` is the one predicate every dispatch site reads. A command work item
is `spawnerType: 'command'` with no `sessionId`, so no JSONL watcher can ever tail it: each broker
takes a **required `onLine`** and that callback is the only route its output has to a UI, for minutes
at a time. Each also persists a per-run history file under the quest folder and back-links it onto the
work item — ward its structured detail blob at `ward-results/<id>.json` via a `wardResults/<id>` ref,
riftcarver the streamed text verbatim at `riftcarver-results/<id>.log` via a `riftcarverResults/<id>`
ref. That ref is the only route the execution panel has to the detail.

| Role           | Terminal by | Happy (green, exit 0)                                   | Sad (red, exit ≠ 0)                                                                                          |
|----------------|-------------|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Riftcarver** | exit code   | `quest-run-riftcarver-broker` marks the carve work item `complete` + the riftcarver operation item `complete`, advance → the first `codeweaver` (feature) or `pesteater` (bug-hunt) | routed by FAILURE CLASS, not by one rule: `repairable` (node_modules / build) with budget left → work item `failed` (`errorMessage: riftcarver_<step>_failed`), operation `complete`, then a **spiritmender** + a **fresh `pt N` riftcarver** spliced after it; `repairable` with the budget spent, `git-state` (base_branch / create), or a permission-denied error at ANY step → `quest-block-on-failure-broker` |
| **Ward**       | exit code   | `quest-run-ward-broker` marks the ward work item `complete` + the ward operation item `complete`, advance → next role | work item `failed`, ward operation item `complete`, then appends a **spiritmender** operation item + a **fresh ward** operation item (`pt N`, same `wardMode`) AFTER it, advance → the spiritmender runs next (never a ward back-to-back), then the fresh ward re-verifies |

**Riftcarver's steps and their classes.** `create` and `base_branch` are `git-state`; `node_modules`
and `build` are `repairable`. A `git-state` red BLOCKS deliberately rather than repairing, because
there is no worktree to dispatch a spiritmender into and the only checkout left is the repo root — the
one place no agent may ever be sent. A permission-denied error overrides whatever class the step
carries and blocks too: no fresh session of any role can talk an operator's filesystem out of saying
no, so spending a spiritmender pass on it only burns the budget before halting anyway. The repairable
chain is bounded by `slotManagerStatics.riftcarver.maxRetries`, counted as the riftcarver operation
items since the last GREEN riftcarver — the same shape as ward's `maxRetries`, and a `maxRetries` key
rather than the pt-ladder's `maxAttempts` for the same reason ward's is: the chain is counted off the
ledger's role-filtered history, not off one item's continuations. Full walkthrough in § (b2).

**Riftcarver is re-entrant by design — every step owns a done-check.** Because the repairable route is
`riftcarver → spiritmender → riftcarver (pt N)`, the broker is re-entered against a partially built
workspace as a matter of ROUTINE. See RIFT-1 and RIFT-2 under "Invariants" for the contract that
holds it together.

### Recovery

| Role             | Locked? | Happy (`done`)                                          | Sad (`partial`)                                                             |
|------------------|---------|--------------------------------------------------------|-----------------------------------------------------------------------------|
| **Spiritmender** | Yes     | fixes build/lint/type/test errors; advance → the fresh command re-runs (the `pt N` ward after a ward red, the `pt N` riftcarver after a repairable carve red) | `pt N` continuation → fresh spiritmender pass (bounded by `slotManagerStatics.spiritmender.maxAttempts`) |

---

## The sad paths in detail

(a)– (c) are not failure signals: they keep the quest `in_progress` and move it forward. (b2) is the one that can go
either way, because a carve red is routed by the CLASS of the step that failed. (d) is the one agent-emitted halt —
reserved for a wall no session of that role could pass.

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
`quest-block-on-failure-broker` instead of appending another fix loop. A ward red and a riftcarver red (§ (b2)) are the
failures the orchestrator detects on an agent's behalf; § (d) is the one an agent reports itself.

### (b2) riftcarver red → routed by failure class — `quest-run-riftcarver-broker`

A carve red is routed by the CLASS of the step that failed, off `worktreePrepareStepStatics.classifications` — keyed by
the step's own VALUE, the thing `WorktreePrepareError` carries, so a caught error routes without a second key to
translate through. Only one of the classes is repairable, and only that one earns a spiritmender. The whole outcome — the work item's terminal status, the operation completing, the `riftcarverResults` ref, the work
item's `riftcarverResults/<id>` back-link, and any splice — lands in ONE `questOperationsUpdateBroker` write, so a
crash is all-or-nothing.

| Class | Steps | What happens |
|---|---|---|
| `repairable`, budget left | `node_modules`, `build` | work item `failed` with `errorMessage: riftcarver_<step>_failed`, operation `complete`, a **spiritmender** operation item plus a fresh **`pt N` riftcarver** spliced immediately after it — the fresh carve copying the completed item's `flowIds` and `packageNames` — then advance → the spiritmender runs next, in the quest's own worktree |
| `repairable`, budget spent | same | `quest-block-on-failure-broker` |
| `git-state` | `create`, `base_branch` | work item `failed` carrying git's own words verbatim, operation `complete`, then `quest-block-on-failure-broker` — **never a repo-root agent** |
| permission-denied, ANY step | any | same as `git-state`, whatever the step's own class says |

Three things about that routing are load-bearing:

- **The spiritmender has somewhere to work.** `{ branchName, baseBranch, worktreePath, baseRef }` is persisted the
  moment the git steps finish and BEFORE `node_modules` or the build runs, so a repair dispatched after either of
  those fails lands in a real worktree — and the `pt N` carve behind it skips the git steps it can see are done.
- **The error message is written for whoever can act on it.** A repairable red hands the spiritmender a
  machine-readable step name; a git-state or permission red hands the USER git's own text, because nothing downstream
  can act on it and the failed execution row is where they read it.
- **The spiritmender's operation text names the failing step AND the riftcarver result id.**
  `operationPtChainTransformer` keys a chain on role + base text, so naming the attempt is what buys it its own pt
  budget instead of sharing one with every other repair on the quest.

Riftcarver, like ward, runs no round and writes no code, so no standards review is owed for it — and neither reaches
`signal-back` at all, so neither is bound by the three gates below.

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

**A retained `sessionId` is never thrown away.** The resume decision lives in
`buildSpawnInstructionLayerBroker` and keys on `sessionId !== undefined && agentId === undefined` —
NOT on the `resume` marker. Any dispatchable work item that has a session resumes it, whatever the
role. The marker is still written as a record of "this item was reclaimed", but gating on it meant an
item whose session was recorded and then never formally reclaimed (a quest that blocked before
recovery reached it, a hand-repaired quest.json) fresh-spawned instead — and the new child's init line
overwrote `sessionId`, silently orphaning a session that still held real work. `agentId` is the ONE
exception: `get-agent-prompt` stamps it together with a `sessionId` that is the user's
`/dumpster-launch` loop session, not the agent's own, so resuming it would hand a headless child the
user's interactive session.

The resume prompt leads with the fact that the session was KILLED, not paused: its context ends
mid-action, so the agent's last edit/command/commit may never have landed. It requires re-establishing
real state (`git status`, re-read the files, re-run the check that was in flight) BEFORE any new work,
because an agent that trusts its own context re-reports work it never finished or redoes work it
already committed.

A **reconcile net** in the same broker covers the (atomically-unreachable) case where a work item is
terminal but its operation item is still `in_progress`: flip the work item back to `pending` (keeping
identity + resume marker) so it re-dispatches and re-signals. It can never un-complete a quest,
because the status transformer never derived `complete` while an operation was non-complete.

An escalation ends the scan. `recoverOrphanedWorkItemsLayerBroker` returns `{ quest, blocked }`, and
`scan-once-layer-broker` returns `null` on `blocked: true` instead of continuing to the advance
self-heal — the status filter that admitted the quest ran BEFORE the block was written, so nothing
downstream would notice on its own. Continuing would mint the next ledger scope's work item and
dispatch an agent against a halted quest, and would read `pending` for items the block had just
drained to `skipped`.

### (c2) API overload → wait it out — `spawn-one-agent-layer-broker`

A dispatched child that exits non-zero having emitted a 529 / `overloaded_error` marker did not fail;
the upstream Anthropic API did. This is NOT an orphan and must not spend recovery budget: a 529 death
takes seconds, so three of them inside a few minutes would exhaust `orphanRecovery.maxResets` and
block the quest over an outage that clears on its own. The spawn layer instead re-dispatches the SAME
work item in place on `apiOverloadRetryStatics`' schedule — 10 retries one minute apart, then 20 five
minutes apart, a ~110 minute window — and resumes the captured `sessionId` when the dead attempt got
far enough to have one, so an agent that worked for twenty minutes before the outage keeps its
context. The retry abandons itself if dispatch is paused (checked before AND after each backoff, which
can sleep for minutes) or if the work item went terminal during the wait (it signalled back, then
lost the API). Only once the schedule is spent does the death fall through to orphan recovery.

Detection requires BOTH signals: `isApiOverloadLineGuard` matching an output line AND a non-zero exit
code. An agent that merely prints "API Error: 529" while exiting 0 is a success.

Each attempt registers its own process id and `unregisterProcess`es it on exit, so the stale-process
watchdog (which only warns, never kills — a minutes-long backoff is safe) does not accumulate an entry
per dead child.

### (d) blocked → pt N + immediate halt — `QuestHandleSignalBackResponder`

`operationStatus: 'blocked'` (with a required `blockedReason`) is the **environment wall**: a command the dispatched
session is denied, a missing credential, an unreachable service — something no fresh session of the same role could get
past. In one atomic write the linked operation item is marked
`complete` and a `pt N` continuation is appended (identical to (a), so a resume re-dispatches this exact scope), while
the signalling work item is marked **`failed`** carrying `blockedReason` as its
`errorMessage` — which the execution row renders, so the user reads WHY the quest stopped. Then
`quest-block-on-failure-broker` drains pending work items to `skipped` and sets the quest `blocked`.

Two deliberate asymmetries with (a):

- **The pt budget does not gate the append.** The halt is itself the bound. Withholding the continuation would leave the
  operation with no pending item, so a resume would silently skip the scope entirely.
- **Advance never runs.** The next session would hit the identical wall; that is precisely the waste this outcome exists
  to prevent (a role that signals `partial` at a wall burns its whole pt budget on sessions that cannot succeed, then
  blocks anyway with nothing recorded about why).

Roles learn to reach for this via `agentOperatingRulesStatics` Rule 5, embedded in every file-changing prompt (Rule 5
is one of the four blocks shared verbatim across all three variants — `markdown`, `delegatingMinionMarkdown` and
`leafMinionMarkdown` — so a minion reports the same wall to its parent that a role reports to the orchestrator).

### (e) dirty worktree → signal REFUSED — the commit-before-signal gate

The three signal-back gates run BEFORE any mutation, so every refusal below persists NOTHING: the work item stays
`in_progress`, the operation item stays as it was, and the session fixes what the message names and signals again.
That is why the refusal is a THROW rather than a returned error — it rides the awaited `signal-back` path back through
the MCP tool to the agent, where it is visible and actionable, instead of being swallowed as a success.

This first gate binds every role that changes code: the five orchestrator roles plus `spiritmender` and `warpgate`.
It applies on **`done`, `partial` AND `blocked` alike** — a blocked quest hands its work forward through git exactly
as a finished one does, so the outcome that halts is the one that most needs the work durable first. The measurement
is `gitWorkingTreeFilesBroker`, which unions `git diff HEAD --name-only` with `git ls-files --others
--exclude-standard`: a bare diff reports TRACKED paths only, so the net-new files a worker just wrote — the ones most
likely to carry the defect — would be invisible to it and a dirty tree would read as clean. The question is **"is the
tree clean", never "did you make a commit"**: `git commit --allow-empty` satisfies it, so a round that legitimately
changed nothing still signals. A quest whose cwd does not resolve to a worktree (hydrated, or seeded before
worktrees) SKIPS the check rather than failing it, and for a role outside the set no git command runs at all.

This is a computed gate rather than a line in the operating rules because the prose version was measured and found
wanting: a session died ONE gate short of its commit holding a fully verified, twice-green artifact, the re-carve
destroyed it, and that slice cost 101 minutes of wall-clock for 11 minutes of real work with nothing in `quest.json`
to say any of it happened.

### (f) `done` with no review trace → signal REFUSED — the review-coverage gate

On `done` from any of the five orchestrator roles, `signal-back` also refuses while NO
`quest.planningNotes.blightLedger` entry carries THAT work item's id. Membership is read off
`roleToDisciplineStatics` rather than listed, so a role added to that map is gated the day it is added — the same
reason `isChatWorkItemRoleGuard` reads `workItemRoleStatics.chat` instead of growing an `||` chain. Every disposition
clears: `gap` and `recorded` with a real reason count exactly as `reviewed` does, so the gate refuses absence, not
honesty. The two ways out are to dispatch a `reviewer-minion` over the round's output, or to signal `partial` and hand
that scope to a fresh session.

It is deliberately COARSER than the sign-off gate, and the coarseness is forced by the round loop. The orchestrator
commits per ROUND, so at signal time the tree is clean by construction: a per-unit `working-tree` measurement would be
empty and a `commit` one would see only the last of several round commits. There is no per-unit precision to be had at
that point; what IS measurable is whether the round's reviewer ran at all. And it is a gate rather than a prompt line
for the reason a post-mortem measured directly — a computed parameter with a named consequence bolted to it was passed
correctly 30 times out of 30, while the prose instruction to "record dispositions as you go" was ignored 13 times out
of 13.

---

## Block ownership

`quest-block-on-failure-broker` is the **sole** path to `blocked`. It marks the failed work item
`failed`, drains every still-`pending` work item to `skipped`, and sets quest status `blocked`. It is reached from a
spent bounded loop, from an agent-reported environment wall, or from a carve failure no session could repair:

1. **Ward retry exhausted** — `quest-run-ward-broker`, when the red-ward chain of a `wardMode` reaches
   `ward.maxRetries` since the last green of that mode.
2. **pt-N chain exhausted** — `QuestHandleSignalBackResponder`, when a **locked** role's `pt N` chain
   reaches `slotManagerStatics.<role>.maxAttempts`.
3. **Orphan recovery exhausted** — `recover-orphaned-work-items-layer-broker`, when a work item's
   `retryCount` reaches `orphanRecovery.maxResets`.
4. **Environment wall reported** — `QuestHandleSignalBackResponder`, on `operationStatus: 'blocked'`
   (§ (d)). Unlike 1–3 this halts on the FIRST occurrence rather than a spent budget, because the budget could only be
   spent on sessions that provably cannot succeed.
5. **Riftcarver git-state or permission failure** — `quest-run-riftcarver-broker` (§ (b2)), when the carve dies at a
   `git-state` step (`create` / `base_branch`) or on a permission-denied error at ANY step. Like 4 this halts on the
   FIRST occurrence: a quest with no worktree has only the repo-root checkout left, and dispatching an agent there is
   the outcome this block exists to prevent. The same broker ALSO reaches this path through 1's shape — a
   `repairable` chain that reaches `riftcarver.maxRetries` since the last green carve.

There is no PathSeeker and no replan. A `blocked` quest is not dispatched: the scan filters on
`isAnyAgentRunningQuestStatusGuard` (`== in_progress`), so a `blocked` quest is skipped and dispatch
halts. The user can resume it (`blocked → in_progress`).

## Resuming a blocked quest — rearm, don't just unblock

`OrchestrationResumeResponder` handles both halts: a user PAUSE (restore `pausedAtStatus`) and a
`blocked` quest (no snapshot exists — a block is not a pause — so it restores `in_progress`). The web
RESUME button routes every resumable status through this endpoint; a bare status PATCH is wrong.

A block leaves wreckage that a status flip alone does not clear: the item that blocked reads `failed`
with `retryCount` AT `orphanRecovery.maxResets`, and everything queued behind it was drained to
`skipped`. Re-entering the scan with that intact means the first recovery pass re-escalates the same
exhausted item and blocks again — the user presses RESUME and watches nothing happen.

So the blocked path rearms first, via `quest-resume-rearm-work-items-transformer`: every work item
whose linked operation item is still unfinished goes back to `pending` with `retryCount` cleared to 0,
**keeping** `sessionId` + the `resume` marker so dispatch resumes those Claude sessions rather than
discarding their work. Items whose operation item is `complete` are left alone — that is what keeps a
red ward's `failed` work item (already superseded by a spliced spiritmender + fresh ward) from being
resurrected. The rearm is persisted BEFORE the status flip, so no scan can observe the quest
dispatchable while the wreckage is still in place.

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
  item; a ready COMMAND item dispatches alone under its own step type — `run-riftcarver` for a carve,
  `run-ward` for a gate — never batched beside an agent.
- **REL-4 — Advance is atomic + idempotent.** Work-item-terminal + operation-`complete` + optional
  `pt N` land in ONE `questOperationsUpdateBroker` persist, so a crash is all-or-nothing. Advance is
  called from both the signal handler AND the scan self-heal, and is safe from both.
- **REL-5 — No false complete.** `workItemsToQuestStatusTransformer` never derives `complete` while
  any operation item is `pending`/`in_progress` (the "all work items momentarily terminal, advance not
  yet run" window).
- **REL-6 — Duplicate-on-partial.** `partial` → operation `complete` + a `pt N` continuation → a fresh work item. A
  locked role's chain is bounded. What earns `done` is role-dependent: for `ward` it is a fresh run that came back
  green; for `flowrider`, `groundstomper` and `siegemaster` it is that role's OWN track carrying a sign-off on every
  unit in its own denominator. Both verdicts
  (`confirmed`, `unconfirmable`) satisfy a track — the gate refuses ABSENCE, not honesty.
- **REL-6d — Commit-before-signal.** For any role that changes code (the five orchestrator roles plus `spiritmender`
  and `warpgate`), `signal-back` THROWS while the quest worktree carries uncommitted changes — **on `done`, `partial`
  AND `blocked` alike**, and nothing is persisted on the refusal. The measurement unions `git diff HEAD --name-only`
  with `git ls-files --others --exclude-standard`, so a net-new untracked file counts. It asks whether the TREE IS
  CLEAN, never whether a commit was made: `git commit --allow-empty` satisfies it. A quest whose cwd does not resolve
  to a worktree SKIPS the check rather than failing it, and no git command runs for a role outside that set.
- **REL-6e — Review coverage.** `signal-back` THROWS on `done` from any of the five orchestrator roles while NO
  `planningNotes.blightLedger` entry carries THAT work item's id — the trace a `reviewer-minion` round leaves. Every
  disposition clears (`gap` and `recorded` with a real reason count as `reviewed` does); what it refuses is absence.
  Membership is read off `roleToDisciplineStatics`, so a role added to that map is gated the day it is added.
  `partial` is the honest alternative, and it hands the round's scope to a fresh session.
- **REL-6f — Gates precede mutation, idempotency precedes gates.** All three gates run BEFORE any write, so a refusal
  leaves the work item and its operation item exactly as they were and the session can fix and signal again. The
  already-terminal check runs ahead of all three, so a redelivered signal pays no git cost.
- **REL-6a — The two flow tracks are independent.** `flowriderSignoff` and `siegemasterSignoff` gate different
  operation items, and writing one never advances the other's gate. There is no aggregate per-unit status: a unit
  signed by one track and not the other is a normal mid-quest state, and a `flowrider` item can be `done` while every
  `siegemaster` item on the same flows is still outstanding.
- **REL-6b — A reset clears one track on one flow.** `reset-flow-signoffs` removes `siegemasterSignoff` from every
  unit of the named flow, leaves `flowriderSignoff` and every other flow untouched, and appends a `walk-reset`
  `questNotes` entry. It consumes no pt-chain attempt.
- **REL-6c — A note never closes a unit.** A `questNotes` entry of any `kind` leaves both tracks' remaining sets
  unchanged; only a sign-off shrinks them.
- **REL-7 — Idempotent signal.** A redelivered signal for an already-terminal work item is a no-op
  (no second `pt N`, no second advance side effect).

### Riftcarver

- **RIFT-1 — Every step is re-entrant.** The repairable route is `riftcarver → spiritmender →
  riftcarver (pt N)`, so the broker is re-entered against a PARTIALLY BUILT workspace as a matter of
  routine, not as an edge case. Therefore **every step begins with a done-check that inspects the
  REAL WORLD and skips itself when already satisfied — a step added without one is a bug, not a
  simplification.** Three rules qualify it:
  - **The done-check reads DISK or git, never `quest.json` alone.** A recorded `worktreePath` is a
    claim; a reachable directory whose HEAD is still the recorded branch is proof. The spiritmender
    that ran between the two attempts may have deleted, moved, repaired or `npm install`ed things the
    ledger knows nothing about. So: the base branch is re-verified with `gitVerifyRefAdapter` rather
    than trusted; the worktree is checked with `fsIsAccessibleAdapter` AND `gitCurrentBranchAdapter`;
    a recorded path that is GONE reads as not-done and is RE-CREATED (attaching to the branch without
    `-b`, after a `git worktree prune`, when the branch itself survived) rather than blocking; the
    `node_modules` mirror done-checks PER ROOT inside `populate-one-root-layer-broker`, because an
    attempt may have mirrored six roots of nine before dying. Every skip emits its own `— skip … —`
    line, so the streamed output IS the evidence the contract held.
  - **The BUILD is the one deliberate exception and has NO done-check.** Re-running it is precisely
    how the spiritmender's fix gets verified — the build is the verdict, not a side effect. A marker
    file "optimising" it away would let a `pt N` report green off the previous attempt's result.
  - **The collision check is skipped on a re-entry, deliberately.** It guards the FIRST carve against
    a name some other work owns. On a `pt N` the quest already records the branch — it is the quest's
    OWN — so re-running the check would refuse the continuation against work attempt 1 did and lock
    the quest out permanently. This is the step that breaks first if a done-check is dropped.
- **RIFT-2 — `baseRef` is written exactly once, ever.** It is read from the new worktree's HEAD in
  the same breath as creation, before `node_modules` or the build can touch the tree, and NEVER
  recomputed once recorded — not even when the worktree is re-created and its fresh HEAD reads back a
  different sha. Moving it after commits have landed folds the quest's own work into the review base,
  the exact defect `baseRef` exists to fix. Riftcarver is its SOLE writer: `questBuildRelayGraphBroker`
  stamps none, because Start runs before any worktree exists and the only HEAD available there is the
  server process's own checkout.
- **RIFT-3 — Routed by class, never by one rule.** `worktreePrepareStepStatics.classifications`,
  keyed by step VALUE, sends `create` / `base_branch` to a block and `node_modules` / `build` to the
  spiritmender loop; `isPermissionDeniedErrorGuard` is checked FIRST and overrides both. **No agent is
  ever dispatched while the quest's only checkout is the repo root.**
- **RIFT-4 — Bounded.** The repairable chain is the count of riftcarver operation items since the last
  GREEN riftcarver, bounded by `slotManagerStatics.riftcarver.maxRetries`; exceeding it blocks instead
  of splicing another repair.
- **RIFT-5 — Every attempt keeps its own history.** Each run writes its OWN
  `riftcarver-results/<uuid>.log` and appends its OWN `riftcarverResults` ref plus a
  `riftcarverResults/<id>` back-link on its work item, so a pt chain leaves N files and N refs rather
  than one overwritten file. That ref is the only route the execution panel has to the detail.
- **RIFT-6 — It streams, and the stream and the file agree.** `onLine` is REQUIRED (a command work
  item has no `sessionId`, so no JSONL watcher can tail it). Both the live panel and the persisted log
  are fed from one funnel, so they carry the same text in the same order.
- **RIFT-7 — Start creates no workspace.** `OrchestrationStartResponder` spawns nothing and runs no
  git; the seeded ledger's first operation item is `role: 'riftcarver'` with a linked work item
  carrying `spawnerType: 'command'`.

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
- **ORPH-1a — A retained session is NEVER clobbered.** `buildSpawnInstructionLayerBroker` resumes on
  `sessionId !== undefined && agentId === undefined` — the `resume` marker is NOT consulted, so an
  item whose session was recorded but never formally reclaimed still resumes instead of fresh-spawning
  and overwriting `sessionId` with a new id. `agentId` is the sole exception: it is stamped only
  alongside an MCP parent-loop `sessionId`, which is not the agent's own session to resume. Proven
  end-to-end in `dispatch-resumes-retained-session.e2e.ts` by reading the spawned child's real argv.
- **ORPH-2 — Bounded.** `retryCount ≥ orphanRecovery.maxResets` → `blocked`.
- **ORPH-3 — An API overload never spends the budget.** A non-zero exit carrying a 529 /
  `overloaded_error` marker retries in place on `apiOverloadRetryStatics`' two-tier schedule with
  `retryCount` untouched, resuming the captured session. Only a spent schedule reaches recovery.
- **ORPH-4 — The overload retry yields.** It abandons on a paused dispatcher (checked before and
  after each backoff) and on a work item that went terminal during the wait.

### Block

- **BLK-1 — Sole block owner.** `quest-block-on-failure-broker` is the only writer of `blocked`,
  reached from ward-retry exhaustion, pt-N-chain exhaustion, orphan-recovery exhaustion, an
  agent-reported environment wall, or a riftcarver git-state / permission failure.
- **BLK-2 — A blocked quest is not dispatched.** The scan filters on `in_progress`, so a `blocked`
  quest is skipped and dispatch halts; the user resumes it explicitly.
- **BLK-3 — A block ends its own scan.** When recovery escalates, `scan-once-layer-broker` returns
  `null` without running the advance self-heal — no work item is minted for the next ledger scope and
  nothing is dispatched against the quest that just halted.
- **BLK-4 — Resume rearms.** `blocked → in_progress` returns every work item whose operation item is
  still unfinished to `pending` with `retryCount` 0, keeping `sessionId` + the resume marker, and
  persists that BEFORE the status flip. A resume that only flipped the status would re-block on the
  next scan.

### Contract integrity

- **C-1 — `dependsOn` references resolve** to existing work items in the same quest.
- **C-2 — The graph is a DAG** (no cycles).
- **C-3 — `relatedDataItems` reference valid collections** — `operations`, `wardResults`,
  `riftcarverResults`, `flows` (the exact set `relatedDataItemContract`'s regex admits) — and existing
  ids.
- **C-4 — Chat roles set status only within their phase** (ChaosWhisperer: `created` →
  `review_observables`; Glyphsmith: `approved` → `design_approved`).

---

## Full happy path (feature, E2E reference)

```
[USER] /dumpster-create → quest created, plan operation item seeded (in_progress, locked)
   ChaosWhisperer authors flows/observables/contracts/packagesAffected — never operations
   created → … → review_observables
[USER] APPROVE observables (gate requires non-empty flows only) → approved
[USER] Start Quest → questBuildRelayGraphBroker seeds the riftcarver head item, DERIVES the codeweaver
        items (fanOutBy: 'implementation') + mints the verify tail (locked, pending),
        force-completes the plan item, creates the first work item — the riftcarver
        approved → in_progress   (milliseconds: no spawn, no git, no build)
[DISPATCHER] Node/UI play button (or /dumpster-launch)
   ▼ riftcarver       [run-riftcarver]  → green → advance     (base branch → git worktree add → pin
                                                               baseRef → mirror node_modules → preflight
                                                               build; streams live, log persisted to
                                                               riftcarver-results/<id>.log)
   ▼ codeweaver ×N (one session each)   → done → advance     (each session = one ROUND LOOP, below)
   ▼ ward (changed)   [run-ward]        → green → advance
   ▼ flowrider (one per package slice)  → done → advance     (round loop; its reviewer-minion is the only
                                                              writer of that slice of the flowrider track)
   ▼ groundstomper (one per e2e flow)   → done → advance     (round loop; sole author of .e2e.ts Playwright
                                                              specs, one browser walk at a time)
   ▼ siegemaster (one session per flow) → done → advance     (round loop; repeats per flow, resets its own
                                                              track after each fix)
   ▼ ward (full)      [run-ward]        → green → advance
   No pending operation item remains → workItemsToQuestStatusTransformer derives complete ✓
The dispatcher's next get-next-step picks up the next FIFO quest.

Every "one session" above expands to, at most three times over:
   build → planner-minion → read the plan back → worker-minion (one at a time) → reviewer-minion
         → build → scoped ward → COMMIT the round → loop while REMAINDER is non-empty
   …then signal-back, which refuses `done` unless the tree is clean AND the round's reviewer left a
   blightLedger entry for this work item.
```

**Nothing is interleaved into the diagram at run time.** The ledger a quest starts with is the one it runs, plus `pt N`
continuations and the ward/riftcarver splices. Standards review is inside each session's own round, before that
session's commit — not a step between two sessions.

Sad-path insertions that keep the quest `in_progress`: a codeweaver `partial` inserts a `pt N`
codeweaver; a red ward inserts `spiritmender → fresh ward`; a REPAIRABLE riftcarver red (node_modules
or build) inserts `spiritmender → pt N riftcarver`, and the pt N skips the git steps it can see are
already done while re-running the build; a verify role `partial` inserts a `pt N` of that role; a
server crash resumes the in-flight session. The routes that reach `blocked` are an exhausted bounded
loop (ward-retry, riftcarver-retry, locked pt-N chain, or orphan recovery), an agent-reported
environment wall, and a riftcarver `git-state` or permission failure.
