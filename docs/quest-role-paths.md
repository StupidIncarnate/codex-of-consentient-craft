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
  status. **`partial` is a signal the responder still applies generically to any code-changing role**,
  but the three operator roles' own prompts never choose it — see "Operator session" below.
- **Environment wall** — `operationStatus: 'blocked'`. Duplicate-on-partial still appends the `pt N`
  continuation, but the work item is marked `failed` with the agent's `blockedReason`, the pt budget is bypassed, and
  the quest halts for the user instead of advancing (see § (d)).
- **Fixpoint** — the `pt N` chain for `ward`. A red run completes its ward operation item and spawns a fresh `pt N+1`
  ward continuation (with a spiritmender spliced in ahead of it — see "The sad paths in detail" § (b)); a run that
  comes back green ends the chain. Convergence IS the verdict: a fresh run that came back green is acceptance.
- **Operator role** — one of the three names in `agentPromptClassificationStatics.operatorRoleNames`: `codeweaver`,
  `flowrider`, `siegemaster`. Each is served its OWN prompt file, `<role>-prompt-statics.ts`; there is no shared
  template. All three run on **opus** (`roleToModelStatics`) — each reads code, plans what it hands out, judges what
  comes back, and decides whether its scope is done, none of which is a lookup a smaller model can safely make.
  `flowrider` absorbed the role a second, now-deleted test-authoring track once held: it owns every package kind,
  including browser-reachable ones, and authors the test suites that prove a flow both in the browser and below it.
  Only `spiritmender` and `warpgate` keep bespoke prompts and run no operator session of their own.
- **Operator session** — the unit of work inside ONE operator's work item. There is no shared round-loop template
  and no generic planner/worker/reviewer triad any more: each operator **reads code itself** (`git diff`, the files a
  change touches — never the whole tree), writes its own working notes, and **briefs generic sub-agents** (plain
  `general-purpose` `Agent` dispatches, in the operator's own words against what it read) to make the actual edits.
  When sub-agents return, the operator reads the diff itself and summons exactly ONE **named** reviewer sub-agent —
  `codeweaver-reviewer`, `flowrider-reviewer`, or `siegemaster-reviewer` (siegemaster also dispatches
  `siegemaster-walker` to drive the system by hand) — and reads that reviewer's terminal `NEXT:` line: `pass` ends the
  session (`signal-back` with `done`), `rework` sends the named remainder back out for another pass, `wall` stops the
  session and signals `blocked`. **The loop is unbounded and `partial` is not on an operator's signal table** — another
  pass costs a pass inside the same session; a `partial` would cost a whole fresh session that has to reconstruct the
  remainder out of git. No code-writing sub-agent commits, builds, or wards; the named reviewer is the only session on
  the pass that runs `npm run build` / `npm run ward -- --staged`, and it alone commits (once) and pushes (bare).
- **Named sub-agent** — the five sub-agents with a served prompt (`agentPromptClassificationStatics.minionNames`):
  `codeweaver-reviewer`, `flowrider-reviewer`, `siegemaster-reviewer`, `siegemaster-walker`, and the spec-phase
  `chaoswhisperer-gap-minion`. All five run on **sonnet**. Each fetches with `{ agent, questId }` and **no
  `workItemId`** — it owns no work item, and it never calls `signal-back`; everything narrower than "which quest" (an
  operation item id, a flow, a set of paths) reaches it through its parent's own brief. A named sub-agent is a LEAF:
  it summons no sub-agent of its own. `codeweaver-reviewer`/`flowrider-reviewer`/`siegemaster-reviewer` each grade a
  different subject (product code against the flow; whether a test suite bites; whether a repair touched the cause or
  just hid the symptom) but share one shape — read every file the pass produced in full, take the five standards
  concerns in the same pass, fix what is small and clearly theirs, build, ward, commit, push, and answer with a
  `NEXT:` line. `siegemaster-walker` drives one path through a flow by hand against the running system and changes
  nothing — no build, no ward, no commit, no git.
- **Operator convergence** — `codeweaver`, `flowrider` and `siegemaster` do NOT use the ward fixpoint, and do not
  gate `done` on sign-off completeness. Each operator signals `done` once its own named reviewer's `NEXT:` line reads
  `pass`, and `blocked` only on an environment wall its reviewer names `wall`. Sign-offs recorded along the way
  (`codeweaverSignoff`, `flowriderSignoff`, `siegemasterSignoff`) are a durable proof record for the next reader, not
  a completion gate — **an unsigned unit refuses nothing.** There is no aggregate status across the three tracks.
- **Standards review** is NOT a role, NOT a ledger item, and writes NOTHING to `quest.json`. The five concerns
  (`craft`, `perf`, `dedup`, `integrity`, `test-cases`, from `standardsReviewConcernsStatics`) are GUIDANCE — "nothing
  counts what a reviewer answers here and no gate refuses a signal over a concern nobody took" (the statics file's own
  words). They are taken by each operator's own named reviewer, in the same reading pass as that reviewer's
  role-specific judgment, over the files the pass produced; the reviewer fixes what is small and hands up anything
  structural or needing a decision.
- **Sign-off** — `{ verdict, evidence, question?, workItemId, at }` on a verification unit, where `verdict` is
  `confirmed | unconfirmable`. THREE independent top-level fields, one per track — `codeweaverSignoff`,
  `flowriderSignoff`, `siegemasterSignoff` — matching THREE denominators (`codeweaver | flowrider | siegemaster`).
  See "The three verification tracks" below.
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
items at Start Quest (locked, except the `codeweaver` seed — see below).

**The two quest types share one relay, byte for byte** — `questTypeRegistryStatics`' own colocated test asserts
`startImplementationOps`, `relayTail` and `roles` are `toStrictEqual` between `feature` and `bug-hunt`. The ONLY
difference is the intake: `feature` seeds a `chaoswhisperer` chat item and runs `/dumpster-create`; `bug-hunt` seeds a
`bughunt` chat item and runs `/dumpster-hunt`. Both then run:

| Segment | Items |
|---|---|
| `startImplementationOps` | `riftcarver` (always first, exactly one item), then ONE `codeweaver` seed (`fanOutBy: 'implementation'`, unlocked) |
| `relayTail` | `ward(changed)` → ONE `flowrider` seed (`fanOutBy: 'flow'`) → ONE `siegemaster` seed (`fanOutBy: 'flow'`) → `ward(full)`, all locked |

`riftcarver` heads `startImplementationOps` for **both** types. Nothing on the ledger can run before it: every later
role works inside the worktree it creates.

So the full relay, for a feature OR a bug-hunt quest alike, is:

```
chaoswhisperer (feature) / bughunt (bug-hunt) — the intake chat item
  → riftcarver (branch + worktree + node_modules mirror + preflight build)
  → codeweaver ×N (DERIVED at Start, one item PER (PACKAGE, FLOW) CELL)
  → ward(changed)
  → flowrider ×N (DERIVED at Start, one item PER FLOW)
  → siegemaster ×N (DERIVED at Start, one item PER FLOW)
  → ward(full)
```

Every one of `codeweaver`, `flowrider`, `siegemaster` above is an OPERATOR session that reads code, briefs generic
sub-agents, and summons its own named reviewer internally. None of that internal activity — the sub-agents it briefs,
the reviewer it summons — is a ledger item or a work item; only the operator's own session is.

**Neither tail seeds a standards-review item, and nothing appends one.** The dispatch order above IS the dispatch
order at run time — `QuestHandleSignalBackResponder` appends only the `pt N` continuation, and the ward/riftcarver
brokers only their failure splices. Standards review happens INSIDE each operator session, taken by that session's own
named reviewer over the files the pass produced, before the reviewer's own commit — and nothing about it is recorded
in `quest.json`. `questTypeRegistryStatics.relayTail`'s own comment marks the point such a seed would otherwise sit,
so the absence reads as a decision.

**`codeweaver` fans out ONE ITEM PER (PACKAGE, FLOW) CELL** (`relayTailFanOutTransformer`,
`fanOutBy: 'implementation'`, on `startImplementationOps`): a cell exists wherever a package tags at least one node on
that flow, across both flow types, and its text names both — `— package: <name> · flow: <id>`. A package that tags
nodes gets cells and nothing else; its contracts reach it at runtime through the `packageName`-only `get-quest` call,
which routes them by PATH. The ONE flow-less item left belongs to a package that owns a contract (by `source`, or by
an individual PROPERTY's `source`) and tags no node anywhere — without it those contracts have no owner. Membership is
"this package TAGS a node in this flow", so a glue node mints a cell on each side — a seam has two halves and each
side gets its own. Cells are ordered by package KIND tier first (`packageBuildOrderStatics.tiers`), then
`packageGraph` depth as a tiebreak within a tier, then name, with one package's own cells in the quest's flow
declaration order — tier outranks depth because manifest depth is Kahn's order over `package.json` edges, which is
INVERTED across an HTTP seam (this repo's `server` depends on `web` to serve its bundle, so raw depth would rank the
browser package ahead of the backend route it calls). The `codeweaver` seed is minted UNLOCKED, so its pt chain stays
unbounded — though in practice the operator's own prompt never emits `partial` at all (see "Operator session" above);
unbounded matters only if something outside the prompt ever does.

**`flowrider` and `siegemaster` each fan out to ONE ITEM PER FLOW THEIR OWN TRACK MEASURES**
(`relayTailFanOutTransformer`, `fanOutBy: 'flow'` — the SAME expansion code path for both), each carrying a single
`flowId` and a text suffixed `— flow: <id>`. The cut reads `signoffTrackEligibilityStatics.byTrack[role].flowTypes`,
the one place the completion gate reads it from, so the ledger cannot mint an item the gate measures at zero:
siegemaster takes flows of either type, flowrider `runtime` alone, and an all-operational quest therefore seeds one
siegemaster item per flow and NO flowrider item at all. Per-flow items give each flow its own pt-chain budget (the
chain keys on role + base text, and the text carries the flow id).

With no eligible flow — none drawn, or none of a type this track measures — the role keeps ONE whole-quest item only
when `off-map` is in its `unitKinds`: the probe families are properties of the built system rather than of any drawn
flow, so siegemaster keeps this quest's only security (`hostile-input`) and performance (`perf`) coverage owned, while
flowrider gets nothing rather than a session dispatched against an empty denominator.

Standards review has **no role and no ledger item on either type**, and writes nothing to `quest.json`. Its five
concerns (`craft`, `perf`, `dedup`, `integrity`, `test-cases`) are guidance taken by each operator's own named
reviewer. `blightConcernGatingStatics` withholds `perf` and `integrity` from declaration-shaped files (`-contract.ts`,
`.stub.ts`, `.proxy.ts`, `.test.ts`, `.e2e.ts`, `.harness.ts`, `index.ts`) — measured across 88 such files, those two
produced ZERO findings on that file mix, which is a property of the question rather than of the reviewer. Dead-code
detection is deliberately UNOWNED: whether an export still has a consumer is a property of the whole post-fix import
graph, which no single session can answer from inside its own scope.

`bug-hunt`'s spec shape is unchanged from before: **ONE FLOW PER BUG** — the reproduction path forks at its last
shared node into two terminal nodes labelled `ACTUAL: <symptom today>` and `EXPECTED: <what the fix must make real>`,
with observables sitting on the EXPECTED side only (an observable is a positive expectation, so one on the broken
branch would ask for a test that asserts the bug). Each EXPECTED observable becomes one failing test, written by the
**codeweaver** session that owns the package the fix lands in — bug-hunt has no separate implementation role at all;
its implementation ops are the same derived `codeweaver` items a feature quest gets.

---

## Dispatchers: two drivers, one relay

The same relay is driven by two interchangeable dispatchers; both share `questAdvanceBroker`,
`signal-back`, and the dispatch scan, so the relay logic is identical for both. **Node/UI mode is the
primary driver.**

| Surface                          | Dispatcher                     | What it does                                                                                                                                        |
|----------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
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
|-------------------------------------------------|--------------------------------------------|-----------------------------------------------------------------------------|
| `created`                                       | `create-quest`                            | Intake agent's first action; seeds the plan operation item (see below)      |
| `explore_flows` … `review_observables`          | ChaosWhisperer (via `modify-quest`)       | The only roles that set status directly                                     |
| `flows_approved`, `approved`, `design_approved` | **User** (APPROVE button)                 | The approval gates; each requires non-empty `flows` — nothing else         |
| `in_progress`                                   | `start-quest` / Start Quest button        | Spec locked; the relay is seeded and dispatch begins. Start is pure `quest.json` bookkeeping — it spawns nothing and touches no git, so the panel swap is immediate; the branch, worktree, `node_modules` mirror and preflight build belong to the `riftcarver` item it seeds at the head of the ledger |
| `complete`, `blocked`                           | Derived / set by the orchestrator         | `complete` derived by `workItemsToQuestStatusTransformer`; `blocked` set only by `quest-block-on-failure-broker` |
| `paused`, `abandoned`                           | User                                      | Not derived over — owned by the user                                        |

**The approval gate** (`quest-gate-content-requirements-statics`) requires only non-empty `flows` for
`flows_approved`, `approved`, and `design_approved` alike — for EVERY quest type. It demands no ledger item at all:
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
   there is no `codeweaver` item on the ledger yet at all. The approval gate no longer needs one: it
   only requires non-empty `flows`.

3. **User approves** → **Start Quest** (`OrchestrationStartResponder`):
   - Start is **pure `quest.json` bookkeeping**: the startable gate, the package dependency graph
     (one `package.json` read per declared package plus Kahn's order — milliseconds), the relay seed,
     then the status flip and the queue entry. It spawns no child and runs no git, which is what
     keeps the POST at millisecond scale and lets the WebSocket-driven panel swap land instantly.
   - `questBuildRelayGraphBroker` force-completes any non-complete intake (`chaoswhisperer` /
     `glyphsmith` / `bughunt`) operation item, then mints `startImplementationOps` + the fixed verify
     tail as pending operation items (locked, except the `codeweaver` seed itself — see below) and
     creates ONE work item for the first actionable (`pending`) operation item — the `riftcarver`,
     minted `spawnerType: 'command'` off `isCommandWorkItemRoleGuard` — linked `operations/<id>`,
     depending on the completed chat work items.
   - It stamps **no `baseRef`**. Start runs before any worktree exists, so the only HEAD it could read
     is the server process's own checkout; `riftcarver` is the sole writer of that field and reads it
     from the worktree's own HEAD once the worktree is real.
   - **This is also where the codeweaver items are born.** `startImplementationOps` for either quest
     type is TWO seeds — the `riftcarver` above, then
     `{ role: 'codeweaver', fanOutBy: 'implementation', locked: false }`. `questBuildRelayGraphBroker`
     runs it through `relayTailFanOutTransformer`, which expands it into ONE item per (package, flow)
     CELL across both flow types, plus one flow-less item for a package that owns a contract by
     `source` and tags no node at all. Cells are ordered by package KIND tier
     (`packageBuildOrderStatics`) first, then `packageGraph` depth as a tiebreak — tier outranks depth
     because manifest depth is Kahn's order over `package.json` edges, which is INVERTED across an
     HTTP seam. `locked: false` is why this is the one seed minted unlocked.
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

5. **The dispatch loop** picks up that first codeweaver work item. The operator reads its operation
   item + git + the ledger, verifies it's the right next step, reads its package, writes its own working
   notes, briefs generic sub-agents to make the edits, reads the diff, summons a `codeweaver-reviewer`,
   and — once that reviewer's `NEXT:` line reads `pass` — signals `complete` carrying
   `operationItemId` + `operationStatus: 'done'`.

6. **`QuestHandleSignalBackResponder`**, in ONE atomic `questOperationsUpdateBroker` write, marks the
   work item terminal (`complete`) + the linked operation item `complete`, then calls
   `questAdvanceBroker` → the next `pending` operation item (the next `codeweaver`) gets its work item.
   Repeat until all codeweaver items are complete.

7. **Ward operation items** are dispatched as `run-ward` (`spawnerType: 'command'`) and handled by
   `quest-run-ward-broker` (see the ward path below).

8. **Verify roles** run in tail order — `flowrider`, then `siegemaster`. Both are **operators**:
   `flowrider` runs one session per flow, authoring the test suites that prove it in the browser and
   below it, signalling `done` once its own `flowrider-reviewer` says `pass`; `siegemaster` runs one
   session PER flow, driving the running system by hand (via `siegemaster-walker`) and repairing what
   it finds, signalling `done` once its own `siegemaster-reviewer` says `pass`. The two roles' tracks
   are INDEPENDENT — a `flowriderSignoff` does nothing to `siegemasterSignoff`'s gate, and vice versa.
   Each role's chain is keyed on role + base text — one chain PER FLOW for each. There is no
   standards-review item in this tail and none is appended to it: each session's own named reviewer
   takes the standards concerns before that reviewer's own commit (see "Quest types and their relay
   tails" above). After `siegemaster` converges, `ward(full)` runs; on green, no `pending` operation
   item remains and the operation-aware status transformer derives `complete`.

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

**One gate can REFUSE a signal outright, before any of the above happens: the commit-before-signal gate** (§ (e)). A
refusal persists nothing, so it is not a sad path in the ledger sense — the session commits what the message names and
signals again. There is no separate sign-off-completion gate and no review-coverage gate any more: an unsigned unit
refuses nothing, and standards review is guidance a named reviewer takes on its own initiative, not something
`signal-back` checks for.

### Chat / intake

| Role               | Operation item                          | Happy                                                                    | Sad                                                                 |
|--------------------|-----------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------|
| **ChaosWhisperer** | the plan item (seeded `in_progress`, locked) | Authors flows/observables/contracts/`packagesAffected` — never `operations`; at Start Quest `questBuildRelayGraphBroker` force-marks the plan item `complete` AND derives the `codeweaver` items themselves. | No execution sad path. The approval gate rejects `approved`/`flows_approved`/`design_approved` only for empty `flows`; it demands no ledger item. |
| **BugHunt**        | the plan item (seeded `in_progress`, locked) | Captures the reproduction flow (one flow per bug, `ACTUAL:`/`EXPECTED:` terminal fork) and its observables; force-completed at Start exactly like ChaosWhisperer. Implementation lands on the same derived `codeweaver` items a feature quest gets. | No execution sad path.                                            |
| **Glyphsmith**     | (optional design phase)                 | Walks `approved → design_approved`; its plan item is force-completed at Start like ChaosWhisperer. | —                                                                  |

### Implementation

| Role           | Locked? | Happy (`done`)                                                    | Sad                                                                                                             |
|----------------|---------|--------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Codeweaver** | No (DERIVED at Start, `fanOutBy: 'implementation'`, one item PER (PACKAGE, FLOW) CELL) | operation `complete`, work item `complete`, advance → next operation, once its own `codeweaver-reviewer`'s `NEXT:` line reads `pass` | `blocked` on an environment wall its reviewer names `wall` (§ (d)). Its own prompt never signals `partial` — the loop inside the session is unbounded and keyed to the reviewer's `rework` verdict instead — though the responder still applies `partial` generically to any code-changing role if one were ever sent, unbounded here because the item is unlocked |

### Verify (feature and bug-hunt tail alike; flowrider and siegemaster, both operators)

Each is a **locked** operation item, keyed on role + base text — `flowrider` and `siegemaster` each hold one tail item
PER FLOW (its text carries the flow id), so each flow gets its own budget. The continuation (were `partial` ever sent)
carries the same `flowIds`.

Both are **operators** and signal on their own reviewer's verdict, never on whether a pass changed code, and neither
gates `done` on sign-off completeness. Each asks ONE question and answers only its own:

- **`flowrider` — is this flow proven by a test, in the browser and below it?** Its scope is the ONE flow its item
  names. It reads the implementation to learn the exact value each unit claims, chooses a LAYER per unit (Playwright
  in a real browser, or an integration/unit test below it), briefs sub-agents to author the suite, reads the diff, then
  summons a `flowrider-reviewer` — the only writer of `flowriderSignoff` on that flow, because the session that wrote a
  test is not the one that certifies it bites.
- **`siegemaster` — does it hold when a human drives the real system, and can I break it?** Its scope is the ONE flow
  its item names, runtime or operational, plus the SEVEN off-map breakage families it owns: `re-entry`,
  `concurrency`, `interruption`, `staleness`, `configuration`, `hostile-input`, `perf`. `hostile-input` is where this
  quest's security is established and `perf` is where its performance is measured, both off the running system. It
  starts a dev server and owns it for the session, loops `siegemaster-walker` (drive one path, report what broke) and
  fixer sub-agents (repair what the walker found) until a walk comes back clean, then summons a `siegemaster-reviewer`
  to grade the repairs before signing `siegemasterSignoff`.

| Role             | Happy (`done`)                                                                                            | Sad (`blocked`)                                                                       |
|------------------|------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| **Flowrider**    | advance → the next `flowrider` item, or `siegemaster` on the last one, once its `flowrider-reviewer` says `pass` | environment wall its reviewer names `wall`; § (d) |
| **Siegemaster**  | advance → the next `siegemaster` item, or `ward(full)` on the last one, once its `siegemaster-reviewer` says `pass` | environment wall its reviewer names `wall`; § (d) |

**`unconfirmable` is not a failure.** A unit no session of that role could ever settle is signed `unconfirmable` with
its question, and the pass moves on — nothing about that verdict blocks `done`.

### The three verification tracks

Every verification unit — each terminal, each labelled branch, each observable, and each off-map probe family — carries
THREE independent top-level sign-offs:

| Field | Written by | Answers |
|---|---|---|
| `codeweaverSignoff` | the `codeweaver-reviewer` that grades a codeweaver pass | is this proven by a unit test beside the code? |
| `flowriderSignoff` | the `flowrider-reviewer` that grades a flowrider pass | is this proven by a flow-perspective test, in the browser or below it? |
| `siegemasterSignoff` | the `siegemaster-reviewer` that grades a siegemaster pass | does this hold when a person drives the real system? |

Each is `{ verdict, evidence, question?, workItemId, at }` and each `verdict` is one of exactly TWO values:

- **`confirmed`** — the test `file:line` PLUS what makes that test fail (codeweaver/flowrider), or the value measured
  off the running system (siegemaster).
- **`unconfirmable`** — genuinely unable to settle it after real effort. `evidence` says what was tried; a `question`
  is REQUIRED and the contract refuses the verdict without one.

**An unsigned unit refuses nothing, and there is no gate that counts sign-offs.** What gets marked is what somebody
actually proved — leave a unit you did not reach unsigned rather than reaching for a verdict that closes it. There are
THREE fields (`signoffTrackContract`) and THREE denominators (`signoffDenominatorTrackContract`) — `codeweaver |
flowrider | siegemaster` — kept as separate enums on purpose even though they hold the same three names today: a
denominator that shares another track's field is representable, and the day one lands the two lists diverge.
`signoffTrackEligibilityStatics.byTrack` decides which units each denominator could ever have signed: `codeweaver` and
`siegemaster` cover both `runtime` and `operational` flows, `flowrider` covers `runtime` flows only; only `siegemaster`
carries `off-map` in its `unitKinds`; every track excludes observables whose `addedBy` postdates it (`flowrider` and
`codeweaver` both exclude `addedBy: 'siegemaster'`, since siegemaster runs strictly after them). Every track shares
`packageScope: 'intersection'` (an item owns every unit whose owning node tags any of its packages) and
`flowScope: 'declared'` (an item is measured on the flows it names).

**A measured defect is a NEW observable, not a third verdict.** An observable is a positive expectation; "send it
`bleh` and the server crashes instead of returning 400" is the INVERSE expectation, so it is ADDED to the flow through
the additive spec authority every operator holds, and then carries its own three sign-offs. There is no `defect`,
`deferred`, `gap` or `recorded` verdict.

**Provenance is a separate axis.** `addedBy` on the observable (`spec | chaoswhisperer | codeweaver | flowrider |
siegemaster | operator`) answers "was this in the spec at approval, or added mid-quest, and by whom" — never whether
the unit is settled.

**Sign-offs are written via `modify-quest`, batched.** One call patches `{ id, <track>Signoff }` on many elements at
once — observables, nodes, edges, and `offMapSignoffs` entries (whose `id` IS the probe family).

`get-qa-checklist({ questId, operationItemId })` derives the whole scope — the track, the flows, the packages — from
the operation item itself, through `operationSignoffScopeTransformer`; `operationItemId` and a bare `flowId` (an
un-scoped browse form) are mutually exclusive. That id is the only argument a caller needs, and it is the same
derivation any completion-adjacent reasoning would use, so the number a session reads about its own scope cannot drift
from the number anyone else computes for it.

### The reset lever

`reset-flow-signoffs({ questId, workItemId, flowId, reason })` clears **`siegemasterSignoff`** across ONE flow and
appends a `walk-reset` note to `quest.planningNotes.questNotes`. It throws unless the calling work item's own linked
operation item has `role: 'siegemaster'` and names that flow in its own `flowIds`. **`flowriderSignoff` and
`codeweaverSignoff` are untouched by it** — there is no equivalent reset lever for either of those tracks.

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
|----------------|-------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| **Riftcarver** | exit code   | `quest-run-riftcarver-broker` marks the carve work item `complete` + the riftcarver operation item `complete`, advance → the first `codeweaver` | routed by FAILURE CLASS, not by one rule: `repairable` (node_modules / build) with budget left → work item `failed` (`errorMessage: riftcarver_<step>_failed`), operation `complete`, then a **spiritmender** + a **fresh `pt N` riftcarver** spliced after it; `repairable` with the budget spent, `git-state` (base_branch / create), or a permission-denied error at ANY step → `quest-block-on-failure-broker` |
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
|------------------|---------|----------------------------------------------------------|-------------------------------------------------------------------------------------|
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
already-terminal work item is a no-op (it will not mint a second `pt N`). **This mechanism applies to any
code-changing role that sends `partial`, but the three operator roles' own prompts never do** — see
"Operator session" in Core concepts.

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

Riftcarver, like ward, runs no operator session and writes no code, so no standards review is owed for it — and
neither reaches `signal-back` at all, so neither is bound by the commit-before-signal gate below.

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

An operator reaches this route when its own named reviewer's `NEXT:` line reads `wall` — an environment block, never a
scope judgement call. A role's `[WALL]` operating rule sends it to `operationStatus: 'blocked'`.

### (e) dirty worktree → signal REFUSED — the commit-before-signal gate

This is the ONLY gate `signal-back` runs. It runs BEFORE any mutation, so a refusal persists NOTHING: the work item
stays `in_progress`, the operation item stays as it was, and the session commits what the message names and signals
again. That is why the refusal is a THROW rather than a returned error — it rides the awaited `signal-back` path back
through the MCP tool to the agent, where it is visible and actionable, instead of being swallowed as a success.

It binds every role that changes code: the three operator roles plus `spiritmender` and `warpgate`
(`agentPromptClassificationStatics.operatorRoleNames` plus those two, read as data rather than listed at the call
site, so a fourth operator role is covered the day it is added). It applies on **`done`, `partial` AND `blocked`
alike** — a blocked quest hands its work forward through git exactly as a finished one does, so the outcome that halts
is the one that most needs the work durable first. The measurement is `gitWorkingTreeFilesBroker`, which unions `git
diff HEAD --name-only` with `git ls-files --others --exclude-standard`: a bare diff reports TRACKED paths only, so the
net-new files a sub-agent just wrote — the ones most likely to carry the defect — would be invisible to it and a dirty
tree would read as clean. The question is **"is the tree clean", never "did you make a commit"**: `git commit
--allow-empty` satisfies it, so a pass that legitimately changed nothing still signals. A quest whose cwd does not
resolve to a worktree (hydrated, or seeded before worktrees) SKIPS the check rather than failing it, and for a role
outside the set no git command runs at all.

**The gate is satisfied by construction, not by the operator's own commit.** Each operator's own named reviewer is the
one session on the pass that commits, so a dirty tree at signal time is scratch a sub-agent left behind, or work that
reviewer did not commit — the operator itself never commits and so cannot clear the gate by committing. Its own
recording step instead reads `git status` and hands every listed path to one more reviewer sub-agent on a sweep brief,
which opens each path, discards scratch, keeps what is real, and commits what survives.

This is a computed gate rather than a line in the operating rules because the prose version was measured and found
wanting: a session died ONE gate short of its commit holding a fully verified, twice-green artifact, the re-carve
destroyed it, and that slice cost 101 minutes of wall-clock for 11 minutes of real work with nothing in `quest.json`
to say any of it happened.

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
- **REL-6 — Duplicate-on-partial.** `partial` → operation `complete` + a `pt N` continuation → a fresh work item,
  applied by the responder generically to any code-changing role. A locked role's chain is bounded by
  `slotManagerStatics.<role>.maxAttempts`; an unlocked codeweaver item's chain is unbounded. `codeweaver`, `flowrider`
  and `siegemaster` signal `done` only once their OWN named reviewer's verdict says `pass` — sign-off completeness on
  `codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff` is never checked by any gate.
- **REL-6d — Commit-before-signal.** For any role that changes code (the three operator roles plus `spiritmender`
  and `warpgate`), `signal-back` THROWS while the quest worktree carries uncommitted changes — **on `done`, `partial`
  AND `blocked` alike**, and nothing is persisted on the refusal. The measurement unions `git diff HEAD --name-only`
  with `git ls-files --others --exclude-standard`, so a net-new untracked file counts. It asks whether the TREE IS
  CLEAN, never whether a commit was made: `git commit --allow-empty` satisfies it. A quest whose cwd does not resolve
  to a worktree SKIPS the check rather than failing it, and no git command runs for a role outside that set. **This is
  the ONLY gate `signal-back` runs** — there is no separate sign-off-completion gate and no review-coverage gate.
- **REL-6a — The two verify tracks are independent.** `flowriderSignoff` and `siegemasterSignoff` gate different
  operation items, and writing one never advances the other's gate — and neither gates `done` at all, since an
  operator signals off its own reviewer's verdict. There is no aggregate per-unit status: a unit signed by one track
  and not the other is a normal mid-quest state.
- **REL-6b — A reset clears one track on one flow.** `reset-flow-signoffs` removes `siegemasterSignoff` from every
  unit of the named flow, leaves `flowriderSignoff`, `codeweaverSignoff`, and every other flow untouched, and appends
  a `walk-reset` `questNotes` entry. It consumes no pt-chain attempt.
- **REL-6c — A note never closes a unit.** A `questNotes` entry of any `kind` leaves every track's sign-off state
  unchanged; only a sign-off shrinks the remaining set.
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
        items (fanOutBy: 'implementation', one per (package, flow) cell) + mints the verify tail (locked, pending),
        force-completes the plan item, creates the first work item — the riftcarver
        approved → in_progress   (milliseconds: no spawn, no git, no build)
[DISPATCHER] Node/UI play button (or /dumpster-launch)
   ▼ riftcarver       [run-riftcarver]  → green → advance     (base branch → git worktree add → pin
                                                               baseRef → mirror node_modules → preflight
                                                               build; streams live, log persisted to
                                                               riftcarver-results/<id>.log)
   ▼ codeweaver ×N (one session per cell)      → done → advance   (reads code, briefs sub-agents, one
                                                                    codeweaver-reviewer, sign codeweaverSignoff)
   ▼ ward (changed)   [run-ward]        → green → advance
   ▼ flowrider (one session per flow)   → done → advance     (reads code, briefs test-writing sub-agents,
                                                              one flowrider-reviewer, sign flowriderSignoff)
   ▼ siegemaster (one session per flow) → done → advance     (owns a dev server, loops a siegemaster-walker
                                                              + fixer sub-agents, one siegemaster-reviewer,
                                                              sign siegemasterSignoff)
   ▼ ward (full)      [run-ward]        → green → advance
   No pending operation item remains → workItemsToQuestStatusTransformer derives complete ✓
The dispatcher's next get-next-step picks up the next FIFO quest.

Every "one session" above is, at most, an UNBOUNDED loop inside that one session:
   read code/git → brief generic sub-agents → read the diff → summon the role's own named reviewer
         → NEXT: pass (signal done) | rework (loop again) | wall (signal blocked)
   …then signal-back, which refuses only on a dirty worktree — no sign-off-completeness gate, no
   review-coverage gate.
```

**Nothing is interleaved into the diagram at run time.** The ledger a quest starts with is the one it runs, plus `pt N`
continuations and the ward/riftcarver splices. Standards review is inside each session's own named reviewer, before
that reviewer's own commit — not a step between two sessions, and nothing about it is recorded in `quest.json`.

Sad-path insertions that keep the quest `in_progress`: a red ward inserts `spiritmender → fresh ward`; a REPAIRABLE
riftcarver red (node_modules or build) inserts `spiritmender → pt N riftcarver`, and the pt N skips the git steps it
can see are already done while re-running the build; a server crash resumes the in-flight session. The routes that
reach `blocked` are an exhausted bounded loop (ward-retry, riftcarver-retry, or orphan recovery), an agent-reported
environment wall, and a riftcarver `git-state` or permission failure.
