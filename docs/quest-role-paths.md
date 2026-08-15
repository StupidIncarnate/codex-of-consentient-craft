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
  over its life** — never re-linked, never status-reverted. Ward work items additionally carry a
  `wardResults/<id>` ref.
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
- **Operator convergence** — `flowrider`, `groundstomper`, `siegemaster`, and `blightscout` do NOT use the fixpoint.
  They signal on
  remaining SCOPE, measured **per track**: `done` once every unit in scope is settled on that role's OWN track
  (`flowriderSignoff` for flowrider and groundstomper over disjoint package kinds, `siegemasterSignoff` for
  siegemaster, a `blightLedger` disposition per review unit for
  blightscout, scoped to the ONE commit it was dispatched to review, not the whole quest diff), `partial` only when a
  named remainder is left. Verdicts are per role; **there is no aggregate
  status** and no unit-level "done" that both roles share. Flowrider and Siegemaster delegate to minions and then
  re-read the files they wrote, so each already IS the fresh pair of eyes a `pt N` session would supply — authoring a
  test, walking a path, or landing a fix is the job, not a reason to respawn the role. Groundstomper and Blightscout
  run with no minions at all (one browser walk; one commit), so for them the fresh pair of eyes IS the next dispatched
  session.
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
| `feature`  | `/dumpster-create` (ChaosWhisperer) | **DERIVED** `codeweaver` items — one `fanOutBy: 'implementation'` seed, never authored | `ward(changed) → flowrider → groundstomper → siegemaster → ward(full)` |
| `bug-hunt` | `/dumpster-hunt` (BugHunt intake)   | orchestrator-seeded `pesteater` (`initialWorkItemRole` is null)           | `ward(changed) → ward(full)`                     |

So the full feature relay is:

```
chaoswhisperer (plan item)   → codeweaver ×N (DERIVED at Start, not authored)
  → ward(changed)
  → flowrider ×N (one per package it owns + one seam item, bundled to minions)
  → groundstomper ×N (one per runtime flow a browser can reach)
  → siegemaster ×N (one per flow, bundled to minions)
  → ward(full)
```

and the full bug-hunt relay is:

```
pesteater
  → ward(changed) → ward(full)
```

Neither tail seeds a blight-review item. `blightscout` — the one-commit standards review that replaced
`blightwarden` — is APPENDED by `QuestHandleSignalBackResponder` after every session above that commits, never seeded
once here. Eligibility is membership in `blightscoutOperationStatics.committingRoles` (`codeweaver`, `flowrider`,
`groundstomper`, `siegemaster`, `pesteater`, `spiritmender`); `blightscout` itself is absent from that list, which is
what makes the append terminate at one review per committing session. So a real feature run dispatches
`codeweaver → blightscout → … → ward(changed) → flowrider → blightscout → …`, and a bug-hunt run dispatches
`pesteater → blightscout → ward(changed) → ward(full)`.

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
fans out to ONE OPERATION ITEM PER RUNTIME FLOW that reaches a browser-reachable package, runs with no minions, and
writes `flowriderSignoff` over the package kinds Flowrider's list excludes.
`siegemaster` is also an **operator**, but fans out to ONE OPERATION ITEM PER FLOW instead — each carries a single
`flowId`, so each flow gets its own pt-continuation chain. Its track counts runtime and operational flows alike, plus
the seven off-map probe families, which Flowrider's denominator excludes. A flow-less quest still gets exactly one
siegemaster item, because those off-map families — `hostile-input` and `perf` above all — are where the quest's
security and performance are established at all, and they belong to no drawn flow.

`blightscout` — the role that replaced `blightwarden` — is also an **operator**, but the shape flipped: where
`blightwarden` was ONE operation item self-scoping over the **whole** diff (170 files on the quest that motivated the
change, cut into 29 groups of 6 and dispatched 8 minions at a time), `blightscout` is scoped to exactly ONE COMMIT
per item, summons no minions, and is meant to be dispatched repeatedly — once after every role that commits — rather
than once at the end. It reviews five concerns (`craft`, `perf`, `dedup`, `integrity`, `test-cases`) instead of
`blightwarden`'s four; dead-code detection is dropped entirely, deliberately unowned pending a deterministic
orphan-export tool. Bug-hunt reuses the same flow/observable spec lifecycle (the reproduction
path is a flow, the expected behavior is an observable that PestEater turns into a failing test).

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
| `flows_approved`, `approved`, `design_approved` | **User** (APPROVE button)                 | The approval gates; each requires non-empty `flows` — nothing else         |
| `in_progress`                                   | `start-quest` / Start Quest button        | Spec locked; the relay is seeded and dispatch begins                        |
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
   - `questBuildRelayGraphBroker` force-completes any non-complete intake (`chaoswhisperer` /
     `glyphsmith`) operation item, then mints `startImplementationOps` + the fixed verify tail as
     pending operation items (locked, except the `codeweaver` seed itself — see below) and creates ONE
     work item for the first actionable (`pending`) operation item — the first `codeweaver` — linked
     `operations/<id>`, depending on the completed chat work items.
   - **This is where the codeweaver items are born.** `startImplementationOps` for a feature quest is
     ONE seed, `{ role: 'codeweaver', fanOutBy: 'implementation', locked: false }`. `questBuildRelayGraphBroker`
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

4. **The dispatch loop** picks up that codeweaver work item. The agent reads its operation item + git
   + the ledger, verifies it's the right next step, builds, commits a prose handoff, and signals
   `complete` carrying `operationItemId` + `operationStatus: 'done'`.

5. **`QuestHandleSignalBackResponder`**, in ONE atomic `questOperationsUpdateBroker` write, marks the
   work item terminal (`complete`) + the linked operation item `complete`, then calls
   `questAdvanceBroker` → the next `pending` operation item (the next `codeweaver`) gets its work item.
   Repeat until all codeweaver items are complete.

6. **Ward operation items** are dispatched as `run-ward` (`spawnerType: 'command'`) and handled by
   `quest-run-ward-broker` (see the ward path below).

7. **Verify roles** run in tail order — `flowrider`, `groundstomper`, then `siegemaster`. All
   three are
   **operators**: `flowrider` runs one session per package slice below the browser, `groundstomper` one per
   browser-reachable runtime flow, each signalling `done` once every unit in
   scope is settled on their own track; `siegemaster` runs one session PER flow,
   each signalling on that flow's own scope and its own track. The two flow tracks are INDEPENDENT — an authoring
   signature does nothing to Siegemaster's gate, and vice versa. Each role's chain is keyed on role + base
   text — `flowrider` holds one chain per package slice,
   `groundstomper` and `siegemaster` one PER flow. There is no seeded blight-review item in this tail at all:
   `blightscout` is APPENDED by the signal-back handler after every role above (and `codeweaver` before them) that
   commits, rather than run once here (see "Quest types and their relay tails" above), so a review runs between each
   pair of committing sessions.
   After `siegemaster` and its trailing review converge, `ward(full)` runs; on green, no `pending` operation item
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
`operationStatus: 'done' | 'partial' | 'blocked'` and the orchestrator applies it server-side (authoritative — an agent
cannot forget to patch the ledger, because agents never write the ledger). Ward is the one role whose terminal state
comes from an exit code, not a signal.

`blocked` is available to EVERY role in the tables below and behaves identically for all of them, so it is documented
once in § (d) rather than repeated per role: the operation item completes and gets a
`pt N` continuation exactly as for `partial`, but the work item is marked `failed` carrying
`blockedReason`, the pt budget is bypassed, and the quest halts immediately.

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

### Verify / review (feature tail; flowrider, groundstomper, siegemaster all operators — `blightscout` is not seeded in this tail; see below)

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
  once every unit in that slice carries a `flowriderSignoff`. It delegates each bundle to a
  `flowrider-authoring-minion`, then dispatches
  ONE `flowrider-coverage-minion` — the only writer of that track, because the minion that wrote a test cannot be the
  one that certifies it — and signs, itself, any observable it adds at its own final spec gate, which runs after the
  audit.
- **`groundstomper` — does the flow hold when a browser walks it?** Its scope is the ONE runtime flow its item names,
  narrowed to that flow's browser-reachable packages. It is the sole author of `.e2e.ts` Playwright specs, runs with
  no minions, and writes `flowriderSignoff` over the package kinds Flowrider's list excludes. It inventories the
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

> **`blightscout` is not part of this table** because it is not part of the seeded tail at all (see "Quest types and
> their relay tails" above). It is designed to be a separate, ONE-COMMIT operation item — `is the changed CODE well
> made?`, `get-blight-checklist({ scope: 'commit' })` across FIVE concerns (`craft`, `perf`, `dedup`, `integrity`,
> `test-cases`), each unit disposed into `quest.planningNotes.blightLedger` — appended by the signal-back handler
> after every role above (and `codeweaver`) that commits, so it would run many times per quest rather than once at
> the end like old `blightwarden`. Same completion mechanics apply once one IS seeded: `done` is gated by
> `signal-back` exactly like the three roles above, `partial` appends a `pt N` continuation bounded by
> `slotManagerStatics.blightscout.maxAttempts`, and it holds its OWN budget per commit rather than one for the whole
> quest — which the append site buys by NAMING the completed operation item (role + id) in the review's text, since
> `operationPtChainTransformer` keys a chain on role + base text and one shared sentence would make every scout on the
> quest a single chain. It summons no minions — its whole surface is a single session's output, so there is nothing to fan out. This
> role replaces `blightwarden` and its three now-deleted minions (`blightwarden-group-minion`,
> `blightwarden-crosscut-minion`, `blightwarden-deadcode-minion`); `agentPromptClassificationStatics.roleNames` and
> `.minionNames` are now fully disjoint as a result — no minion is ever also a dispatchable role.

### The two verification tracks

Every verification unit — each terminal, each labelled branch, each observable, and each off-map probe family — carries
**two independent top-level sign-offs**:

| Field | Written by | Answers |
|---|---|---|
| `flowriderSignoff` | `flowrider-coverage-minion`, plus the Flowrider operator for units it adds at its own spec gate; and the Groundstomper session over the browser-reachable package kinds | is this proven by a test? |
| `siegemasterSignoff` | the Siegemaster operator, per artifact its walkers return | does this hold when a human drives the real system? |

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

| Role       | Terminal by | Happy (green, exit 0)                                   | Sad (red, exit ≠ 0)                                                                                          |
|------------|-------------|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Ward**   | exit code   | `quest-run-ward-broker` marks the ward work item `complete` + the ward operation item `complete`, advance → next role | work item `failed`, ward operation item `complete`, then appends a **spiritmender** operation item + a **fresh ward** operation item (`pt N`, same `wardMode`) AFTER it, advance → the spiritmender runs next (never a ward back-to-back), then the fresh ward re-verifies |

### Recovery

| Role             | Locked? | Happy (`done`)                                          | Sad (`partial`)                                                             |
|------------------|---------|--------------------------------------------------------|-----------------------------------------------------------------------------|
| **Spiritmender** | Yes     | fixes build/lint/type/test errors; advance → the fresh ward re-runs | `pt N` continuation → fresh spiritmender pass (bounded by `slotManagerStatics.spiritmender.maxAttempts`) |

---

## The sad paths in detail

(a)– (c) are not failure signals: they keep the quest `in_progress` and move it forward. (d) is the one agent-emitted
halt — reserved for a wall no session of that role could pass.

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
`quest-block-on-failure-broker` instead of appending another fix loop. A red ward is the only failure the orchestrator
detects on an agent's behalf; § (d) is the one an agent reports itself.

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

Roles learn to reach for this via `agentOperatingRulesStatics` Rule 5, embedded in every file-changing worker prompt.

---

## Block ownership

`quest-block-on-failure-broker` is the **sole** path to `blocked`. It marks the failed work item
`failed`, drains every still-`pending` work item to `skipped`, and sets quest status `blocked`. It is reached from a
spent bounded loop or from an agent-reported environment wall:

1. **Ward retry exhausted** — `quest-run-ward-broker`, when the red-ward chain of a `wardMode` reaches
   `ward.maxRetries` since the last green of that mode.
2. **pt-N chain exhausted** — `QuestHandleSignalBackResponder`, when a **locked** role's `pt N` chain
   reaches `slotManagerStatics.<role>.maxAttempts`.
3. **Orphan recovery exhausted** — `recover-orphaned-work-items-layer-broker`, when a work item's
   `retryCount` reaches `orphanRecovery.maxResets`.
4. **Environment wall reported** — `QuestHandleSignalBackResponder`, on `operationStatus: 'blocked'`
   (§ (d)). Unlike 1–3 this halts on the FIRST occurrence rather than a spent budget, because the budget could only be
   spent on sessions that provably cannot succeed.

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
  item; a ready ward item dispatches alone via `run-ward`.
- **REL-4 — Advance is atomic + idempotent.** Work-item-terminal + operation-`complete` + optional
  `pt N` land in ONE `questOperationsUpdateBroker` persist, so a crash is all-or-nothing. Advance is
  called from both the signal handler AND the scan self-heal, and is safe from both.
- **REL-5 — No false complete.** `workItemsToQuestStatusTransformer` never derives `complete` while
  any operation item is `pending`/`in_progress` (the "all work items momentarily terminal, advance not
  yet run" window).
- **REL-6 — Duplicate-on-partial.** `partial` → operation `complete` + a `pt N` continuation → a fresh work item. A
  locked role's chain is bounded. What earns `done` is role-dependent: for `ward` it is a fresh run that came back
  green; for `flowrider`, `groundstomper` and `siegemaster` it is that role's OWN track carrying a sign-off on every unit in its own
  denominator; for `blightscout` it is that ONE COMMIT's blight checklist (`scope: 'commit'`) with no undispositioned
  unit left. Both verdicts
  (`confirmed`, `unconfirmable`) satisfy a track — the gate refuses ABSENCE, not honesty.
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
  reached only from ward-retry exhaustion, pt-N-chain exhaustion, or orphan-recovery exhaustion.
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
- **C-3 — `relatedDataItems` reference valid collections** — `operations`, `wardResults`, `flows` —
  and existing ids.
- **C-4 — Chat roles set status only within their phase** (ChaosWhisperer: `created` →
  `review_observables`; Glyphsmith: `approved` → `design_approved`).

---

## Full happy path (feature, E2E reference)

```
[USER] /dumpster-create → quest created, plan operation item seeded (in_progress, locked)
   ChaosWhisperer authors flows/observables/contracts/packagesAffected — never operations
   created → … → review_observables
[USER] APPROVE observables (gate requires non-empty flows only) → approved
[USER] Start Quest → questBuildRelayGraphBroker DERIVES the codeweaver items (fanOutBy: 'implementation')
        + mints the verify tail (locked, pending), force-completes the plan item,
        creates the first codeweaver work item
        approved → in_progress
[DISPATCHER] Node/UI play button (or /dumpster-launch)
   ▼ codeweaver ×N (one session each)   → done → advance
   ▼ ward (changed)   [run-ward]        → green → advance
   ▼ flowrider (one per package slice)  → done → advance     (bundles flows to authoring minions, then
                                                              one coverage minion signs its slice of the track)
   ▼ groundstomper (one per e2e flow)   → done → advance     (sole author of .e2e.ts Playwright specs;
                                                              no minions, one browser walk at a time)
   ▼ siegemaster (one session per flow) → done → advance     (repeats per flow; walks via minions,
                                                              resets its own track after each fix)
   ▼ ward (full)      [run-ward]        → green → advance
   No pending operation item remains → workItemsToQuestStatusTransformer derives complete ✓
The dispatcher's next get-next-step picks up the next FIFO quest.
```

`blightscout` — the one-commit standards review that replaced `blightwarden` — is left out of the diagram above to
keep the seeded tail readable, but a real run interleaves one: it is not part of the seeded relay tail (see "Quest
types and their relay tails"), and the signal-back handler appends one operation item plus its linked work item after
EVERY session above that commits, ahead of any `pt N` continuation. Reading the diagram honestly means inserting a
`blightscout` step after each `codeweaver`, `flowrider`, `groundstomper`, `siegemaster` and `spiritmender` session.

Sad-path insertions (all keep the quest `in_progress`): a codeweaver `partial` inserts a `pt N`
codeweaver; a red ward inserts `spiritmender → fresh ward`; a verify role `partial` inserts a `pt N`
of that role; a server crash resumes the in-flight session. Only an exhausted bounded loop
(ward-retry, locked pt-N chain, or orphan recovery) reaches `blocked`.
