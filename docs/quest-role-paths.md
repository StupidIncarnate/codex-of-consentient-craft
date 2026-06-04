# Quest Orchestration — Role Paths & State Machine

This is the end-to-end reference for how a quest moves from a user request to built, tested, and
quality-checked code. Unit tests cover individual brokers and transformers; this doc covers the
**system-level behavior** — the dispatch model, the work-item state machine, the role chain, and how
quest status is derived from work-item states.

The authoritative companion to this doc is `packages/orchestrator/CLAUDE.md`, which covers the
JSONL chat-translation pipeline and the package-level wiring. This doc focuses on orchestration
control flow.

---

## The model in one paragraph

The orchestrator does **not** spawn agents. The **MCP server is the state machine**; the user's own
Claude session is the execution engine. The user runs a spec-conversation slash command
(`/dumpster-create` for a feature, `/dumpster-hunt` for a bug) that builds a validated quest, then
`/dumpster-launch` — a brainless dispatch loop: it calls `get-next-step()`, dispatches whatever the
server tells it to (`Task()` for agents, the `run-ward` MCP tool for ward), awaits, and repeats. All
"what runs next" decisions live server-side in `quest.workItems[]` and the `get-next-step` broker.
The orchestrator watches the JSONL files the user's session writes to disk — there is no
orchestrator-spawned Claude process.

---

## Quest types

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`).
`questTypeRegistryStatics` (`@dungeonmaster/shared/statics`) is the single source of truth per type:
its intake slash command, the create-time seed role, the Start-Quest graph kind, and the role set.
**Each type owns its COMPLETE work-item flow** — PathSeeker's four-tier graph is just the *feature*
type's planning sub-stage, not a universal stage.

| Type       | Intake                              | Start-Quest graph                                                                                                                                    |
|------------|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `feature`  | `/dumpster-create` (ChaosWhisperer) | PathSeeker graph → post-walk chain: `codeweaver → ward → siegemaster[per flow] → lawbringer → blightwarden → ward`                                   |
| `bug-hunt` | `/dumpster-hunt` (BugHunt intake)   | full chain hand-seeded at Start (no PathSeeker, no post-walk hook): `pesteater → ward(changed) → lawbringer(whole-diff) → blightwarden → ward(full)` |

`orchestration-start-responder` reads `registry[quest.questType].startGraphKind` and seeds the
matching graph (`questBuildPathseekerGraphBroker` vs `questBuildBugHuntGraphBroker`). Bug-hunt reuses
the same flow/observable spec lifecycle (the reproduction path is a flow, the expected behavior is an
observable that **PestEater** turns into a failing test). The rest of this doc describes the
`feature` flow in full; `bug-hunt` is the same dispatch machinery over a shorter, hand-seeded graph,
and its `lawbringer` runs in **whole-diff mode** (reviews the diff against the repo default branch, no per-step refs).

---

## Entry points

| Surface                          | Role               | What it is                                                                                                                                                                                                                                                                   |
|----------------------------------|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/dumpster-create` slash command | **ChaosWhisperer** | Interactive feature spec-writing conversation. First action: `create-quest`. Walks the status lifecycle through two approval gates.                                                                                                                                          |
| `/dumpster-hunt` slash command   | **BugHunt**        | Interactive bug-report intake (`questType: 'bug-hunt'`). Captures the reproduction path as a flow + the expected behavior as an observable, through the same two approval gates.                                                                                             |
| `/dumpster-launch` slash command | **The dispatcher** | Long-lived loop across ALL approved quests: `get-next-step()` → `Task()` / `run-ward()` → await → repeat. Never decides anything.                                                                                                                                            |
| Web UI "Start Quest" button      | —                  | Calls `orchestration-start-responder`, which flips quest status to `in_progress` and seeds the **type-appropriate** work-item graph (PathSeeker for feature, the PestEater chain for bug-hunt). **Spawns nothing** — `/dumpster-launch` picks the quest up on its next scan. |

`/dumpster-launch`'s entire contract (`.claude/commands/dumpster-launch.md`):

```
Loop forever:
  1. get-next-step()                          # blocks up to ~25s — normal
  2. switch on result.type:
     - spawn-agents → Task() every listed agent IN PARALLEL, taskPrompt verbatim, await all
     - run-ward     → run-ward({ questId, workItemId, mode }), blocks until ward exits
     - idle         → sleep 30 min, then get-next-step() again
  3. back to 1
```

---

## Quest data model

ChaosWhisperer builds a structured spec, not prose:

- **Flows** — graphs of typed nodes (`state` / `decision` / `action` / `terminal`) and labeled edges.
  Each flow is `runtime` (a recurring execution path, verified by walking it) or `operational` (a
  one-time state change, verified by checking final state).
- **Observables** — BDD `given` / `when` / `then[]` assertions embedded **inside** flow nodes
  (`flows[].nodes[].observables[]`). Each `then[]` entry has a `type` tag (`ui-state`, `api-call`,
  `file-exists`, `process-state`, `log-output`, etc.). The type tag is load-bearing: PathSeeker reads
  it for file planning; Siegemaster reads the distribution across a flow to pick its verification mode.
- **Contracts** — branded Zod data / endpoint / event shapes.
- **`packagesAffected[]`** — every package the implementation will touch. Drives parallel PathSeeker
  fan-out at Start Quest time.
- **Steps** — authored later by PathSeeker, not ChaosWhisperer. Each carries `assertions`,
  `instructions`, `focusFile`, `inputContracts` / `outputContracts`, and `dependsOn` (inter-step order).
- **WorkItems** — the execution units (see below). Server-only; stripped from any agent's `modify-quest`.

### Quest stages (read filters)

| Stage            | Sections                                                      |
|------------------|---------------------------------------------------------------|
| `spec`           | flows (with observables), designDecisions, contracts, tooling |
| `spec-flows`     | flows (nodes/edges only), designDecisions, contracts, tooling |
| `spec-obs`       | flows (observables only), designDecisions, contracts, tooling |
| `planning`       | planningNotes, steps, contracts                               |
| `implementation` | planningNotes, steps, contracts, tooling                      |

---

## Quest status lifecycle

```
created → explore_flows → review_flows → [Gate#1 user approves] → flows_approved
        → explore_observables → review_observables → [Gate#2 user approves] → approved
        → (optional) explore_design → review_design → [Gate#3] → design_approved
        → in_progress → complete
                       ├→ blocked → in_progress
                       └→ abandoned
```

| Status                                          | Set by                              | Notes                                                              |
|-------------------------------------------------|-------------------------------------|--------------------------------------------------------------------|
| `created`                                       | `create-quest`                      | ChaosWhisperer's first action                                      |
| `explore_flows` … `review_observables`          | ChaosWhisperer (via `modify-quest`) | The only roles that set status directly                            |
| `flows_approved`, `approved`, `design_approved` | **User** (APPROVE button)           | The approval gates                                                 |
| `in_progress`                                   | `start-quest` / Start Quest button  | Spec locked; `/dumpster-launch` begins dispatching                 |
| `complete`, `blocked`                           | **Derived** from work-item states   | `workItemsToQuestStatusTransformer` — never set directly by a role |
| `abandoned`                                     | User                                | Terminal                                                           |

The `seek_scope` / `seek_synth` / `seek_walk` enum values remain on the contract for quest.json
backward compatibility but are no longer assigned by any transition — the PathSeeker phase boundaries
they once encoded are now expressed as `dependsOn` edges on the four `pathseeker-*` work items.

**The `approved`/`design_approved` → `in_progress` hop is the only manual transition in the execution
phase.** Everything after it is driven by work-item states.

---

## Work-item model

All execution is driven by `quest.workItems[]`. Each item is a generic container:

- `role` — `pathseeker-surface` / `pathseeker-dedup` / `pathseeker-assertion-correctness` /
  `pathseeker-walk` / `codeweaver` / `ward` / `siegemaster` / `lawbringer` / `blightwarden` /
  `spiritmender` / `pesteater` (bug-hunt front).
- `status` — `pending` → `in_progress` → terminal (`complete` / `failed` / `skipped`).
- `dependsOn[]` — the **sole** ordering mechanism. There are no hardcoded role sequences.
- `spawnerType` — `agent` (dispatched via `Task()`) or `command` (ward, run via the `run-ward` MCP tool).
- `relatedDataItems` — links to quest data (`steps/<id>`, `flows/<id>`, `wardResults/<id>`).
- `sessionId` + `agentId` — parent `/dumpster-launch` session UUID, and the sub-agent's real internal
  agentId (used to scope chat replay to one `subagents/agent-<id>.jsonl` file).
- `wardMode` — `'changed'` or `'full'`, on ward items only.
- `maxAttempts` — carried on the item; consulted by recovery logic where it exists.

### Status semantics (verified against guards)

| Status        | Terminal? | Satisfies a `dependsOn`? | Counts as failure? |
|---------------|-----------|--------------------------|--------------------|
| `pending`     | no        | no                       | no                 |
| `in_progress` | no        | no                       | no                 |
| `complete`    | yes       | **yes**                  | no                 |
| `failed`      | yes       | **yes**                  | yes                |
| `skipped`     | yes       | **no**                   | no                 |

The single most important consequence: **`failed` satisfies a dependency, but `skipped` does not.** A
downstream item whose deps are all `complete`/`failed` becomes ready and runs. A downstream item with a
`skipped` dep never becomes ready.

---

## The dispatch engine: `get-next-step`

`quest-get-next-step-broker.ts` is the brain `/dumpster-launch` polls. One call:

1. **Load active quests** across all guilds; filter to `in_progress` quests with incomplete work.
   Per-guild failures are caught so one broken guild doesn't blank the scan.
   (`load-active-quests-layer-broker`)
2. **Pick the oldest FIFO quest** (by `createdAt`) that still has incomplete work, and set it as the
   active quest. (`scan-once-layer-broker`)
3. **Compute ready items** = `pending` items whose every `dependsOn` id is in a satisfying status
   (`complete` / `failed`). (`compute-ready-work-items-layer-broker`)
4. **Return a `NextStep`** (`compute-next-step-from-quest-layer-broker`):
    - If any ready item is a `ward` → `{ type: 'run-ward', questId, workItemId, mode }`. **Ward always
      dispatches alone.**
    - Else → `{ type: 'spawn-agents', agents }` with a batch (see below).
    - If nothing is ready → `null`, which triggers an internal long-poll (~25s) before returning
      `{ type: 'idle' }`.

### Batching (`select-batch-layer-broker`)

- All ready `pathseeker-surface` items → one `spawn-agents` batch (parallel, one per affected package).
- `pathseeker-dedup` + `pathseeker-assertion-correctness`, when both ready → one batch.
- Everything else → the single oldest ready item (one agent per response).

Slot caps (`slotManagerStatics`) remain configured but are **not consulted** by `get-next-step` —
concurrency is intrinsic to the batch shape.

---

## Plan phase: the PathSeeker work-item graph

At Start Quest, the insertion broker reads `quest.packagesAffected[]` and seeds one
`pathseeker-surface` work item per package, then the rest of the graph wired by `dependsOn`:

```
pathseeker-surface (×N, one per package, dependsOn: [])
        │   (after ALL surface items complete)
        ▼
pathseeker-dedup  +  pathseeker-assertion-correctness   (parallel, dependsOn: [all surface ids])
        │   (after BOTH complete)
        ▼
pathseeker-walk (single, dependsOn: [dedup, assertion-correctness])
        │   (post-completion hook)
        ▼
stepsToWorkItemsTransformer fires → downstream execution chain inserted
```

Each `pathseeker-*` item writes its output directly via `modify-quest`; work is durable the moment it
commits, so a Task crash after a write loses nothing. Resumed items read accumulated planning state via
the `get-quest-planning-notes` MCP tool.

| Role                               | Produces                                                                                                                                                                 |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `pathseeker-surface`               | `steps[]` + `contracts[]` for its package slice                                                                                                                          |
| `pathseeker-dedup`                 | Merges cross-slice + in-package duplicate contracts; rewrites consumer step contract-refs                                                                                |
| `pathseeker-assertion-correctness` | Fixes assertion well-formedness (channel discipline, clause-mapping, banned matchers, per-prefix `field` rules)                                                          |
| `pathseeker-walk`                  | Architect-review walk of every flow entry→exit; patches structural gaps, authors exploratory steps, commits `walkFindings`; its completion triggers the downstream chain |

### The post-walk hook

When a `pathseeker-walk` item signals `complete`, `quest-handle-signal-back-responder` fires
`questPostWalkHookBroker`, which:

1. Runs the **completeness scope** of `questValidateSpecTransformer` (step contract refs resolve, new
   contracts have a creating step, observables satisfied). On failure it throws — the downstream chain
   is not generated.
2. On pass, calls `stepsToWorkItemsTransformer({ steps, flows, pathseekerWorkItemId, now, batchGroups })`
   and persists the resulting chain via `questModifyBroker`.

This is the only point at which the authored plan is fully assembled, so the completeness check runs
here rather than at a status hop.

---

## Execution chain: `stepsToWorkItemsTransformer`

The downstream chain, exactly as wired (`steps-to-work-items-transformer.ts`):

```
codeweaver(s) → ward(changed) → siegemaster[one per flow, chained] → lawbringer(s) → blightwarden → ward(full)
```

| Item           | Count      | spawnerType | dependsOn                                                         | Notes                                                                                                                                |
|----------------|------------|-------------|-------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `codeweaver`   | N chunks   | agent       | `[pathseeker-walk id] + inter-step cw deps`                       | Steps chunked by `stepsToBatchChunksTransformer`; a chunk depends on the chunk(s) its steps depend on                                |
| `ward`         | 1          | command     | `[all codeweaver ids]`                                            | `wardMode: 'changed'`, `maxAttempts: slotManagerStatics.ward.maxRetries`                                                             |
| `siegemaster`  | 1 per flow | agent       | `[ward id]` (+ previous siege id)                                 | **Chained** so at most one siege runs at a time (dev-server / port / FS contention); each carries `relatedDataItems: ['flows/<id>']` |
| `lawbringer`   | N chunks   | agent       | `[all siege ids]` (or `[ward id]` if no flows)                    | Same chunking as codeweaver                                                                                                          |
| `blightwarden` | 1          | agent       | `[all lawbringer ids]` (or all sieges, or ward — first non-empty) | Whole-diff cross-cutting audit                                                                                                       |
| `ward` (final) | 1          | command     | `[blightwarden id]`                                               | `wardMode: 'full'`                                                                                                                   |

---

## Execution roles

Prompts live as statics in `packages/orchestrator/src/statics/*-prompt-statics.ts` and are served on
demand via the `get-agent-prompt` MCP tool. There are no `.claude/agents/*.md` files for execution
roles — `/dumpster-launch` hands each `Task()` a stub that says "call `get-agent-prompt({agent,
workItemId, questId})` and follow it." The MCP responder interpolates work-item context into the
returned prompt and stamps `sessionId` + `agentId` onto the work item.

| Role             | Receives                                                                                            | Produces / verifies                                                                                                                                                                                  | Signal                                           |
|------------------|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| **Codeweaver**   | One step chunk: assertions, instructions, focusFile, contracts, observables                         | Six gates: read context → discover standards → write tests first → confirm they fail behaviorally → implement → verify via ward + manual 100% branch-coverage audit                                  | `complete` / `failed`                            |
| **Ward**         | `mode` (`changed`/`full`)                                                                           | Runs `dungeonmaster-ward run [--changed]` as a shell command. Exit 0 → `complete`, non-zero → `failed`. Only non-agent role                                                                          | (terminal status set by exit code, not a signal) |
| **Siegemaster**  | One flow: nodes, edges, observables, entry/exit                                                     | Picks verification mode from observable-type distribution — Playwright E2E (runtime/UI), integration harness (API/CLI/queue), or ward+grep+adversarial (operational); writes real verification tests | `complete` / `failed`                            |
| **Lawbringer**   | One step chunk (file pairs); OR, in **whole-diff mode** (bug-hunt), just `questId` and no step refs | Review AND fix: logic / error-handling / security + manual test branch-coverage walk; fixes violations inline, commits, runs ward. Whole-diff mode reviews every changed file in the diff vs the repo default branch instead of a named pair | `complete` / `failed` (→ BLOCK)                  |
| **Blightwarden** | The whole diff + quest context                                                                      | Whole-diff cross-cutting audit (security, dedup, perf, integrity, dead-code via parallel minions); fixes mechanical issues inline, routes semantic findings out                                      | `complete` / `failed-replan` / `failed`          |
| **PestEater**    | The bug report (reads the quest itself: `userRequest`, repro flow, expected observable)             | Bug Hunt's single TDD agent: root-cause → write the failing test FIRST and watch it fail → fix → verify via ward. Front of the bug-hunt chain                                                        | `complete` / `failed`                            |
| **Spiritmender** | Error context: affected files, errors, verification command                                         | Targeted error resolution without weakening tests / `any` / disabling lint; re-runs the verification command after each fix                                                                          | `complete` / `failed`                            |

Chat roles (spec phase), for completeness:

| Role               | Dispatched by                  | Sets quest status                                         |
|--------------------|--------------------------------|-----------------------------------------------------------|
| **ChaosWhisperer** | `/dumpster-create`             | `created` → … → `review_observables` (via `modify-quest`) |
| **Glyphsmith**     | `start-design-chat` (optional) | `approved` → … → `design_approved`                        |

---

## Signals & failure semantics

Agents report via the `signal-back` MCP tool. The live handler is
`quest-handle-signal-back-responder.ts`, and it:

1. Marks the named work item terminal: `complete` for signal `complete`; `failed` for signal `failed`
   **or** `failed-replan`. Stamps `completedAt`.
2. If the item is `pathseeker-walk` **and** the signal is `complete`, fires the post-walk hook to
   generate the downstream chain.
3. On a `failed` / `failed-replan` signal, every agent role blocks the quest (see the failure table
   under "Invariants" → "Failure recovery & blocking"). Lawbringer, siegemaster, and blightwarden fix
   what they find inline during their own run, so a `failed` signal from them is an unfixable-issue
   block.

Terminal-failure routing lives in the two places that set terminal status:

- **`run-ward` broker (`quest-run-ward-broker.ts`)** routes a non-zero ward exit: with retry budget
  remaining it splices a spiritmender batch + a ward-retry (`questSpliceFixerBroker`) and rewires
  downstream onto the retry; with retries exhausted it blocks the quest (`questBlockOnFailureBroker`).
  This is the only RECOVER path and the only place spiritmenders are spawned.
- **`signal-back` handler** routes agent failures: `lawbringer` / `codeweaver` / `siegemaster` /
  `spiritmender` / `blightwarden` / `pathseeker-*` / `pesteater` all block the quest. `failed-replan`
  from Blightwarden is treated as `failed`, then routed by the same table (→ BLOCK).

A blocked quest sets status `blocked` and marks every still-`pending` item `skipped`. A recovered
quest stays `in_progress` and dispatches the spliced fixers on the next `get-next-step`. Quest status
is otherwise derived:

### Quest status derivation (`workItemsToQuestStatusTransformer`)

Evaluated whenever work items change, against the current status:

1. If status is a `seek_*` (pathseeker-running) or pre-execution status → **unchanged** (the loop never
   forces `blocked`/`complete` during spec/planning).
2. If **every** item is terminal **and none** is a failure (`failed`) → **`complete`**.
3. Else if **any** item is active (`in_progress`) → **`in_progress`**.
4. Else if pending items remain and **every** pending item depends on at least one `failed` id →
   **`blocked`**.
5. Else → **unchanged** (e.g. all items terminal but one is `failed` and nothing is pending → the quest
   stays `in_progress`: terminal-but-not-complete, the "stuck" state).

> **Note.** Recovery routing hangs off the two terminal-status setters — the `signal-back` handler and
> the `run-ward` broker. The only recoverable failure is ward with retry budget, which splices a
> spiritmender batch + a retry via `questSpliceFixerBroker`; every agent failure BLOCKS the quest
> (`questBlockOnFailureBroker`) — the orchestrator does not auto-replan, and the self-correcting roles
> (lawbringer / siegemaster / blightwarden) fix what they find inline rather than spawning a fixer.

---

## Invariants (testable, verified against code)

These hold under the current model and are the right things to assert in integration tests.

### Dispatch

- **D-1 — FIFO single active quest.** `get-next-step` picks the oldest `in_progress` quest with
  incomplete work and dispatches only from it per scan.
- **D-2 — Ward dispatches alone.** A ready ward item always returns `run-ward`, never bundled with
  agents.
- **D-3 — Surface batch.** All ready `pathseeker-surface` items dispatch together; `pathseeker-dedup` +
  `pathseeker-assertion-correctness` dispatch together; all other roles dispatch one at a time.
- **D-4 — Idle long-poll.** No ready item anywhere → the broker long-polls ~25s, then returns `idle`.

### Dependency & ordering

- **DEP-1 — Ready = all deps satisfying.** An item is ready only when every `dependsOn` id is
  `complete` or `failed`.
- **DEP-2 — `failed` unblocks, `skipped` blocks.** A `failed` dep satisfies dependents; a `skipped` dep
  never does, so its dependents can never become ready.
- **DEP-3 — Standard chain.** A successful PathSeeker walk produces
  `codeweaver → ward(changed) → siegemaster[per flow, chained] → lawbringer → blightwarden → ward(full)`,
  wired exactly as the `stepsToWorkItemsTransformer` table above.
- **DEP-4 — Siege serialization.** Each siege item (after the first) depends on the previous siege id,
  so at most one Siegemaster runs concurrently.

### Status

- **STATUS-1 — All non-failure-terminal → `complete`.**
- **STATUS-2 — Pending items all depending on failed ids → `blocked`.**
- **STATUS-3 — Terminal-but-failed with nothing pending → stays `in_progress`** (not `blocked`).
- **STATUS-4 — Pre-execution / pathseeker-running statuses are never forced** to `blocked`/`in_progress`
  by the derivation.

### Failure recovery & blocking

Terminal-failure routing is driven by the failing item's `role`. Recoverable failures splice fixer
items + a retry into `quest.workItems[]`; all other failures block the quest. The per-role table:

| Failing item                                | Behavior                                                                   |
|---------------------------------------------|----------------------------------------------------------------------------|
| `ward` (retry budget remains)               | **RECOVER** — splice spiritmender(s) + ward-retry, rewire downstream       |
| `ward` (retries exhausted)                  | **BLOCK**                                                                  |
| `lawbringer`                                | **BLOCK** (fixes findings inline; `failed` = unfixable)                    |
| `codeweaver`                                | **BLOCK**                                                                  |
| `siegemaster`                               | **BLOCK**                                                                  |
| `spiritmender`                              | **BLOCK**                                                                  |
| `blightwarden` (`failed` / `failed-replan`) | **BLOCK**                                                                  |
| `pathseeker-*`                              | **BLOCK**                                                                  |
| `pesteater`                                 | **BLOCK**                                                                  |

- **REC-1 — Ward failure splices spiritmenders + retry.** A `ward` item that fails with retry budget
  remaining (`attempt < maxAttempts - 1`) splices one or more `spiritmender` items plus a `ward`-retry
  item (same `wardMode`, `attempt + 1`) into `quest.workItems[]`. The quest stays `in_progress`.
- **REC-2 — The spliced retry rewires downstream dependents.** The fixer splice rewires every
  downstream dependent off the failed item onto the retry item via
  `replacementMapping: [{ oldId: failedWorkItemId, newId: retryItem.id }]`, so siege/downstream items
  depend on the retry rather than the original failure.
- **BLK-1 — Pathseeker-routed failures block + skip pending.** A failure that routes to block
  (`codeweaver` / `siegemaster` / `spiritmender` / `blightwarden` / `pathseeker-*` / `pesteater`, and
  `ward` when retries are exhausted) sets quest status `blocked` and marks every still-`pending` item
  `skipped`, so nothing dispatches on the broken state.
- **BLK-2 — A `blocked` quest is not dispatched.** `loadActiveQuestsLayerBroker` filters on
  `isActivelyExecutingQuestStatusGuard` (`== in_progress`), so a `blocked` quest is not scanned by
  `get-next-step` and dispatch halts.

### Contract integrity

- **C-1 — `dependsOn` references resolve** to existing work items in the same quest.
- **C-2 — The graph is a DAG** (no cycles).
- **C-3 — `relatedDataItems` reference valid collections** (`steps`, `flows`, `wardResults`) and
  existing ids.
- **C-4 — Chat roles set status only within their phase** (ChaosWhisperer: `created` →
  `review_observables`; Glyphsmith: `approved` → `design_approved`).

---

## Full happy path (E2E reference)

```
[USER] /dumpster-create → ChaosWhisperer builds spec
   created → … → review_observables
[USER] APPROVE observables → approved
[USER] Start Quest button → in_progress, pathseeker-surface ×N seeded
[USER] /dumpster-launch (dispatch loop)
   ▼ pathseeker-surface ×N  (parallel)        → complete
   ▼ pathseeker-dedup + pathseeker-assertion-correctness (parallel) → complete
   ▼ pathseeker-walk (single)                 → complete → post-walk hook fires
        downstream chain inserted
   ▼ codeweaver(s)                            → complete
   ▼ ward (changed)        [run-ward MCP tool] → complete
   ▼ siegemaster (per flow, chained)          → complete
   ▼ lawbringer(s)                            → complete
   ▼ blightwarden                             → complete
   ▼ ward (full)           [run-ward MCP tool] → complete
   All items non-failure-terminal → quest complete ✓
/dumpster-launch's next get-next-step() picks up the next FIFO quest.
```
