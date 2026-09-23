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

A quest carries a small **`operations` ledger** (`quest.operations: OperationItem[]`) — one item per
**SCOPE**, which is one family's slice of the quest ("codeweaver, package web, flow send"). TWO GRAPHS
drive it. The **family graph** (`questFlowStatics`) says which family runs after which —
`riftcarver → codeweaver → flowrider → siegemaster → wardFull → @complete` — and the **step graph**
inside each family (`agentFlowStatics`) says what happens inside one scope: `plan → work → review →
commit → ward`, with `unmet` marks looping back to the step that can settle them. Start seeds ONLY the
ENTRY family's scopes; every later family's are minted the moment the family graph routes to it, so a
fan-out reads the flows as they stand THEN rather than as they stood at approval.
`questAdvanceBroker` **enters** a scope: it finds the first `pending` operation item and creates one
work item at its family's entry step. `questRouteScopeBroker` **moves** one: once every work item on a
scope has gone terminal it asks `nextActionTransformer` what that scope does next and persists the
answer — the next step's batch of work items, the scope completing (and, on the family's last scope,
the next family's scopes being minted), or a HALT. **A work item is one dispatched session, and MANY of
them belong to one scope**; `step` is what separates them. The failure concepts are a deterministic
step's classified `wall`, a gate routing `unmet` to a `repair` step, and a spent `maxVisits`. The
**sole** path to `blocked` (needs-human) is `quest-block-on-failure-broker`, reached when the router
routes an outcome to `@blocked`, when a bounded loop is spent, or when orphan recovery gives up.

---

## Core concepts

- **Operations ledger (`quest.operations`)** — an `OperationItem[]`, one entry per SCOPE. The durable
  plan and status record. NOT committed to git. It has exactly **ONE writer: the orchestrator.**
  `operations` is off the modify-quest allowlist entirely — ChaosWhisperer never authors it, at any
  status, and no execution agent ever writes it either. **The ledger is minted LAZILY:**
  `questBuildRelayGraphBroker` seeds the entry family's scopes at Start, and every later family's are
  minted by `mintNextFamilyLayerBroker` when the family graph routes to that family. Both go through
  `familyScopesMintTransformer`, which owns the fan-out, the `locked` flag and the spine-package
  fallback. Runtime mutation is `questOperationsUpdateBroker`'s alone. **Execution agents never write
  it** — they read git + the ledger for context and record an outcome through `quest-work`.
- **Scope, step, work item, piece, unit** — the five words the graphs are written in. A **scope** is
  one family's slice of one quest and IS an operation item. A **step** is one stage inside a family
  and is a key into `agentFlowStatics[family].steps`. A **work item** is one dispatched session and
  carries the `step` it is running. A **piece** is one line in a planner's forecast file — what a
  planner INTENDS, never a session that ran. A **unit** is the atom of verification: an observable, a
  terminal node, a labelled edge, or an off-map probe family.
- **OperationItem** — `{ id, role, text, status, locked, flowIds, packageNames }`
  (`operation-item-contract.ts`). `status` is `pending | in_progress | complete`: a scope is `pending`
  until something enters it, `in_progress` while its step graph runs, and `complete` when the router
  routes one of its steps to `@done`. `text` is a prose description, and it is what a budget is keyed
  on — which is why a per-flow scope carries its flow id and a per-cell one carries both its package
  and its flow. `locked` enrols a scope in its family's `slotManagerStatics` budget; the `codeweaver`
  family is minted UNLOCKED on purpose, because the flows are the acceptance target and the work has to
  land. No agent can delete ANY operation item, locked or not — `operations` is off the modify-quest
  allowlist entirely. `wardFull` is the ONLY family whose `role` is `'ward'`, so nothing on the item
  itself needs to disambiguate it from another kind of ward scope — every code-changing family's own
  internal `ward` STEP runs inside a scope whose `role` is that family's own name instead.
- **Work item (`quest.workItems[]`)** — one agent *session* (`sessionId` / `agentId` / transcript), or
  one deterministic step's run. **Every work item links to exactly one operation item via
  `relatedDataItems: ['operations/<id>']`, and that link is never re-pointed and no work item's status
  is ever reverted. ONE operation item carries MANY work items** — one per step the router mints on
  that scope, and one per piece inside a parallel step — so the ref is many-to-one and `step` is what
  separates them. A work item that runs a deterministic step additionally carries that run's result ref
  — `wardResults/<id>`, `riftcarverResults/<id>` — which is the only route the execution panel has to
  its persisted log.
- **Relay** — the progression of a quest through the two graphs: `questAdvanceBroker` entering a scope,
  `questRouteScopeBroker` moving it step by step, and the family graph routing from one family to the
  next once every scope of the current one is complete.
- **Router (`nextActionTransformer`)** — the PURE decision at the centre of it. Given a quest, one
  scope and that scope's plan file it answers four questions in one order: did this step REQUEST
  another step; does this step have `unmet` units; are there unstarted plan batches at the current
  step; and otherwise, what does the step's own route for its folded outcome say. It takes no lock, does
  no I/O and performs nothing — `questRouteScopeBroker` reads the plan before the lock and persists
  what it answers.
- **The four outcome words** — `done` (every assigned unit `met` or `cant-meet`), `unmet` (at least one
  still `unmet`), `empty` (nothing was in scope to act on — never "there was work and I cut none"), and
  `wall` (an environment wall no fresh session could pass). Ordered worst first: `wall` > `unmet` >
  `done` > `empty`, which is how a parallel batch folds to one outcome per step.
- **The three marks** — what a session writes on a unit through `quest-work`: `met` (proved, with
  evidence), `cant-meet` (unsettleable at this layer, carrying `toSettle`) and `unmet` (not done). A
  `met` or `cant-meet` is settled; an `unmet` is what mints a fresh session scoped to exactly those
  units.
- **`unmet` re-cut** — the router's answer to a step that left units unsettled. The step's own
  `routes.unmet` names where they go — `review → work`, `ward → repair`, `happyWalk → fixHappy` — and
  the router mints ONE work item per originating piece carrying exactly those units, plus one per unit
  no piece ever claimed. The mint carries `mintedBy`, which is the RETURN EDGE: a step that declares no
  `done` route returns to whoever minted it, as a FRESH work item at that minter's step.
- **Environment wall** — the `wall` outcome. A deterministic step's handler classifies it; a session
  declares it through `quest-work`'s `outcome` payload. Every step in every family routes `wall` to
  `@blocked`, so the router answers `{ kind: 'block', reason: 'wall' }` and the quest halts for the
  user instead of advancing (see § (d)).
- **Fixpoint** — a gate step and its repair, inside one family. `ward`'s `unmet` routes to `repair`,
  and `repair` declares no `done` route at all, so it RETURNS to the ward that minted it; a run that
  comes back `done` takes the ward's own `done` edge onward. Convergence IS the verdict. `maxVisits` on
  each step is the bound: it is a ceiling on a count nothing stores — the work items on this scope whose
  `step` equals that step — so no visit counter exists on the work item and none is to be added.
- **Step session** — the unit of work inside ONE step's work item. There is no layer above a step and no sub-agent
  briefed from inside one: `agentFlowStatics[family].steps[step].prompt` names the exact served prompt
  (`codeweaver-planner`, `codeweaver-worker`, `codeweaver-reviewer`, `flowrider-planner`, `flowrider-worker`,
  `flowrider-reviewer`, `siege-planner`, `siege-happy-walker`, `siege-happy-fixer`, `siege-adversarial-walker`,
  `siege-adversarial-fixer`, `siegemaster-reader`, `recipe-maker`, …), and `get-agent-prompt` resolves it directly —
  there is no role-level prompt for `codeweaver`/`flowrider`/`siegemaster` themselves, and dispatching one of those
  three names throws. A `work` step's own session is the session that edits files; a `review`/`happyWalk`/
  `adversarial` step's own session is the session that grades or attacks the pass — both are ordinary
  router-dispatched work items, not something a bigger session summons. A planner step's own prompt allows a
  bounded `Agent()` call for a SEARCH and nothing else; a worker, reviewer or walker step dispatches no sub-agent at
  all — its own served prompt says so directly.
- **The one remaining named sub-agent** — `chaoswhisperer-gap-minion` (`agentPromptClassificationStatics.minionNames`)
  is the sole survivor of a wider parent-summoned-minion layer. It runs in the SPEC phase, before any operation item
  exists, fetching with `{ agent, questId }` and no `workItemId` — it owns no work item and never calls
  `signal-back`. Every other former minion is now either an ordinary step (`codeweaver-reviewer` and
  `flowrider-reviewer` are `agentPromptClassificationStatics.promptNames` entries, dispatched by the router like any
  other step) or gone outright: `siegemaster-reviewer`, `siegemaster-verifier` and `siegemaster-stress` are absent
  from every roster — siegemaster's `happyWalk` and `adversarial` steps ARE its reviewer-role steps, run directly.
- **Standards review** is NOT a role, NOT a ledger item, and writes NOTHING to `quest.json`. The five concerns
  (`craft`, `perf`, `dedup`, `integrity`, `test-cases`, from `standardsReviewConcernsStatics`) are GUIDANCE — "nothing
  counts what a reviewer answers here and no gate refuses a signal over a concern nobody took" (the statics file's own
  words). They are taken by codeweaver's and flowrider's own `review` step, in the same reading pass as that step's
  role-specific judgment, over the files the pass produced; siegemaster's `happyWalk`/`adversarial` steps take no
  such pass.
- **Sign-off** — there is no separate sign-off record. `workItem.observations[]` — one entry per
  `{ unitId, mark, evidence, toSettle?, at }` (see "The three marks" above), written through `quest-work`'s
  `observations` payload — IS the record of what was measured, by which session, and how. A unit's current state is
  its most recent observation across the work items that have touched it; there is no `confirmed`/`unconfirmable`
  verdict and no per-track field on the flow/node/edge/observable contracts themselves.
- **Quest note** (`quest.planningNotes.questNotes[]`) — `{ id, kind, role, workItemId, flowId?, unitId?, summary,
  detail, at }` with `kind` one of `open-question | tooling-error | out-of-scope | walk-reset | walked |
  human-verdict`. A durable side channel
  beside the marks. **A note NEVER closes a unit.**
- **Git is the record of what was built.** The ledger is the plan/status; commit messages are the
  cross-session handoff. A stale ledger self-heals because the next agent verifies against git first.

---

## Quest types and the family graph

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). **`questFlowStatics`
(`@dungeonmaster/shared/statics`) is the family graph** — which family the relay ENTERS at, and which
family every OUTCOME of a family routes to. That same statics holds the per-type intake (the slash
command and `initialWorkItemRole`) and the `role`, `text` and `fanOutBy` each family's scopes are cut
from.

**THE TWO TYPES SHARE ONE GRAPH**, and `questFlowStatics`' own colocated test asserts it. A bug-hunt's
intake writes flows and observables exactly as a feature's does, so the same families verify them; what
differs is the intake — `feature` seeds a `chaoswhisperer` chat item and runs `/dumpster-create`,
`bug-hunt` seeds a `bughunt` chat item and runs `/dumpster-hunt` — and nothing after it.

| Family | `fanOutBy` | `locked` | `done` routes to | `empty` routes to |
|---|---|---|---|---|
| `riftcarver` (the `entry`) | — one scope | yes | `codeweaver` | — |
| `codeweaver` | `implementation` — one per (PACKAGE, FLOW) cell | **no** | `flowrider` | `flowrider` |
| `flowrider` | `flow` — one per RUNTIME flow | yes | `siegemaster` | `siegemaster` |
| `siegemaster` | `flow` — one per flow | yes | `wardFull` | `wardFull` |
| `wardFull` | — one scope | yes | `@complete` | — |
| `warpgate` | — appended at MERGE, routed to by nothing | yes | `@complete` | — |

Every family routes `wall` to `@blocked`. The graph is acyclic and needs no family-level `maxVisits`: a
scope only ever ends `@done` or `@blocked`, so no family produces an outcome a back-edge would fire on.

**A family's forward edge fires ONCE, on its LAST scope.** Nine codeweaver cells route to flowrider on
the ninth, not nine times — `questRouteScopeBroker` completes a scope and only then asks whether every
scope sharing that family's ledger key is complete. `empty` is the same edge for a family that fanned
out to NOTHING: flowrider covers runtime flows alone, so a quest with none routes straight past it
rather than stalling, and `mintNextFamilyLayerBroker` walks the `empty` edge until a family mints
something or the walk reaches `@complete`.

**SCOPES ARE MINTED LAZILY, and that is the point.** Only the entry family's scopes exist at Start. A
family's scopes are cut the moment the relay routes to it, so the fan-out reads the flows AS THEY STAND
then — which is what gives an observable an operator adds mid-quest a flowrider session at all, where a
scope cut at approval could never have covered it.

So the full relay, for a feature OR a bug-hunt quest alike, is:

```
chaoswhisperer (feature) / bughunt (bug-hunt) — the intake chat item
  → riftcarver   (ONE scope: branch + worktree + node_modules mirror + preflight typecheck)
  → codeweaver ×N   (minted when riftcarver's `done` routes here — one per (PACKAGE, FLOW) CELL)
  → flowrider ×N    (minted when codeweaver's LAST cell completes — one per RUNTIME flow)
  → siegemaster ×N  (minted when flowrider's LAST scope completes — one per flow)
  → wardFull        (ONE scope: a bare ward over the whole monorepo)
  → @complete
```

**`codeweaver` fans out ONE SCOPE PER (PACKAGE, FLOW) CELL** (`relayTailFanOutTransformer`,
`fanOutBy: 'implementation'`): a cell exists wherever a package tags at least one node on that flow,
across both flow types, and its text names both — `— package: <name> · flow: <id>`. A package that tags
nodes gets cells and nothing else; its contracts reach it at runtime through the `packageName`-only
`get-quest` call, which routes them by PATH. The ONE flow-less scope left belongs to a package that owns
a contract (by `source`, or by an individual PROPERTY's `source`) and tags no node anywhere — without it
those contracts have no owner. Membership is "this package TAGS a node in this flow", so a glue node
mints a cell on each side. Cells are ordered by package KIND tier first
(`packageBuildOrderStatics.tiers`), then `packageGraph` depth as a tiebreak within a tier, then name,
with one package's own cells in the quest's flow declaration order — tier outranks depth because
manifest depth is Kahn's order over `package.json` edges, which is INVERTED across an HTTP seam (this
repo's `server` depends on `web` to serve its bundle, so raw depth would rank the browser package ahead
of the backend route it calls). The codeweaver family is minted UNLOCKED, so its pt budget is unbounded:
the flows are the acceptance target and the work has to land.

**A SEAM'S UNITS BELONG TO EXACTLY ONE CELL — THE LATER ONE.** A node carrying more than one package is
a seam (`flowNodeContract`'s own `.describe()` says so), and CELL MEMBERSHIP IS UNCHANGED: both sides
still get a cell, because a seam node may be the other side's ONLY node on that flow and awarding the
node itself would mint no cell for it at all. What moves is the ASSIGNMENT.
`qaUnitsInPackageScopeTransformer` gives a seam's units to the cell whose package sorts LAST by the same
three keys the fan-out orders cells by, so the later cell — the one that can see both halves — is the
one answerable for them, and the earlier one never has to mark a unit against a half that does not exist
yet. The earlier cell reaches the far half through its piece's `contextUnitIds`, which are context and
never claims.

**`flowrider` and `siegemaster` each fan out to ONE SCOPE PER FLOW THEIR OWN STEPS MEASURE**
(`fanOutBy: 'flow'`), each carrying a single `flowId` and a text suffixed `— flow: <id>`. The cut reads
`stepScopeStatics.byFamilyStep[family][step].flowTypes`, the one place every denominator reader shares,
so the ledger cannot mint a scope measured at zero: both siegemaster's steps and flowrider's `review`
step take `runtime` alone. With no eligible flow at all, the family keeps ONE whole-quest scope only when
`off-map` is in its `unitKinds` — the probe families are properties of the BUILT SYSTEM rather than of
any drawn flow, so siegemaster keeps this quest's only security (`hostile-input`) and performance
(`perf`) coverage owned, while flowrider gets nothing rather than a session dispatched against an empty
denominator.

**OPERATIONAL FLOWS ARE CODEWEAVER'S.** An operational flow is a one-time task sequence — a refactor
sweep, an infrastructure setup, a lint-rule registration — and its units are settled inside the
codeweaver family: the session that made the change is the one that reads the tree back, and its
reviewer confirms the end state by opening files. Flowrider is measured over `runtime` flows alone,
because there is nothing repeatable for a suite to walk and a test asserting a file is ABSENT goes green
the day it is written and is blind afterwards. **The filtering is the ORCHESTRATOR's, never the
session's** — a prompt that says "skip operational units" is a rule an agent can misread; a scope that
never contains one cannot be.

`bug-hunt`'s spec shape is **ONE FLOW PER BUG** — the reproduction path forks at its last shared node
into two terminal nodes labelled `ACTUAL: <symptom today>` and `EXPECTED: <what the fix must make real>`,
with observables sitting on the EXPECTED side only (an observable is a positive expectation, so one on
the broken branch would ask for a test that asserts the bug). Each EXPECTED observable becomes one
failing test, written by the **codeweaver** scope that owns the package the fix lands in.

---

## Dispatchers: two drivers, one relay

The same relay is driven by two interchangeable dispatchers; both share `questAdvanceBroker`,
`signal-back`, and the dispatch scan, so the relay logic is identical for both. **Node/UI mode is the
primary driver.**

| Surface                          | Dispatcher                     | What it does                                                                                                                                        |
|----------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| Web UI `/queue` page play button | **Node/UI mode (primary)**     | The server-side Node dispatch runner loops `get-next-step` in-process, spawns headless `claude -p` children (one per SpawnInstruction), and runs a `run-step` through `questRunStepBroker` → `stepHandlerRunBroker`. |
| `/dumpster-launch` slash command | **MCP mode**                   | A brainless loop in the user's own Claude session: `get-next-step()` → `Task()` for agents / `run-ward` or `run-riftcarver` MCP tool for a command work item → await → repeat. It has **no tool for a `run-step`** yet, so a deterministic step returned by the scan is Node/UI mode's alone to run. |
| Web UI "Start Quest" button      | —                              | Calls `OrchestrationStartResponder`: seeds the relay and flips status `approved → in_progress`. **Spawns nothing and touches no git** — pure `quest.json` bookkeeping, so the POST answers in milliseconds and the active dispatcher picks the quest up. |

The two modes are mutually exclusive via `<dungeonmasterHome>/dispatch-state.json`. `get-next-step`
long-polls internally (~25s) before returning `{ type: 'idle' }` when nothing is ready.

---

## Quest status lifecycle

```
created (or pending) → explore_flows → review_flows → [Gate#1 user approves] → flows_approved
        → explore_observables → review_observables → [Gate#2 user approves] → approved
        → in_progress → complete → merging → merged   (user presses Merge; see below)
                        ├→ blocked → in_progress      (needs-human; user resumes)
                        └→ abandoned
   (paused is reachable from any pre-terminal status and returns to it)
```

There are no `seek_*` statuses. **`approved → in_progress` is
direct** — the only manual transition in the execution phase. Everything after `in_progress` is
driven by the operations relay. `pending` is a second entry status with the identical transition set as `created`
(`questStatusTransitionsStatics`); nothing in this doc's relay treats it differently from `created`.

| Status                                          | Set by                                    | Notes                                                                       |
|-------------------------------------------------|--------------------------------------------|-----------------------------------------------------------------------------|
| `created`, `pending`                            | `create-quest`                            | Intake agent's first action; seeds the plan operation item (see below)      |
| `explore_flows` … `review_observables`          | ChaosWhisperer (via `modify-quest`)       | The only roles that set status directly                                     |
| `flows_approved`, `approved` | **User** (APPROVE button)                 | The approval gates; each requires non-empty `flows` — nothing else         |
| `in_progress`                                   | `start-quest` / Start Quest button        | Spec locked; the relay is seeded and dispatch begins. Start is pure `quest.json` bookkeeping — it spawns nothing and touches no git, so the panel swap is immediate; the branch, worktree, `node_modules` mirror and preflight typecheck belong to the `riftcarver` item it seeds at the head of the ledger |
| `complete`, `blocked`                           | Derived / set by the orchestrator         | `complete` derived by `workItemsToQuestStatusTransformer` **off the FAMILY GRAPH's position**, never off a drained ledger; `blocked` set only by `quest-block-on-failure-broker` |
| `merging`, `merged`                             | User (the merge action), then the orchestrator | `orchestration-merge-responder` — the server-side half of the merge action — flips a `complete` quest to `merging` and appends the `warpgate` family's own scope (its one step, `merge`; the family is routed to by nothing else); `merged` follows once that scope completes |
| `paused`, `abandoned`                           | User                                      | Not derived over — owned by the user                                        |

**The approval gate** (`quest-gate-content-requirements-statics`) requires only non-empty `flows` for
`flows_approved` and `approved` alike — for EVERY quest type. It demands no ledger item at all:
the implementation ledger is DERIVED at Start (`fanOutBy: 'implementation'`), not authored at spec time by anyone, so
coverage is definitional rather than checked — a quest that clears `flows_approved` already carries every input the
generator reads. The gate is enforced in `quest-modify-broker` (the `approved` transition) and the web approve
button.

---

## The operations ledger, from create to complete

Trace one feature quest end to end.

1. **Quest create** (`quest-create-broker`). For a type with an intake agent (feature's
   `chaoswhisperer`, bug-hunt's `bughunt`), create seeds ONE **plan** operation item
   `{ role: <intake role>, text: "Author spec + implementation plan", status: in_progress, locked }`
   and stitches its `operations/<id>` ref into the caller-supplied intake work item. **Every work
   item, from the first, carries exactly one `operations/<id>` link.**

2. **The intake role** builds flows / observables / contracts / `packagesAffected[]` — it writes NONE of
   the operations ledger. `operations` is off the modify-quest allowlist entirely, at every status, so
   there is no implementation scope on the ledger yet at all. The approval gate does not need one: it
   only requires non-empty `flows`.

3. **User approves** → **Start Quest** (`OrchestrationStartResponder`):
   - Start is **pure `quest.json` bookkeeping**: the startable gate, the package dependency graph
     (one `package.json` read per declared package plus Kahn's order — milliseconds), the relay seed,
     then the status flip and the queue entry. It spawns no child and runs no git, which is what
     keeps the POST at millisecond scale and lets the WebSocket-driven panel swap land instantly.
   - `questBuildRelayGraphBroker` force-completes any non-complete intake (`chaoswhisperer` /
     `bughunt`) operation item, mints the **ENTRY family's scopes and nothing else**
     (`familyScopesMintTransformer({ quest, family: questFlowStatics[questType].entry })` — one
     `riftcarver` scope), and creates ONE work item for the first actionable (`pending`) one, carrying
     `step: 'carve'` — its family graph's own `entry` — and `spawnerType: 'command'` off
     `isCommandWorkItemRoleGuard`, linked `operations/<id>`, depending on the completed chat work items.
   - It stamps **no `baseRef`**. Start runs before any worktree exists, so the only HEAD it could read
     is the server process's own checkout; `riftcarver` is the sole writer of that field and reads it
     from the worktree's own HEAD once the worktree is real.
   - **The codeweaver scopes are NOT born here.** They are minted when riftcarver's `done` routes the
     relay to the codeweaver family, and every later family's the same way.
   - The seed is persisted via `questOperationsUpdateBroker` **before** the status flips to
     `in_progress`. Both the seed and the transition are idempotent: the re-Start check asks whether the
     ENTRY family already has scopes on the ledger — matched through `familyLedgerKeyTransformer`,
     because two of the six family keys are not role names — and skips straight to the transition. A
     check keyed on a family the relay only reaches later would answer `false` forever and re-seed on every
     Start.

4. **The dispatch loop** picks up the riftcarver work item. Its step (`carve`) is `kind:
   'deterministic'` with `handler: 'riftcarver'`, so the scan returns a `run-step` and
   `questRunStepBroker` runs it through `stepHandlerRunBroker`: detect the base branch, `git worktree
   add`, pin `baseRef`, mirror `node_modules`, then the preflight typecheck. Every line streams live to
   the execution row and is persisted to `<questFolder>/riftcarver-results/<id>.log`. The handler
   CLASSIFIES and records — `done`, `unmet` or `wall` onto the work item's `declaredWord` — and routes
   nothing. The next scan's router reads that word and takes `carve`'s own edge for it: `done` →
   `@done`, `unmet` → `repair`, `wall` → `@blocked`.

5. **The scope completing is what mints the next family.** `questRouteScopeBroker` marks the riftcarver
   scope `complete`, sees that the riftcarver family has drained, reads `routes.done` → `codeweaver`,
   and appends that family's cells — one per (package, flow) — in one persist.

6. **The dispatch loop** picks up the first codeweaver work item, which advance minted at that family's
   entry step (`plan`). From there the STEP graph drives: `plan`'s `done` routes to `work`, `work`'s to
   `review`, `review`'s `unmet` loops back to `work`, its `done` routes to `commit`, and `commit`'s to
   `ward`. Each session records its marks and its outcome through `quest-work`; the router folds them.

7. **`ward`'s `done` routes to `@done`** and the scope completes. Once the LAST codeweaver cell
   completes, the family edge fires once and the flowrider family's scopes are minted.

8. **Flowrider, then siegemaster, then `wardFull`** the same way. When `wardFull`'s `gate` step reaches
   `@done`, `familyGraphCompleteDetectTransformer` sees a family routing to `@complete` holding scopes
   that are all complete, and the status transformer derives `complete`.

---

## The relay engine

### `questAdvanceBroker` — ENTERS a scope

Called from TWO places, both idempotent: (i) `QuestHandleSignalBackResponder` after marking a work item
terminal, and (ii) the dispatch scan as a **self-heal** (`scan-once-layer-broker`), so a server that
stopped between a scope completing and the advance still progresses on restart. In one
`questOperationsUpdateBroker` write:

1. Find the FIRST operation item with `status === 'pending'`. None → create nothing.
2. **Resume guard:** if that pending item already has ANY linked work item, do NOTHING — somebody has
   already entered this scope (its session is live, or orphan recovery will resume it). The guard stays
   correct under many-work-items-per-scope because of WHERE the rest are minted: the router only mints
   inside an operation item that is already `in_progress`.
3. Else create ONE work item for the operation's `role`, **at that family's ENTRY step** —
   `agentFlowStatics[family].entry`, with the family resolved through `workItemFamilyResolveTransformer`
   (which reads `questFlowStatics[…].families` by role) rather than read off `operationItem.role`
   directly, because `wardFull` carries `role: 'ward'` and a role read back as a family key enters the
   wrong graph. A role no family carries (`spiritmender`, a chat role) resolves to `undefined` and is
   stamped with no step at all — that is the honest record that nothing routes it. `spawnerType` is
   `'command'` when `isCommandWorkItemRoleGuard` matches — `workItemRoleStatics.command` is `['ward',
   'riftcarver']` — else `agent`. The item is linked `operations/<id>`, depends on the most-recent
   dependency-satisfying work item, and the operation is marked `in_progress`.

### `questRouteScopeBroker` — MOVES a scope

Runs from the dispatch scan, AFTER orphan recovery and BEFORE the advance self-heal. It routes at most
ONE scope per call: the first `in_progress` operation item whose role resolves to a family and whose
work items have ALL gone terminal. A scope with a live work item has not finished its step.

The plan file is read ABOVE the lock, because `questWithModifyLockBroker` is per-quest and deliberately
non-reentrant, `questOperationsUpdateBroker` takes it, and its `update` callback is synchronous. Inside
that callback the pure router answers, and the answer is applied in the same persist:

| `NextAction` | What is written |
|---|---|
| `mint` / `route` with a batch | one work item per minted entry, at that step, carrying its `assignedUnitIds`, `pieceId`, `payload` and `mintedBy`, chained after the last dependency-satisfying work item OF THIS SCOPE |
| `mint` with `cause: 'capped'` | nothing — the honest "come back": a step still running, or a concurrency cap |
| `complete` | the scope marked `complete`; then, if that was the family's LAST scope, the next family's scopes appended via `mintNextFamilyLayerBroker` |
| `block` | nothing is persisted — the halt is performed AFTER the persist returns, because `questBlockOnFailureBroker` goes through `questModifyBroker`, which takes the same lock |

**A role no family carries is left alone** — `spiritmender`, a chat role, and the COMMITTED ward gate.
None of them runs a step graph, so each completes on its own signal and this broker never touches it.

### Dispatch selection

`compute-next-step-from-quest-layer-broker` + `select-batch-layer-broker` decide what the scan hands
back. **The STEP decides before the ROLE:**

1. The head ready item's step node is resolved (`workItemStepNodeTransformer`). A `kind:
   'deterministic'` step returns `{ type: 'run-step', handler, args }` ALONE — it runs a handler, never
   a session, and it owns the whole tree for the length of its run (`commit` takes git's index lock,
   `ward` grades the tree, `cleanup` kills every siegelense instance). Its work item carries the ROLE of
   the SCOPE it belongs to — a `commit` step inside a codeweaver scope reads `role: 'codeweaver'` — so
   keying on the role alone would spawn a Claude session for it.
2. A work item that runs NO step graph (a hydrated quest's ward, a pre-graph ledger's carve) falls
   through to the role-keyed command split: `run-riftcarver` for a carve, `run-ward` for a gate. That
   split is what keeps a riftcarver item out of `build-spawn-instruction-layer-broker`, which parses
   `agentRoleContract` and throws for any role Claude cannot be dispatched as.
3. Otherwise the batch is every ready item sharing the head's ROLE **and** its STEP, which is a router
   batch read back off the ledger — one step of one family, which is what a router mint is by
   construction. `ready` spans every scope the relay has open, and two codeweaver cells legitimately sit
   at different steps at once, so handing the selector everything is what made its mixed-step throw
   reachable from ordinary traffic.

**`args` ride the STEP, not the work item.** `agentFlowStatics` is where a family's `ward` declares
`['--committed', '--uncommitted']` and `wardFull`'s `gate` declares `[]`, and they are passed VERBATIM —
that is what keeps one ward invocation out of every call site's ternary.

**The missing-worktree halt exempts the carve, and only the carve.** `scan-once-layer-broker` blocks a
quest whose recorded `worktreePath` does not resolve, because dispatching any other role would run it
against the repo-root checkout. The carve OWNS creating that path — its own done-check reads a
recorded-but-missing directory as "not done" and re-creates it — so halting ahead of it would leave the
quest permanently blocked by the one step that could have repaired it. The exemption keys on the
HANDLER (`run-step` carrying `handler: 'riftcarver'`) as well as on the legacy `run-riftcarver` step
type, because matching only one of the two would block on the other.

### Status derivation (`workItemsToQuestStatusTransformer`)

Runs inside `questOperationsUpdateBroker` on every ledger write. Given
`{ workItems, operations, currentStatus, questType }`:

1. Pre-execution / user-paused / abandoned / **blocked** / `merged` statuses are returned unchanged
   (nothing re-opens `blocked` except the user's resume transition).
2. **`complete` means THE FAMILY GRAPH REACHED `@complete`, never that the ledger drained.** Under a
   graph that can cycle a drained ledger is an ordinary mid-run state — `work ⇄ review` is legitimately
   empty between two passes — so `familyGraphCompleteDetectTransformer` owns the question. It asks from
   the TERMINAL end: does a family that ROUTES to `@complete` hold scopes, and are all of them complete?
   Walking forward instead cannot tell "flowrider was skipped as `empty`" from "flowrider has not been
   routed to yet", because a family that fanned out to zero scopes leaves no trace on the ledger.
3. Every work item terminal AND the graph complete → **`complete`** (`merged` from `merging`).
4. Every work item terminal, an unrecovered sink failure exists, and no operation is pending →
   **`blocked`**. That roll-up reads `insertedBy`, NOT `mintedBy`: `insertedBy` means "a retry was
   spliced for this failed item", where `mintedBy` is the router's RETURN EDGE — reading it here would
   make a mark-minted worker read as superseding the reviewer that minted it, and a quest with a healthy
   `work ⇄ review` loop would derive `complete`.
5. Any work item active → **`in_progress`**.
6. Only pending work items remain, all dead-ended on a `failed` dep, ledger drained → **`blocked`**;
   otherwise **`in_progress`**.

---

## Per-role paths (happy + sad)

**A SESSION REPORTS; IT NEVER ROUTES.** `signal-back` carries the sole signal kind `complete` — a
session-terminal marker and nothing more. What that session DID is already on the record before it
signals: its marks on each assigned unit, and optionally an `outcome` word, a `request` for another
step, or an `invalidation`, all written through the `quest-work` tool. The router reads that record and
takes the step's own route for it. A deterministic step reports the same way — its handler classifies
the run into one of the four words and `questRunStepBroker` writes that onto the work item — so a
handler and a session are indistinguishable to the router, which is the point.

`wall` is available at EVERY step of every family and behaves identically everywhere, so it is
documented once in § (d): every step routes it to `@blocked` and the quest halts immediately.

**One gate can REFUSE a signal outright: the unmarked-unit gate.** `signalGateTransformer` compares the
signalling work item's `assignedUnitIds` against its `observations[].unitId` and refuses the call while
any assigned unit carries no observation. A mark's VALUE is irrelevant — `met`, `cant-meet` and `unmet`
all count as marked, only the ABSENCE of an entry counts. It runs once idempotency has ruled out a
redelivery and BEFORE anything is persisted, so a refusal leaves the work item and its scope exactly as
they were; it THROWS rather than returning, so the message rides the awaited `signal-back` path back to
the agent where it is visible and actionable. The refusal names every unmarked unit alongside its text,
and closes by telling the session that `unmet` is free and mints its successor — which is the answer to
a session padding marks to get past the gate.

### Chat / intake

| Role               | Operation item                          | Happy                                                                    | Sad                                                                 |
|--------------------|-----------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------|
| **ChaosWhisperer** | the plan item (seeded `in_progress`, locked) | Authors flows/observables/contracts/`packagesAffected` — never `operations`; at Start Quest `questBuildRelayGraphBroker` force-marks the plan item `complete` and mints the ENTRY family's scopes. The codeweaver scopes are cut later, when the family graph routes to that family. | No execution sad path. The approval gate rejects `approved`/`flows_approved` only for empty `flows`; it demands no ledger item. |
| **BugHunt**        | the plan item (seeded `in_progress`, locked) | Captures the reproduction flow (one flow per bug, `ACTUAL:`/`EXPECTED:` terminal fork) and its observables; force-completed at Start exactly like ChaosWhisperer. Implementation lands on the same codeweaver scopes a feature quest gets. | No execution sad path.                                            |

### Inside one family — the step paths

A family's scopes all run the SAME step graph; what differs between families is which steps that graph
holds. Every step declares a `role` (`planner` / `worker` / `reviewer`), a `kind` (`prompt` /
`deterministic`), a `maxVisits` ceiling, and a route per outcome word.

| Step role | Assigned | Why |
|---|---|---|
| `planner` | no units | it cuts pieces; it settles nothing itself |
| `worker` | the units its PIECE assigns, re-filtered at dispatch against the record | a planner forecasts against what it could see; a sibling piece may have settled half of it by dispatch time |
| `reviewer` | its scope's WHOLE in-scope set, filtered by the step's declared scope | a reviewer has no piece — a planner cuts worker pieces, not review pieces — so the in-scope set IS its assignment, which is what makes the signal gate and the in-scope gate the same check |
| `deterministic` | no units | it runs code and has nothing to mark; its outcome is its handler's exit code classified into one of the four words |

**codeweaver** — `plan → work → review → commit → ward`. `review`'s `unmet` loops back to `work`;
`ward`'s `unmet` routes to `repair`, which declares no `done` route and so returns to the ward that
minted it. `ward`'s `done` and `empty` both reach `@done`. The family is UNLOCKED, so its budget is the
step graph's own `maxVisits` rather than a pt chain.

**flowrider** — the same shape plus `recipe`, a `mintableOnRequest` step nothing routes to: a planner
that needs seed data asks for it, and so does a worker whose seeds do not satisfy the job in front of
it. It declares no `done` route either, so it returns to whichever session requested it.

**siegemaster** is the INVERSE of the other two — its reviewers run FIRST and find the work, its worker
repairs — and the structure holds unchanged: `sweepIn → plan → happyWalk → adversarial → commit → ward →
sweepOut`. Two more steps sit OFF that chain, mintable ON REQUEST rather than by route: `recipe` (the
same `recipe-maker` prompt flowrider requests — a recipe is flow-scoped, not family-scoped, so whichever
family asks first authors it) and `read` (the `siegemaster-reader` prompt, opening source files so no
walker has to). Neither declares any route but `wall`, so a planner asking up front or a walker asking
mid-pass gets it back as a fresh work item at its own step, not a route target. `happyWalk` (the
`siege-happy-walker` prompt) and `adversarial` (the `siege-adversarial-walker` prompt) are `reviewer`
steps, each with its OWN fixer — `fixHappy` runs the `siege-happy-fixer` prompt, `fixAdversarial` the
`siege-adversarial-fixer` prompt — that routes back to the walker that found the work — one shared fixer
sent every adversarial finding back to the happy walk, which never measured it. **`happyWalk →
adversarial` is the PHASE ORDER, and it is a route rather than a rule in a prompt:** a step's `done`
fires only once every piece at that step has DRAINED, so every happy piece has recorded before the first
attack is minted and an antagonist's baseline exists by the time the router mints it. `sweepIn` and
`sweepOut` are `cleanup` handlers at both ends — the first makes the first capacity reading honest, the
last catches what the pass leaked. **Siegemaster's `ward` step OVERRIDES the shared `CLOSE_OUT`
routing**: every other family's `ward` sends `done` and `empty` straight to `@done`, but siegemaster's
sends both to `sweepOut` instead — the pass is not over until the instances it opened are swept. `unmet`
still routes to `repair`, unchanged from every other family's gate.

**riftcarver** — `carve → repair → commit → carve`. **wardFull** — `gate → repair → commit → gate`.
Both carry their own `commit`, because neither shares the `CLOSE_OUT` trio: without one a repair's fix
would reach `@complete` uncommitted and warpgate's `git merge --squash` would drop it.

**warpgate** — one step, `merge`, whose `unmet` loops back to itself.

### The `@blocked` and `@done` targets

Two route targets are not step names. `@done` COMPLETES the scope — the router answers
`{ kind: 'complete' }` and `questRouteScopeBroker` marks the operation item `complete`. `@blocked` halts
the quest for a human: the router answers `{ kind: 'block' }` with a `reason` and a `message`, and the
broker hands that message to `quest-block-on-failure-broker` as the failed item's `errorMessage`.

The router's block reasons are `wall` (an outcome routed to `@blocked`), `max-visits` (a step's ceiling
reached), `unknown-step` / `unknown-route-target` (a `quest.json` naming something the graph no longer
declares — the step-name contract is free-form so such a quest still LOADS, and dispatch is the only
place it may fail), and `no-minter` (an undeclared outcome on a step whose work item names nobody to
return to: not a stall, and not a silent pass).

### Marking a unit — `stepScopeStatics.byFamilyStep`

Every verification unit — each terminal, each labelled branch, each embedded observable, and each off-map probe
family — is marked through `quest-work`'s `observations` payload by whichever step's session actually measured it.
There is no separate per-track field on the unit itself: `flow-node-contract`, `flow-edge-contract` and
`flow-observable-contract` carry no `codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff` — a unit's state is
the most recent `{ unitId, mark, evidence, toSettle?, at }` observation recorded against it (see "The three marks"
above), never a `confirmed`/`unconfirmable` verdict on a separate field.

`stepScopeStatics.byFamilyStep` decides which units each step could ever mark — the one table every denominator
reader shares (`qaUnitsInPackageScopeTransformer`, `stepInScopeUnitsTransformer`, `relayTailFanOutTransformer`, and
the `get-quest-work` broker all read it; none reads a track-keyed one):

| Family — step | `flowTypes` | `unitKinds` |
|---|---|---|
| `codeweaver` — `review` | `runtime`, `operational` | `terminal`, `branch`, `observable` |
| `flowrider` — `review` | `runtime` | `terminal`, `branch`, `observable` |
| `siegemaster` — `happyWalk` | `runtime` | `terminal`, `branch`, `observable`, `off-map` |
| `siegemaster` — `adversarial` | `runtime` | `off-map` only |

Operational units settle inside codeweaver's own `review` step alone, since an operational flow is a one-time task
sequence with no repeatable walk for `flowrider` or `siegemaster` to drive. `adversarial`'s scope is `off-map` alone,
so it never re-marks a terminal, branch or observable unit `happyWalk` already covers. Every step also excludes an
observable whose `addedBy` postdates it (`flowrider`'s and `codeweaver`'s `review` steps exclude `addedBy:
'siegemaster'`, since siegemaster runs strictly after them), and a seam's units go to the LATER-ordered cell alone,
exactly as "A SEAM'S UNITS BELONG TO EXACTLY ONE CELL" above states for the codeweaver fan-out. An off-map unit is a
unit like any other (`{ kind: 'off-map', id, flowId, offMapFamily }`, from `qaUnitEnumerateTransformer`) — marked
through the same `observations` payload, not a separate collection.

**A `verifyByHuman` observable drops out of every step's list.** Setting it means no automated check — no test, no
reading — can settle the criterion at all; only a person can, and only after the quest is done. It resolves to the
verification method `human-check`, and no entry in `stepScopeStatics.byFamilyStep` lists `human-check` among its
methods, so the unit is excluded from every step's in-scope set by construction — nothing marks it through
`quest-work`. A person records the verdict separately, through the web UI, which calls
`quest-human-verdict-record-broker({ questId, unitId, outcome: 'met' | 'not-met', reason })`; that call appends a
`human-verdict` quest note rather than an observation — see `questNotes` below.

**A measured defect is a NEW observable, not a third mark value.** An observable is a positive expectation; "send it
`bleh` and the server crashes instead of returning 400" is the INVERSE expectation, so it is ADDED to the flow
through the additive spec authority every step holds, and it is then marked the same way any other observable is.

**Provenance is a separate axis.** `addedBy` on the observable (`spec | chaoswhisperer | codeweaver | flowrider |
siegemaster | operator`) answers "was this in the spec at approval, or added mid-quest, and by whom" — never whether
the unit is marked.

**Marks are written via `quest-work`'s `observations` payload, batched.** One call carries an array of `{ unitId,
mark, evidence, toSettle? }` entries — terminal, branch, observable and off-map units alike.

**`get-quest-work({ questId, workItemId })` is how a session reads its own scope.** It resolves the work item's
linked operation item, reads that item's own `flowIds`/`packageNames` directly, and narrows them through
`stepInScopeUnitsTransformer` against the work item's `step` — the same table above. That id is the only argument a
caller needs, and it is the same derivation any other reader would use, so the number a session reads about its own
scope cannot drift from the number anyone else computes for it.

### Resetting a flow

A siegemaster work item may re-open a flow's units for re-walking through `quest-work`'s `invalidation` payload —
`{ kind: 'invalidation', flowId, reason }`. It throws unless the calling work item's own linked operation item
resolves to the `siegemaster` family and names that flow in its own `flowIds`. The call edits no field on any unit —
a unit's mark is already just the most recent observation recorded against it, so there is nothing to blank — it
appends a `walk-reset` quest note, and the units it names are UNIONED onto the next work item the router mints for
that scope.

It exists because an observation is a measurement of a system at a moment. When siegemaster fixes a defect mid-walk,
every observation already recorded on that flow describes the code as it stood BEFORE the repair — each is now a
claim about a system that no longer exists. The session resets and re-walks rather than leaving marks against
deleted behaviour on the record.

### `questNotes` — the durable side channel

`quest.planningNotes.questNotes[]` holds `{ id, kind, role, workItemId, flowId?, unitId?, summary, detail, at }`, with
`kind` one of:

| Kind | For |
|---|---|
| `open-question` | something genuinely unsettled that a later session or a human must answer |
| `tooling-error` | a tool or harness that failed in a way the quest's own code cannot fix |
| `out-of-scope` | a real finding this role has no authority to close — e.g. a coverage hole a mutation-only audit surfaced |
| `walk-reset` | appended by `quest-work`'s `invalidation` payload, recording that a flow was re-opened for re-walking and why |
| `walked` | recorded when a siegemaster walk drives a path, pairing it with the siegelense evidence (`instanceId`/`runId`) that path produced |
| `human-verdict` | a person's verdict on one `verifyByHuman` unit (`outcome: 'met' \| 'not-met'`), recorded because no step can mark it through `quest-work` |

**A note NEVER closes a unit.** Only an observation does. A note is how information that is not a mark survives the
session that found it.

### Deterministic steps — the four handlers

A `kind: 'deterministic'` step runs CODE, not a session. `stepHandlerRunBroker` dispatches it through a
TABLE carrying `satisfies Record<StepHandlerName, StepHandler>`, so a handler named in
`agentFlowStatics` with no implementation behind it fails the BUILD rather than throwing on the one
quest that reaches that step. That broker is also THE HANDLER BOUNDARY a thrown error becomes `wall` at:
a handler that hits an exceptional condition it does not itself classify throws, and the boundary turns
that throw into a `StepHandlerResult` instead of an unhandled rejection with nothing to route it. A
handler's own DIRECT classified `wall` never reaches that catch — those are returned values.

| Handler | Runs | `done` | `empty` | `unmet` | `wall` |
|---|---|---|---|---|---|
| `commit` | `git add -A`, `git commit --allow-empty`, bare `git push` | the tree carried changes | the tree was already clean before staging | — | a thrown failure |
| `ward` | ward with the STEP's own `args`, verbatim | exit 0 | a 0-file scope: green by exit code, nothing graded | a red | a CRASH — ward never reported on the code, so a repair has nothing to fix |
| `riftcarver` | base branch → worktree → push → `node_modules` mirror → preflight typecheck | the carve converged | — | a repairable red (`push` / `node_modules` / `typecheck`) | a `git-state` red (`create` / `base_branch`) or a permission denial at ANY step |
| `cleanup` | `dungeonmaster siegelense cleanup --json` | something was released | nothing was there to release | — | a thrown failure |

A deterministic step's work item carries no `sessionId`, so no JSONL watcher can ever tail it:
`questRunStepBroker` takes a **required `onLine`**, and that callback is the only route its output has
to a UI for minutes at a time. Ward and riftcarver each persist a per-run history file under the quest
folder and back-link it onto the work item — `ward-results/<id>.json` via a `wardResults/<id>` ref, the
streamed carve text at `riftcarver-results/<id>.log` via a `riftcarverResults/<id>` ref. That ref is the
only route the execution panel has to the detail.

**The handler ROUTES NOTHING.** It classifies, `questRunStepBroker` writes that word onto the work item
as `declaredWord` (marking it `failed` and carrying the detail as `errorMessage` on a `wall`, `complete`
otherwise), and the ROUTER decides what the scope does with it on the next scan. A handler that decided
its own route would be a second router, and the two would disagree the first time a graph changed.

**`commit` covers THIS PASS, not the scope's whole history.** One scope cycles `work ⇄ review` and
commits once per pass, so the message's covered set is every work item on this scope between the
PREVIOUS commit at this step and this one — exactly the `plan`/`work`/`review` run whose marks this
commit is landing. The cut uses ARRAY order rather than `createdAt`, because a parallel batch is minted
inside one persist and shares a timestamp. Every `git` verb runs inside `questWithModifyLockBroker`, the
same per-quest lock the ledger writers take, so two commit handlers on one worktree serialize instead of
colliding on git's own `index.lock`.

**Riftcarver is re-entrant by design — every step owns a done-check.** Because `carve`'s `unmet` routes
to `repair` and `repair` returns to `carve`, the handler is re-entered against a partially built
workspace as a matter of ROUTINE. See RIFT-1 and RIFT-2 under "Invariants" for the contract that holds
it together.

### Recovery

`repair` is a STEP, not a family: `agentFlowStatics` gives `codeweaver`, `flowrider`, `siegemaster`,
`wardFull` and `riftcarver` each their own, all running the `spiritmender` prompt on sonnet. A gate's
`unmet` routes to it, and it declares no `done` route of its own, so a finished repair RETURNS to the
gate that minted it and that gate re-runs. Its `unmet` loops back to itself, bounded by its own
`maxVisits`.

## The sad paths in detail

(a) and (b) are not failures: they keep the quest `in_progress` and move it forward. (c) and (c2) are
the orchestrator recovering from something outside the quest. (d) is the one halt, and every family
reaches it the same way.

### (a) `unmet` → a re-cut batch — `nextActionTransformer`, question 2

A step that leaves units unsettled does not fail. The router asks, of the terminal work items at the
current step, which of their assigned units still carry a `null` or `unmet` current mark, subtracts any
unit some LIVE work item already holds (both siege walkers are assigned the full scope, so without that
subtraction each would read the other's units as abandoned), and mints against the step's own
`routes.unmet`.

**Grouping keys on the ORIGINATING PIECE, never the mark set.** The router walks the plan's batches,
then each batch's pieces, then each piece's `assignedUnitIds`, in declaration order, writing only where
the key is absent — first write wins, and the plan file's own order is the only ordering anyone can read
back off disk. Each group becomes ONE work item carrying that piece's brief. `contextUnitIds` are NOT
claims: a seam's far half sits on the earlier cell as context and must not pull a re-mint onto it. A
unit no piece ever claimed gets its own work item with no `pieceId` and no `payload` — that is the
reviewer's whole job, and there is no originating piece to copy a brief from.

Each mint carries `mintedBy`, the RETURN EDGE. A step that is only ever mark-minted declares no `done`
route at all, and an undeclared outcome returns to the work item `mintedBy` names — as a FRESH work item
at that minter's step, never a resume of the minter's own. A worker's return carries its minter's units
MINUS whatever is now settled, plus its piece and brief, so the recipe it asked for lands on the same
work it was already doing.

### (b) a red gate → `repair` → the gate re-runs

`ward`'s `unmet` routes to `repair`; `carve`'s does the same. The repair is a `spiritmender`-prompted
worker step in the same family, it declares no `done` route, and so it RETURNS to the gate that minted
it — which then re-runs and re-classifies. Convergence is the verdict: a gate that comes back `done`
takes its own `done` edge onward.

The bound is `maxVisits` on each step — a ceiling on a count nothing stores, derived where the router is
about to mint from the work items on this scope whose `step` equals that step. Exceeding it is
`{ kind: 'block', reason: 'max-visits' }`. There is no visit counter field on the work item and none is
to be added.

A `wall` from either is different in kind and never reaches a repair: ward's `wall` is a CRASH, so ward
never reported on the code and a repair would have nothing to fix; riftcarver's is a `git-state` red or
a permission denial, where there is no worktree to dispatch a repair into and the only checkout left is
the repo root — the one place no session may ever be sent. Both route straight to `@blocked`.

### (c) orphan → resume — `recover-orphaned-work-items-layer-broker`

An `in_progress` work item observed during a scan is orphaned (the server restarted, the user killed it,
or it crashed) — the loop holds no dispatch in flight while it scans. Recovery flips the orphan back to
`pending`, **keeps** `sessionId` / `agentId`, and sets a `resume` marker (when a `sessionId` was
captured); `retryCount` increments. `compute-ready` then selects it and dispatch **resumes** the retained
Claude session (`claude --resume`, prompting it to finish and signal back — Node/UI path). Fallbacks
fresh-spawn instead: an early-crash orphan with no captured `sessionId`, and the MCP `/dumpster-launch`
Task path (its `sessionId` is the parent loop session, so a re-`Task()` is always fresh). Budget:
`retryCount ≥ slotManagerStatics.orphanRecovery.maxResets` → the crash loop is terminal →
`quest-block-on-failure-broker`.

**A resumed orphan keeps its `step` and its `observations`.** The observation set FREEZES at signal, so a
resumed session re-marks its assigned units from scratch rather than amending a predecessor's set, and
the router reads the same current mark either way.

**A retained `sessionId` is never thrown away.** The resume decision lives in
`buildSpawnInstructionLayerBroker` and keys on `sessionId !== undefined && agentId === undefined` — NOT
on the `resume` marker. Any dispatchable work item that has a session resumes it, whatever the role. The
marker is still written as a record of "this item was reclaimed", but gating on it meant an item whose
session was recorded and then never formally reclaimed (a quest that blocked before recovery reached it,
a hand-repaired quest.json) fresh-spawned instead — and the new child's init line overwrote `sessionId`,
silently orphaning a session that still held real work. `agentId` is the ONE exception:
`get-agent-prompt` stamps it together with a `sessionId` that is the user's `/dumpster-launch` loop
session, not the agent's own, so resuming it would hand a headless child the user's interactive session.

The resume prompt leads with the fact that the session was KILLED, not paused: its context ends
mid-action, so the agent's last edit/command/commit may never have landed. It requires re-establishing
real state (`git status`, re-read the files, re-run the check that was in flight) BEFORE any new work.

**A TERMINAL work item is never reclaimed**, whatever its operation item reads. A scope stays
`in_progress` across every step it runs, so a terminal item under a live scope is the ordinary state
between a step RECORDING its outcome word and `questRouteScopeBroker` READING it — and the router runs
AFTER recovery in the same scan, so reclaiming the item re-runs finished work the router never gets to
route: the same deterministic step re-runs every scan until the reset budget blocks the quest. A
half-applied signal is not a case here either — the signal handler writes work-item-terminal and
operation-complete in ONE persist, so a signal that never landed leaves the item `in_progress`, which is
the orphan case above.

An escalation ends the scan. `recoverOrphanedWorkItemsLayerBroker` returns `{ quest, blocked }`, and
`scan-once-layer-broker` returns `null` on `blocked: true` instead of continuing to the router or the
advance self-heal — the status filter that admitted the quest ran BEFORE the block was written, so
nothing downstream would notice on its own.

### (c2) API overload → wait it out — `spawn-one-agent-layer-broker`

A dispatched child that exits non-zero having emitted a 529 / `overloaded_error` marker did not fail;
the upstream Anthropic API did. This is NOT an orphan and must not spend recovery budget: a 529 death
takes seconds, so three of them inside a few minutes would exhaust `orphanRecovery.maxResets` and block
the quest over an outage that clears on its own. The spawn layer instead re-dispatches the SAME work
item in place on `apiOverloadRetryStatics`' schedule — 10 retries one minute apart, then 20 five minutes
apart, a ~110 minute window — and resumes the captured `sessionId` when the dead attempt got far enough
to have one, so an agent that worked for twenty minutes before the outage keeps its context. The retry
abandons itself if dispatch is paused (checked before AND after each backoff, which can sleep for
minutes) or if the work item went terminal during the wait. Only once the schedule is spent does the
death fall through to orphan recovery.

Detection requires BOTH signals: `isApiOverloadLineGuard` matching an output line AND a non-zero exit
code. An agent that merely prints "API Error: 529" while exiting 0 is a success.

Each attempt registers its own process id and `unregisterProcess`es it on exit, so the stale-process
watchdog (which only warns, never kills — a minutes-long backoff is safe) does not accumulate an entry
per dead child.

### (d) `wall` → `@blocked` → immediate halt — `questRouteScopeBroker`

`wall` is the **environment wall**: a command the dispatched session is denied, a missing credential, an
unreachable service, a crashed gate — something no fresh session of any role could get past. A session
declares it through `quest-work`'s `outcome` payload; a deterministic step's handler classifies it. The
router folds it (worst-first, so one `wall` in a parallel batch decides the step), reads the step's own
`routes.wall` — `@blocked` in every step of every family — and answers:

```
{ kind: 'block', operationItemId, family, step, reason: 'wall', message: '…' }
```

`questRouteScopeBroker` writes NOTHING for that answer. It hands the router's `message` to
`quest-block-on-failure-broker` AFTER the persist returns — that broker goes through `questModifyBroker`,
which takes the same per-quest lock — and the broker marks the failing work item `failed` carrying the
message as its `errorMessage`, drains every still-pending work item to `skipped`, and sets the quest
`blocked`. The scan stops there rather than falling through to the advance self-heal.

**Nothing is spent on a successor.** The halt is the bound; the next session would hit the identical
wall, and that is precisely the waste this outcome exists to prevent.

## Block ownership

`quest-block-on-failure-broker` is the **sole** path to `blocked`. It marks the failed work item
`failed`, drains every still-`pending` work item to `skipped`, and sets quest status `blocked`. There
are two callers:

1. **The router routed an outcome to `@blocked`** — `questRouteScopeBroker` (§ (d)), carrying the
   router's own `message` as the failed item's `errorMessage`. That covers every one of the router's
   block reasons: `wall` (an environment wall, or a gate that crashed), `max-visits` (a step's ceiling
   reached), `unknown-step` / `unknown-route-target` (a quest naming something the graph no longer
   declares), and `no-minter` (an undeclared outcome with nobody to return to). Every one halts on the
   FIRST occurrence rather than on a spent budget — except `max-visits`, which IS the spent budget.
2. **Orphan recovery exhausted** — `recover-orphaned-work-items-layer-broker`, when a work item's
   `retryCount` reaches `orphanRecovery.maxResets`.

**The message is the deliverable.** `blocked` alone tells the user nothing actionable, so the reason
rides on the item that failed — never on the pending items drained alongside it — and the router writes
it naming the step, the family and the operation item.

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

- **REL-1 — One scope, MANY work items.** An operation item carries one work item per step the router
  mints on it, and one per piece inside a parallel step. `step` is what separates them; the
  `operations/<id>` ref is many-to-one. Advance still enters a scope exactly once — its resume guard
  skips a `pending` operation item that already has a linked work item, and that stays correct because
  the router only mints inside an item that is already `in_progress`.
- **REL-2 — Universal operations link.** Every work item, from the first, carries exactly one
  `operations/<id>` ref (seeded by `quest-create-broker`, `questBuildRelayGraphBroker`,
  `questAdvanceBroker` and `questRouteScopeBroker`). The link is never re-pointed at a second operation
  item and no work item's status is ever reverted.
- **REL-3 — A batch is one step of one family.** `select-batch-layer-broker` admits only work items
  sharing one role AND one step, and its caller selects exactly that group off the ledger — which is a
  router mint read back. Several sessions of one step run in PARALLEL by design (nine codeweaver cells,
  a step's pieces); what never happens is two different steps or two different families at once. A
  deterministic step and a command work item each dispatch ALONE.
- **REL-4 — Advance and routing are atomic + idempotent.** Each lands in ONE
  `questOperationsUpdateBroker` persist, so a crash is all-or-nothing. Advance is called from both the
  signal handler AND the scan self-heal and is safe from both; the router re-resolves its scope inside
  the lock and writes nothing if it no longer qualifies.
- **REL-5 — No false complete.** `complete` means the FAMILY GRAPH reached `@complete` — a family
  routing there holds scopes and every one of them is complete. A drained ledger proves nothing: under a
  graph that can cycle, `work ⇄ review` is legitimately empty between two passes.
- **REL-6 — `unmet` mints, it does not continue.** A step that leaves units unsettled routes them to
  its own `routes.unmet` as a fresh batch scoped to exactly those units, grouped by the ORIGINATING
  PIECE. `contextUnitIds` never pull a re-mint, and no continuation scope is appended to the ledger —
  the re-cut is work ITEMS on the scope that is already open.
- **REL-7 — Idempotent signal.** A redelivered signal for an already-terminal work item is a no-op, and
  because that check runs before the unmarked-unit gate a redelivery never pays that gate's cost either.
- **REL-8 — No step signals with an unmarked ASSIGNED unit.** `signalGateTransformer` refuses the call
  while any id in `assignedUnitIds` carries no matching `observations[].unitId`. The mark's VALUE is
  irrelevant; only its absence counts.
- **REL-9 — A `reviewer` step is assigned its scope's whole IN-SCOPE set**, filtered by the step's own
  declared scope (`stepScopeStatics.byFamilyStep`). A reviewer has no piece, so the in-scope set IS its
  assignment — which is what makes the signal gate and the in-scope gate the same check, and what lets a
  reviewer's `met` supersede a worker's.

### Riftcarver

- **RIFT-1 — Every step is re-entrant.** The repairable route is `carve → repair → carve`, so the
  handler is re-entered against a PARTIALLY BUILT workspace as a matter of routine, not as an edge
  case. Therefore **every step begins with a done-check that inspects the
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
  - **The TYPECHECK is the one deliberate exception and has NO done-check.** Re-running it is
    precisely how the spiritmender's fix gets verified — the typecheck is the verdict, not a side
    effect. A marker file "optimising" it away would let a re-carve report green off the previous
    attempt's result.
  - **The collision check is skipped on a re-entry, deliberately.** It guards the FIRST carve against
    a name some other work owns. On a re-entry the quest already records the branch — it is the quest's
    OWN — so re-running the check would refuse the re-carve against work the first attempt did and lock
    the quest out permanently. This is the step that breaks first if a done-check is dropped.
- **RIFT-2 — `baseRef` is written exactly once, ever.** It is read from the new worktree's HEAD in
  the same breath as creation, before `node_modules` or the typecheck can touch the tree, and NEVER
  recomputed once recorded — not even when the worktree is re-created and its fresh HEAD reads back a
  different sha. Moving it after commits have landed folds the quest's own work into the review base,
  the exact defect `baseRef` exists to fix. Riftcarver is its SOLE writer: `questBuildRelayGraphBroker`
  stamps none, because Start runs before any worktree exists and the only HEAD available there is the
  server process's own checkout.
- **RIFT-3 — Classified by step, never by one rule.** `worktreePrepareStepStatics.classifications`,
  keyed by step VALUE, makes `create` / `base_branch` a `wall` and `node_modules` / `typecheck` an
  `unmet`; `isPermissionDeniedErrorGuard` is checked FIRST and overrides both. The handler reports that
  word and the `carve` step's own routes do the rest — `unmet` to `repair`, `wall` to `@blocked`. **No
  agent is ever dispatched while the quest's only checkout is the repo root.**
- **RIFT-4 — Bounded.** The `carve` and `repair` steps each carry their own `maxVisits`, counted as the
  work items on this scope at that step; exceeding one is `{ reason: 'max-visits' }` and blocks.
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

- **WARD-1 — Non-looping.** A `done` ward takes its own `done` edge onward, never another ward
  back-to-back; an `unmet` ward routes to `repair`, which returns to that same ward, so the repair
  always runs before the re-run.
- **WARD-2 — Bounded.** `ward` and `repair` each carry their own `maxVisits`; exceeding one blocks.
- **WARD-3 — The scope rides the STEP.** A family's own gate declares
  `args: ['--committed', '--uncommitted']` and `wardFull`'s declares `[]` — a bare ward over the whole
  monorepo. Those arguments are passed to the handler verbatim, so no call site carries a mode ternary.
- **WARD-4 — `wardFull` runs ONCE, after every family has drained**, because it is a FAMILY with one
  scope that siegemaster's `done` routes to — never one gate per cell.

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
- **ORPH-1b — A TERMINAL work item is never reclaimed.** Recovery reads `isActiveWorkItemStatusGuard`
  and nothing else; the linked operation item's status is not consulted. A scope stays `in_progress`
  across every step it runs, so a terminal item under a live scope is a step that RECORDED its word
  waiting for `questRouteScopeBroker` to READ it — and the router runs after recovery in the same scan.
  Guarded in `recover-orphaned-work-items-layer-broker.test.ts` → "a terminal work item is never
  reclaimed".
- **ORPH-2 — Bounded.** `retryCount ≥ orphanRecovery.maxResets` → `blocked`.
- **ORPH-3 — An API overload never spends the budget.** A non-zero exit carrying a 529 /
  `overloaded_error` marker retries in place on `apiOverloadRetryStatics`' two-tier schedule with
  `retryCount` untouched, resuming the captured session. Only a spent schedule reaches recovery.
- **ORPH-4 — The overload retry yields.** It abandons on a paused dispatcher (checked before and
  after each backoff) and on a work item that went terminal during the wait.

### Block

- **BLK-1 — Sole block owner.** `quest-block-on-failure-broker` is the only writer of `blocked`,
  reached from exactly two callers: the router routing an outcome to `@blocked`
  (`questRouteScopeBroker`), and orphan-recovery exhaustion.
- **BLK-1a — The router's message reaches the user.** `questRouteScopeBroker` passes the router's own
  `message` as the failed work item's `errorMessage`, so the execution row names the step, the family
  and the reason rather than only saying `blocked`.
- **BLK-2 — A blocked quest is not dispatched.** The scan filters on `in_progress`, so a `blocked`
  quest is skipped and dispatch halts; the user resumes it explicitly.
- **BLK-3 — A block ends its own scan.** When recovery escalates OR the router halts,
  `scan-once-layer-broker` returns `null` without running anything below it — no work item is minted for
  the next scope and nothing is dispatched against the quest that just halted.
- **BLK-4 — Resume rearms.** `blocked → in_progress` returns every work item whose operation item is
  still unfinished to `pending` with `retryCount` 0, keeping `sessionId` + the resume marker, and
  persists that BEFORE the status flip. A resume that only flipped the status would re-block on the
  next scan.

### Siegemaster

- **SIEGE-1 — A lane that will not boot is a defect, never a wall.** `happyWalk` and `adversarial` are the two steps
  flagged `needsLane`; each provisions its own siegelense lane — an API server, a Vite server, a headless Chromium
  page — before it runs. `sweepIn` and `sweepOut`, the family's own `cleanup`-kind steps at the head and tail of the
  scope, make the first capacity reading honest and catch whatever a pass leaked. A lane that fails to start, or
  whose server dies mid-walk, is something that step's own session reports and its fixer (`fixHappy` /
  `fixAdversarial`) repairs like any other finding — not an environment wall.
- **SIEGE-2 — `happyWalk → adversarial` is a route, not a prompt rule.** `happyWalk`'s `done` fires only once every
  piece at that step has DRAINED, so every happy-path piece has recorded before the first `adversarial` piece is
  minted — proven directly in `quest-route-scope-broker.integration.test.ts`'s own phase-order coverage.
- **SIEGE-3 — `adversarial` never re-marks what `happyWalk` already covers.** Its `unitKinds` is `off-map` alone
  (`stepScopeStatics.byFamilyStep.siegemaster.adversarial`) — proven by the route-scope broker's own off-map-scope
  test — so an antagonist's finding on a terminal, branch or observable unit is a NEW observable, never a re-mark of
  one `happyWalk` settled.
- **SIEGE-4 — `ward` overrides the shared `CLOSE_OUT` routing.** Every other family's `ward` step sends `done` and
  `empty` straight to `@done`; siegemaster's sends both to `sweepOut` instead — the pass is not over until the lanes
  it opened are swept. `unmet` still routes to `repair`, unchanged from every other family's gate.

### Contract integrity

- **C-1 — `dependsOn` references resolve** to existing work items in the same quest.
- **C-2 — The graph is a DAG** (no cycles).
- **C-3 — `relatedDataItems` reference valid collections** — `operations`, `wardResults`,
  `riftcarverResults`, `flows` (the exact set `relatedDataItemContract`'s regex admits) — and existing
  ids.
- **C-4 — Chat roles set status only within their phase** (ChaosWhisperer: `created` →
  `review_observables`).

---

## Full happy path (feature, E2E reference)

```
[USER] /dumpster-create → quest created, plan operation item seeded (in_progress, locked)
   ChaosWhisperer authors flows/observables/contracts/packagesAffected — never operations
   created → … → review_observables
[USER] APPROVE observables (gate requires non-empty flows only) → approved
[USER] Start Quest → questBuildRelayGraphBroker force-completes the plan item, mints the ENTRY
        family's scopes and NOTHING ELSE (one riftcarver scope), and creates its first work item at
        that family's entry step (`carve`)
        approved → in_progress   (milliseconds: no spawn, no git, no build)
[DISPATCHER] Node/UI play button (or /dumpster-launch)

   ▼ riftcarver scope
       carve   [run-step · handler riftcarver]  → done → @done
       (scope complete; riftcarver family drained → routes.done → codeweaver)
       └─ the codeweaver family's cells are minted HERE, one per (package, flow)

   ▼ codeweaver scope ×N, each running its own step graph:
       plan    [prompt]           → done  → work
       work    [prompt] ×pieces   → done  → review        (unmet → work)
       review  [prompt]           → done  → commit        (unmet → work)
       commit  [run-step]         → done  → ward
       ward    [run-step, --committed --uncommitted] → done → @done   (unmet → repair → back to ward)
       (the LAST cell completing routes the family once → flowrider)

   ▼ flowrider scope ×N (one per RUNTIME flow) — the same shape, plus `recipe` on request
   ▼ siegemaster scope ×N (one per flow):
       sweepIn [run-step · cleanup] → plan → happyWalk ⇄ fixHappy
                                           → adversarial ⇄ fixAdversarial
                                           → commit → ward → sweepOut → @done
   ▼ wardFull scope (ONE, after every family has drained):
       gate    [run-step · ward, no args]  → done → @done   (unmet → repair → commit → gate)

   A family routing to @complete holds scopes and every one is complete
        → workItemsToQuestStatusTransformer derives complete ✓
The dispatcher's next get-next-step picks up the next FIFO quest.
```

**THE LEDGER GROWS AS THE RELAY RUNS.** A quest does not start with the ledger it finishes with: only
the entry family's scopes exist at Start, and each later family's are minted at the moment its
predecessor drains. That is what lets an observable an operator adds mid-quest reach a flowrider session
at all.

Sad-path routes that keep the quest `in_progress`: a step that leaves units `unmet` mints a re-cut batch
scoped to exactly those units; a red gate routes to `repair`, which returns to the gate and re-runs it;
a server crash resumes the in-flight session; an API overload waits itself out. The routes that reach
`blocked` are the router's four block reasons — an outcome routed to `@blocked` (a `wall`), a spent
`maxVisits`, a step or route target the graph no longer declares, and an undeclared outcome with no
minter to return to — plus orphan-recovery exhaustion.
