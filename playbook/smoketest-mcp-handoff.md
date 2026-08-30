# Smoke Test (MCP Orchestration) — Session Handoff

Running-state handoff for sessions driving `playbook/smoketest-mcp-orchestration.md`. That playbook is a surgical
state-machine probe of the operations relay: you play the dispatcher, seed quest state on disk, call the MCP, assert the
`quest.json` mutation and the live web execution view. Keep a per-probe findings log at `/tmp/smoke-mcp-notes.md` (may
not survive a reboot — the essentials belong here).

Companion model reference: `playbook/quest-lifecycle.md` (create → spec → Start → operations relay). Shared fix/bug
process: `playbook/smoketest-orchastrator.md`.

## What the MCP smoke test validates

The operations relay end to end, one agent session at a time — IDENTICAL for `feature` and `bug-hunt` quests except the
intake role:

```
riftcarver → codeweaver ×N (one session per PACKAGE, DERIVED at Start) → ward(changed)
  → flowrider ×N (one session per FLOW) → siegemaster ×N (one session per flow, in declaration order)
  → ward(full)
  → quest derives complete
```

`codeweaver`, `flowrider` and `siegemaster` are **operators** (`agentPromptClassificationStatics.operatorRoleNames`),
each running on **opus**: it reads code itself, briefs GENERIC `general-purpose` sub-agents in its own words to make the
edits, reads the diff itself, then summons exactly ONE named sonnet reviewer sub-agent —
`codeweaver-reviewer`/`flowrider-reviewer`/`siegemaster-reviewer` — to grade the pass (siegemaster also dispatches
`siegemaster-walker`, one at a time, to drive the flow by hand). The operator's own signal table offers only `done` and
`blocked`; the session loops, unbounded, until its own reviewer's `NEXT:` line reads `pass`.

plus the three non-failure "sad" paths and the sole block path:

- **partial → pt N (mechanism-only for the three operators)** — the responder still applies `operationStatus:
  'partial'` generically to any code-changing role: it marks the operation item `complete` and appends a
  `"pt N: {text}"` continuation; a fresh work item runs it. For `ward` this is the verify fixpoint: a `pt N` chain
  converging on a green run. `codeweaver`/`flowrider`/`siegemaster`'s own prompts never send `partial` — each signals
  only `done` (its own named reviewer said `pass`) or `blocked` (its reviewer named an environment wall).
- **ward red → spiritmender → re-ward** — a red ward marks its work item `failed` + its operation item `complete`, then
  appends a `spiritmender` operation item + a fresh ward (`pt N`, same `wardMode`); the spiritmender runs before the
  re-ward (never two wards back-to-back).
- **orphan → resume** — an `in_progress` work item observed during a scan flips back to `pending` keeping
  `sessionId`/`agentId` + a `resume` marker; Node/UI dispatch resumes the session (`claude --resume`). No duplicate work
  item (strict 1:1).
- **blocked** — the sole block path (`quest-block-on-failure-broker`), reached only from a spent bounded loop
  (ward-retry, riftcarver-retry, a locked role's `pt N` chain, or orphan-recovery exhaustion) or an agent-reported
  environment wall. Drains pending work items to `skipped`, sets `blocked`; the user resumes.

**There is exactly ONE computed gate on `signal-back`: commit-before-signal.** No sign-off-completeness gate, no
review-coverage gate — an unsigned `codeweaverSignoff`/`flowriderSignoff`/`siegemasterSignoff` refuses nothing, and the
five standards concerns a named reviewer takes are guidance only, recorded nowhere in `quest.json`.

## Operational discipline (learned the hard way — still true)

- **`run-ward`/`run-riftcarver`'s MCP argument is `mode`, NOT `wardMode`.** The work-item/operation-item field is
  spelled `wardMode`, but the tool arg is `mode`. Passing `wardMode` errors `Unrecognized key(s): wardMode` and the ward
  never runs.
- **One logical step per turn; act only on echoed ids.** Drive strictly off the `questId`/`workItemId` the immediately
  preceding tool result returned — never one retyped from a seed array or memory. Batching a pipeline against a guessed
  id makes the first scratch command fail and cancels the whole batch.
- **Dispatch exactly what a single `get-next-step()` returns, then wait for it to land before calling `get-next-step()`
  again.** The relay hands you one session at a time; you never run ahead of it. A ready command dispatches alone via
  `run-ward`/`run-riftcarver`.
- **`signal-back` carries the outcome, not a failure.** `signal: 'complete'` is the sole kind; the outcome is
  `operationStatus: 'done' | 'partial' | 'blocked'` (`failed` is rejected). The handler applies it server-side — a stub
  cannot "forget" to patch the ledger because agents never write it. A stub sending `partial` for `codeweaver` /
  `flowrider` / `siegemaster` is testing the responder's generic mechanism, not real prompt behavior — those three
  roles' own prompts never choose it.
- **Before each flow, abandon all other non-terminal quests** (`modify-quest status: 'abandoned'`) — `get-next-step` is
  FIFO-oldest, so a stale `in_progress` quest steals dispatch.
- **A direct `quest.json` disk seed** fires no outbox event, so the web reflects it only via the ~3s fallback poll; MCP
  `get-next-step` reads disk fresh immediately. MCP-driven mutations go through `questPersistBroker` → outbox → web,
  near-instant.
- **Flowrider and Siegemaster each fan out to ONE OPERATION ITEM PER FLOW** — when hand-seeding, never construct a
  single flowrider item covering every quest flow; that shape belonged to an earlier design and no longer exists.

## Build-vs-MCP gotcha (documented in `packages/mcp/CLAUDE.md` + the playbook §1)

`npm run build` overwrites `packages/mcp/dist`, which the running MCP stdio child loaded at boot → the child dies and the
`mcp__dungeonmaster__*` tools drop. After ANY rebuild, `/mcp` → reconnect dungeonmaster before resuming MCP-driven
probes. Any fix to orchestrator/MCP code only takes effect after a rebuild AND an MCP reconnect. Batch source fixes so
you rebuild + reconnect once.

## How to resume (next session)

1. Read `playbook/smoketest-mcp-orchestration.md` (procedure) + `playbook/quest-lifecycle.md` (model) + this file.
2. **Setup (§1):** `npm run prod:kill`; wipe quests
   (`rm -rf .dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests`); `npm run build`; `npm run prod`
   (server 4800 / web 4801). Open a fresh browser tab on `http://dungeonmaster.localhost:4801/codex/quest/<id>`.
3. The dungeonmaster MCP child runs the orchestrator **in-process** — `signal-back`/`run-ward`/`run-riftcarver`/
   `get-next-step`/advance status derivation happens there, NOT in the prod server. After ANY rebuild, `/mcp` →
   reconnect.
4. **Seeding rules** (per `quest-lifecycle.md` §14): every work item carries exactly one `operations/<id>` link to an
   `operations[]` item that exists on the quest; each operation item is worked by exactly one work item (strict 1:1);
   work-item `id` + `dependsOn` entries are UUIDs; `dependsOn` between work items is the only ordering mechanism; a ready
   ward or riftcarver item dispatches via its own MCP tool alone; use an `operational` flow for siegemaster runtime
   seeds to avoid a dev server.
5. Stub-agent recipe: a real `Task()` that calls `get-agent-prompt` then `signal-back` (a real Task is required for
   identity resolution via `_meta.claudecode/toolUseId` → `subagents/agent-*.jsonl`). Dispatch with `model: sonnet`.

## Testbed state

- Branch: whatever branch this session is on — check `git branch --show-current` before seeding, since quest ids and
  worktree paths are branch-relative.
- prod may be running on 4800/4801 (the §1 kill+restart handles it).
- Wipe leftover quests under the codex guild in §1 before the first flow.
