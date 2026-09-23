# Smoke Test (MCP Orchestration) — Session Handoff

Running-state handoff for sessions driving `playbook/smoketest-mcp-orchestration.md`. That playbook is a surgical
state-machine probe of the family graph + step graph: you play the dispatcher, seed quest state on disk, call the
MCP, assert the `quest.json` mutation and the live web execution view. Keep a per-probe findings log at
`/tmp/smoke-mcp-notes.md` (may not survive a reboot — the essentials belong here).

Companion model reference: `playbook/quest-lifecycle.md` (create → spec → Start → the family/step relay) and
`docs/quest-role-paths.md` (the deep reference — every family's step table, the router's rules, the invariants).
Shared fix/bug process: `playbook/smoketest-orchastrator.md`.

## What the MCP smoke test validates

The relay end to end — IDENTICAL for `feature` and `bug-hunt` quests except the intake role:

```
riftcarver (ONE scope)
  → codeweaver ×N (one scope per PACKAGE×FLOW cell)
  → flowrider ×N (one scope per RUNTIME flow)
  → siegemaster ×N (one scope per flow)
  → wardFull (ONE scope)
  → quest derives complete
```

Inside each scope a STEP GRAPH runs its own sessions one at a time (or, for a parallel step, several sessions of that
SAME step at once — never two different steps or two different families together). `codeweaver` is
`plan → work → review → commit → ward`; `flowrider` is the same shape plus an on-request `recipe` step; `siegemaster`
is `sweepIn → plan → happyWalk ⇄ fixHappy → adversarial ⇄ fixAdversarial → commit → ward → sweepOut`, plus on-request
`recipe`/`read` steps. **Every step is an ordinary router-dispatched session — there is no briefing layer above a
step and no sub-agent it dispatches to do its own edit or its own grading.** `get-agent-prompt` resolves a step's
prompt directly off `agentFlowStatics[family].steps[step].prompt` (`codeweaver-worker`, `codeweaver-reviewer`,
`siege-happy-walker`, …); there is no role-level prompt for `codeweaver`/`flowrider`/`siegemaster` themselves.

**`ward` and `carve`/`repair`/`commit`/`cleanup` are `deterministic` steps — code, not a session — and MCP mode has
NO tool that can dispatch one for a current-model quest.** `get-next-step` returns `{ type: 'run-step', handler,
args }` for these; only Node/UI mode's dispatcher runs a `run-step`. The `run-ward`/`run-riftcarver` MCP tools still
exist, but they take no scope argument and only fire for a work item with NO step node at all (a hydrated or
pre-step-graph quest) — for a normal quest built by today's seed, they are unreachable. **This playbook can drive
`prompt` steps by hand (stub `Task()` + `quest-work` + `signal-back`); it cannot drive a `deterministic` step by
hand — those need the real Node/UI dispatcher running, observed through `quest.json` and the web UI.**

plus the three non-failure "sad" paths and the sole block path:

- **`unmet` → a re-cut batch** — a step that leaves units unsettled does not fail; the router mints a fresh batch of
  work items on the SAME scope, scoped to exactly those units, grouped by the piece that originally claimed them. No
  new operation item is appended — this is work items on the scope that is already open.
- **a red gate → `repair` → the gate re-runs** — `ward`'s (or `carve`'s) `unmet` routes to `repair`, which declares
  no `done` route and so returns to the gate that minted it; a repair that comes back `done` takes the gate's own
  `done` edge onward. Bounded by that step's own `maxVisits`.
- **orphan → resume** — an `in_progress` work item observed during a scan flips back to `pending` keeping
  `sessionId`/`agentId` + a `resume` marker; Node/UI dispatch resumes the session (`claude --resume`).
- **`wall` → `@blocked`** — the sole block path (`quest-block-on-failure-broker`), reached from the router routing an
  outcome to `@blocked` (`wall`, `max-visits`, `unknown-step`/`unknown-route-target`, `no-minter`) or from
  orphan-recovery exhaustion. Drains pending work items to `skipped`, sets `blocked`; the user resumes.

**Marks, not sign-offs.** A session records what it measured through `quest-work`'s `observations` payload — an
array of `{ unitId, mark: 'met' | 'cant-meet' | 'unmet', evidence, toSettle? }` — BEFORE it ever calls `signal-back`.
`signal-back` itself carries only `{ questId, workItemId, signal: 'complete', operationItemId?, blockedReason? }` —
there is no `operationStatus`, no `partial`, and no `pt N` continuation in the current model. **One gate refuses the
call outright: the unmarked-unit gate** — `signal-back`/`quest-work` throws while any of the work item's
`assignedUnitIds` carries no observation. There is no separate sign-off-completeness gate, and no
`codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff` field anywhere — those are retired; `workItem.
observations[]` IS the record.

## Operational discipline (learned the hard way — still true)

- **One logical step per turn; act only on echoed ids.** Drive strictly off the `questId`/`workItemId` the
  immediately preceding tool result returned — never one retyped from a seed array or memory.
- **Dispatch exactly what a single `get-next-step()` returns, then wait for it to land before calling
  `get-next-step()` again.** A batch may hold several work items when they share one role AND one step (a parallel
  step); it never mixes steps or families.
- **A stub agent's job is `get-agent-prompt` → mark its assigned units via `quest-work` → `signal-back`.** It must
  NOT skip the marking step — `signal-back` throws if any assigned unit is unmarked.
- **Before each flow, abandon all other non-terminal quests** (`modify-quest status: 'abandoned'`) — `get-next-step`
  is FIFO-oldest, so a stale `in_progress` quest steals dispatch.
- **A direct `quest.json` disk seed** fires no outbox event, so the web reflects it only via the ~3s fallback poll;
  MCP `get-next-step` reads disk fresh immediately. MCP-driven mutations go through the outbox and reach the web
  near-instant.
- **`flowrider` and `siegemaster` each fan out to ONE SCOPE PER FLOW** — when hand-seeding, never construct a single
  scope covering every quest flow.

## Build-vs-MCP gotcha (documented in `packages/mcp/CLAUDE.md` + the playbook §1)

`npm run build` overwrites `packages/mcp/dist`, which the running MCP stdio child loaded at boot → the child dies and
the `mcp__dungeonmaster__*` tools drop. After ANY rebuild, `/mcp` → reconnect dungeonmaster before resuming
MCP-driven probes. Any fix to orchestrator/MCP code only takes effect after a rebuild AND an MCP reconnect. Batch
source fixes so you rebuild + reconnect once.

## How to resume (next session)

1. Read `playbook/smoketest-mcp-orchestration.md` (procedure) + `playbook/quest-lifecycle.md` (model) + this file.
2. **Setup (§1):** `npm run prod:kill`; wipe quests
   (`rm -rf .dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests`); `npm run build`; `npm run prod`
   (server 4800 / web 4801). Open a fresh browser tab on `http://dungeonmaster.localhost:4801/codex/quest/<id>`.
3. The dungeonmaster MCP child runs the orchestrator **in-process** — `quest-work`/`signal-back`/`get-next-step`/
   advance/route happen there, NOT in the prod server. After ANY rebuild, `/mcp` → reconnect.
4. **Seeding rules:** every work item carries exactly one `operations/<id>` link to an `operations[]` item that
   exists on the quest, and a `step` field naming a real step of its family's `agentFlowStatics` graph;
   `dependsOn` between work items is the only ordering mechanism. `get-agent-prompt` serves siegemaster no
   dev-server config at all, so either flow type is safe to seed.
5. Stub-agent recipe: a real `Task()` that calls `get-agent-prompt`, then `quest-work` to mark every assigned unit,
   then `signal-back` (a real Task is required for identity resolution via `_meta.claudecode/toolUseId` →
   `subagents/agent-*.jsonl`). Dispatch with `model: sonnet`.

## Testbed state

- Branch: whatever branch this session is on — check `git branch --show-current` before seeding, since quest ids and
  worktree paths are branch-relative.
- prod may be running on 4800/4801 (the §1 kill+restart handles it).
- Wipe leftover quests under the codex guild in §1 before the first flow.
