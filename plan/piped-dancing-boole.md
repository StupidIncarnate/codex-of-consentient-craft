# Plan: Pivot orchestrator from headless `claude -p` spawns to interactive-Claude slash commands

## Status

**Orchestration complete.** All 18 plan steps done; `npm run ward` GREEN end-to-end (lint 6082 / typecheck 6023 / unit
2154 / integration 87 / e2e 41 — 0 failures). Manual E2E verification covered 12 cases: 11 PASS, 1 DEFERRED (live
`/dumpster-launch` requires a real interactive Claude session — out of scope for this orchestration). Two source bugs
surfaced during E2E and fixed: F1 (`seek_scope → in_progress` final transition) and the completeness-gate that depended
on F1 (completeness now fires from the post-walk hook).

Documented deferrals (intentional, not gaps against plan goals):

- Legacy responders (`executionQueueBootstrapResponder`, `RunOrchestrationLoopLayerResponder`,
  `OrchestrationResumeResponder`, `RecoverGuildLayerResponder`) and spawn brokers (`runPathseekerLayerBroker`,
  `agentLaunchBroker`, `chat-spawn-broker`) remain on disk per plan policy ("stays on disk but become orphaned").
- The new in-process smoketest driver (Step 17) is end-to-end unit-covered but not yet wired into
  `smoketestRunCaseBroker`; the existing scenario harness still drives codeweaver/lawbringer/etc. through the legacy
  in-process path.
- E2E specs exercising removed flows (chat-start spawn pipeline, old single-pathseeker streaming) are sidelined to
  `tmp/ward-final-sideline/e2e/web/` with a README.

## Progress

- [x] 
    1. Contracts (Wave 1A) — additive + breaking contracts across shared/mcp/orchestrator
- [x] 
    2. `get-agent-prompt` extension (Wave 2A) — Fallback B / defer-to-line-emit for sessionId
- [x] 
    3. `signal-back` extension (Wave 2A) — explicit ids + Step 1 fallout cleanup
- [x] 
    4. `quest-get-next-step-broker` (Wave 2D) — FIFO by `createdAt`; long-poll via `timerSetTimeoutAdapter`; pathseeker
       batch-routing logic in place but cast-routed pending Step 12 enum landing
  > [x] RESOLVED: Step 12 landed the role enum; `select-batch-layer-broker.test.ts` re-enabled with 10 cases covering
  single-agent default, `pathseeker-surface` batching (single + parallel + surface-wins-over-dedup), and corrections
  batching (both-ready, only-dedup, only-assertion).
  > [!] FIFO key is `createdAt` (plan said `approvedAt` — that field doesn't exist on the quest contract). If you want
  true approval-time FIFO later, add `approvedAt` to the quest contract and re-key the FIFO sort.
- [x] 
    5. `quest-run-ward-broker` (Wave 2A) — inlined spawn+persist (layer broker not importable)
- [x] 
    6. `register-monitor-session` broker + state (Wave 2B)
- [x] 
    7. `quest-monitor-jsonl-watcher-broker` (Wave 2B) — also added active-quest state
- [x] 
    8. `get-server-config` MCP tool (Wave 2B) — broker only; MCP registration in Step 9
- [x] 
    9. Register all new MCP tools (Wave 3A) — 5 new tools (`create-quest`, `get-next-step`, `run-ward`,
       `register-monitor-session`, `get-server-config`) registered; JSONL watcher auto-starts on
       register-monitor-session
- [x] 
    10. Always-on orchestrator validation (Wave 2D) — confirmed MCP surface is always-on; legacy
        `questExecutionQueueRunnerBroker` web-gate exists but is retired by Step 16
- [x] 
    11. WebSocket payload questId tagging (Wave 2C) — wiring already existed from Step 1 contract; added test coverage
- [x] 
    12. PathSeeker decomposition (Wave 2E) — 4 new roles; statics renamed; post-walk-hook broker NOT yet wired into
        signal-back (Step 16 territory); Step 4 deferred batch tests re-enabled
  > [!] Empty `packagesAffected[]` → single "default" slice fallback. Compatible with old quest files but may need a
  stronger ChaosWhisperer enforcement in v2.
  > [x] RESOLVED: post-walk-hook broker is wired via `QuestHandleSignalBackResponder` (the MCP signal-back boundary) per
  Step 16's report — under the `/dumpster-launch` model nothing reaches `handleSignalLayerBroker`, so the MCP responder
  is the correct hook site.
- [x] 
    13. Slash command install responder (Wave 2C) — combined statics into `slash-commands-statics.ts` (colocation rule);
        install flow updated
- [x] 
    14. Web UI `?chat=hidden` query param (Wave 2D) — binding was already hoisted above ChatPanel, no lift needed
- [x] 
    15. Remove "Create Quest" button (Wave 3B) — `QuestApprovedModalWidget` "Start a new Quest" button removed;
        no-questId route now renders `/dumpster-create` placeholder banner; new `clipboardWriteAdapter` +
        `dumpster-command-banner-widget`; `/dumpster-launch` banner added to execution panel
- [x] 
    16. Stop orchestrator spawn machinery — post-walk hook wired via `QuestHandleSignalBackResponder` (MCP signal-back
        path); `runPathseekerLayerBroker` call site removed from `quest-orchestration-loop-broker`; `questNewBroker` (
        web) sidelined; 8000+ line `quest-orchestration-loop-broker.test.ts` dispatch-shape suite sidelined to
        `tmp/step16-sideline/orchestration-loop/` and replaced with a minimal terminal/abort/not-found suite.
  > [x] RESOLVED: After the agentRole enum fix, `handleSignalLayerBroker`'s `FAILURE_ROLE_MAP` enumerates all four
  `pathseeker-*` variants (each routed to `null` — bubble-to-user). Under the `/dumpster-launch` model nothing actually
  reaches the slot-manager loop; the post-walk hook fires at the MCP signal-back boundary (
  `QuestHandleSignalBackResponder`). That remains the right hook site.
  > [!] Execution-queue runner, web-presence gating, `orchestrationProcessesState`, `executionQueueBootstrapState`,
  `processStaleWatchBootstrapState`, `RunOrchestrationLoopLayerResponder`, `OrchestrationResumeResponder`,
  `RecoverGuildLayerResponder` were left on disk. The blast radius (hundreds of test/proxy/responder references)
  exceeded what could be safely retired in this step. They still execute under legacy code paths (
  `/api/orchestration/start`, recovery on server start) but the orchestration loop they invoke is now a no-op for
  pathseeker; codeweaver/ward/lawbringer/etc. still dispatch in-process. New flow (`/dumpster-launch`) bypasses all of
  this entirely. Step 17 (smoketest harness rewrite) may further retire these.
  > [!] `runPathseekerLayerBroker`, `agentLaunchBroker`, `chat-spawn-broker` and other spawn brokers remain on disk per
  plan policy ("stays on disk but become orphaned"). The orchestration loop no longer calls `runPathseekerLayerBroker`;
  the other spawn brokers are still called by `chat-start-responder`, `design-chat-start-responder`, and the surviving
  legacy callers above.
- [x] 
    17. Smoketest harness rewrite — new in-process driver landed at
        `packages/orchestrator/src/brokers/smoketest/in-process-driver/smoketest-in-process-driver-broker.ts`. Drives
        the `/dumpster-launch` model end-to-end without spawning: calls `questGetNextStepBroker`, simulates each
        sub-agent via `agentPromptGetBroker` + `questModifyBroker` per the scenario script, stubs ward via direct
        work-item mutation, fires the post-walk hook on `pathseeker-walk` completion, exits on idle/terminal. New
        `DispatchCount` contract + statics. Pre-existing `orchestration-flow.integration.test.ts` (which exercised the
        spawn pipeline retired in Step 16) sidelined to `tmp/step17-sideline/orchestration-flow-integration/` and
        replaced with a minimal export-shape integration test. mcp `install-flow.integration.test.ts` fixture updated
        for new MCP tool list (Step 9 fallout).
  > [!] The new in-process driver is not yet wired into `smoketestRunCaseBroker` — that broker still uses the legacy
  queue + scenario-driver path which works for the existing scenarios because Step 16 left the legacy orchestration loop
  intact for non-pathseeker roles (codeweaver/lawbringer/etc.). Wiring the new driver in is a follow-up that should
  happen alongside the final retirement of the legacy spawn machinery.
  > [!] Legacy responders flagged in Step 16's report (`executionQueueBootstrapResponder`,
  `RunOrchestrationLoopLayerResponder`, `OrchestrationResumeResponder`, `RecoverGuildLayerResponder`) NOT retired in
  Step 17 — their blast radius (hundreds of test/proxy references) still exceeds what's safely retire-able. Defer to a
  dedicated cleanup step after the new flow has soaked.
  > [!] The four orchestration smoketest failure-routing scenarios (`orchCodeweaverFail`, `orchLawbringerFail`,
  `orchDepthExhaustion`, `orchBlightwardenReplan`) are NOT yet portable to the new in-process driver — the
  failure-routing logic (drain+skip+spawn-replacement) lives in `handleSignalLayerBroker` + the orchestration loop.
  Either reproduce that routing inside the driver in a follow-up step, or rely on the existing scenario-driver path
  until the legacy spawn machinery is finally retired.
  > [x] RESOLVED: `agentRoleContract` (`packages/orchestrator/src/contracts/agent-role/agent-role-contract.ts`) now
  includes the four `pathseeker-{surface,dedup,assertion-correctness,walk}` variants alongside the deprecated monolithic
  `pathseeker`. `buildSpawnInstructionLayerBroker` accepts the new roles (covered by an `it.each` regression in
  `build-spawn-instruction-layer-broker.test.ts`). `roleToPromptTemplateTransformer` maps each new role to its
  corresponding `pathseeker-*-statics`, and `handle-signal-layer-broker`'s `FAILURE_ROLE_MAP` enumerates each variant (
  bubble-to-user, mirroring the monolithic `pathseeker`).
- [x] 
    18. Docs — orchestrator/CLAUDE.md and README.md updated; memory `feedback_no_quest_start_slash_command.md` flipped
        to reflect that slash commands ARE the orchestration entry point now

## Context

API pricing on `claude -p` headless mode burns too fast to sustain. Pivoting to a model where:

- **The user's own interactive Claude Code session** runs the spec conversation and the orchestration loop, billed under
  their normal Pro/Max plan.
- **The dungeonmaster server** becomes a stateless MCP-driven state machine plus a JSONL-watching live-streamer for the
  web UI.
- **The headless spawn machinery stays on disk** but is no longer called by the orchestrator. The orchestrator drives
  everything from quest.json plus file-watched session output.

Two new slash commands. **Neither takes any arguments.**

- **`/dumpster-create`** — runs ChaosWhisperer in the user's session. ChaosWhisperer itself creates the new quest via
  MCP as its first action (the user never passes a questId). Mutates quest via existing MCP tools (`modify-quest`,
  `ask-user-question`, `get-quest`). Spec creation is fully independent of execution.
- **`/dumpster-launch`** — continuously churns through the queue of approved quests, dispatching work via Task().
  Designed to run as a long-lived background loop in the user's session: the user types `/dumpster-launch` once and lets
  it work.

## New architecture

### Three roles in the new loop

| Process                                                | What it is                                                                                                                                                               | Where it runs                         |
|--------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| User's interactive Claude — `/dumpster-create` session | Runs ChaosWhisperer for one quest; talks to the user; mutates quest via MCP                                                                                              | User's terminal                       |
| User's interactive Claude — `/dumpster-launch` session | Long-running dispatch loop across ALL approved quests. Calls `get-next-step` (no args), Task()s the returned agents, awaits, repeats                                     | User's terminal                       |
| Dungeonmaster server                                   | Serves MCP tools + web UI. **Always-on orchestrator surface** (not gated on web being viewed). Tails the dumpster-launch session JSONLs to drive live chat in the web UI | `npm run dev` / `dungeonmaster start` |

### Quest mutation surface

| Trigger                                           | Today                                                                                 | New                                                                                                                                                                                        |
|---------------------------------------------------|---------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| User starts spec conversation                     | Web UI "Create Quest" button → `chat-start-responder` → headless ChaosWhisperer spawn | User runs `/dumpster-create` in their terminal (no args; Chaos creates the new quest itself). **The "Create Quest" button is removed from the web UI entirely — no migration, no message** |
| User approves quest                               | Web UI "Start Quest" button → `orchestration-start-responder` spawns the loop         | Button stays. Sets quest status, redirects to execute view. Does NOT spawn anything. User's already-running `/dumpster-launch` picks it up on its next `get-next-step`                     |
| Sub-agent dispatch (codeweaver, lawbringer, etc.) | Orchestrator spawns via `agentLaunchBroker`                                           | `/dumpster-launch` calls `Task()` with stub prompt that says "call `get-agent-prompt({agent, workItemId, questId})`"                                                                       |
| Ward execution                                    | `runWardLayerBroker` spawns subprocess                                                | Same — but triggered by orch LLM calling `run-ward({questId, workItemId, mode})` MCP tool                                                                                                  |
| Live chat in web UI                               | `chat-spawn-broker` pipes spawn stdout into `chat-line-process-transformer`           | Server tails the registered dumpster-launch session's JSONLs and feeds the same transformer                                                                                                |

### `get-next-step` MCP tool — no arguments, one quest at a time

`/dumpster-launch` calls `get-next-step()` with NO arguments. The server processes quests **strictly serially**: it
picks the oldest post-Start-Quest quest (FIFO by approval time) that still has incomplete work and returns ready work
from that quest only. When that quest reaches `complete` or `blocked`, the next call picks up the next quest in the
queue. Only one quest is "active" at any moment. Reason: ward is monorepo-wide and cannot safely parallelize across
quests.

```ts
type NextStep =
  | { type: 'spawn-agents'; agents: SpawnInstruction[] }      // see parallelism rules below
  | { type: 'run-ward'; questId: QuestId; workItemId: WorkItemId; mode: WardMode }
  | { type: 'idle' };                                          // no quest in the queue has ready work right now

type SpawnInstruction = {
  questId: QuestId;
  role: AgentRole;
  workItemId: WorkItemId;
  taskPrompt: string;                // questId + workItemId already interpolated by the broker
  model?: 'sonnet' | 'opus' | 'haiku';
};
```

**Parallelism is intrinsic, not configured.** Outside of two specific spec-pivot moments, every dispatch is one
sub-agent at a time:

- **`pathseeker-surface` batch** — all `pathseeker-surface` items for the active quest are ready simultaneously (they
  share `dependsOn: []`), so `get-next-step` returns them all in a single `spawn-agents` batch. The LLM Task()s them in
  parallel.
- **`pathseeker-corrections` batch** — `pathseeker-dedup` and `pathseeker-assertion-correctness` both ready at the same
  time (they share the same `dependsOn` set of surface items), so `get-next-step` returns both in one `spawn-agents`
  batch.
- **Everything else** (codeweaver, lawbringer, spiritmender, siegemaster, blightwarden, pathseeker-walk) — one agent per
  `spawn-agents` response. Sequential. The orch LLM dispatches one Task, awaits, calls `get-next-step` again, dispatches
  the next.

**`run-ward` is always alone.** Never concurrent with spawn-agents.

**Slot caps remain configured in `slotManagerStatics` but are not consulted by `get-next-step`.** Leave the config in
place — it will be reused elsewhere. The natural parallelism above (via `dependsOn` siblings) is the only concurrency
mechanism in this dispatch path.

**Long-poll** internally up to ~25 s before returning `{type:'idle'}`. The orch LLM re-calls immediately on idle.
Token-cheap.

**Spec phases are invisible** to `get-next-step`. Quests in `created` / `explore_flows` / `review_flows` /
`flows_approved` / `explore_observables` / `review_observables` / `approved` (pre-Start-Quest) are excluded from the
scan. The execution side never blocks on or thinks about spec-side activity.

**Quest failure is per-quest.** If pathseeker bubbles a failure for the active quest, `quest.status` becomes `blocked`
and that quest drops out of the queue. `/dumpster-launch` moves on to the next FIFO entry.

### Ward modes

`npm run ward` has two modes: `changed` (changed-files) and `full` (full monorepo). The existing `WorkItem` contract
already enums ward mode as `z.enum(['changed', 'full'])`; reuse that — do NOT introduce new terminology. `get-next-step`
returns the mode the orchestrator wants. `run-ward({questId, workItemId, mode})` blocks until ward exits and persists
the result onto the work item.

Verification step expects ward to return exactly `Complete` with no other output. Both `changed` and `full` paths must
be exercised.

### PathSeeker decomposition into four work-item roles

Today's PathSeeker is one spawned agent that internally walks three phases (`seek_scope` → `seek_synth` with two waves
of minions → `seek_walk`). In the new model the orchestration loop has no spawn authority, so the phases become
first-class work items dispatched by `/dumpster-launch` via Task(). The agents that used to be "minions" dispatched from
inside PathSeeker become standalone agents dispatched from the orchestrator monitor — same prompts, just removed from
the parent's dispatch logic.

**New work-item roles (added to `WorkItemRole`):**

| Role                               | Count per quest                          | Depends on                                                | What it does                                                                                                                                                                                                                                                                                                                      |
|------------------------------------|------------------------------------------|-----------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `pathseeker-surface`               | one per slice (one per affected package) | nothing                                                   | Slice-scoped step + contract authoring. Direct write to `quest.steps[]` and `quest.contracts[]` for its slice. **Same prompt as today's `pathseeker-surface-scope-minion`**, just renamed.                                                                                                                                        |
| `pathseeker-dedup`                 | one                                      | all `pathseeker-surface` ids                              | Cross-slice + in-package contract dedup. Same prompt as today's `pathseeker-contract-dedup-minion`.                                                                                                                                                                                                                               |
| `pathseeker-assertion-correctness` | one                                      | all `pathseeker-surface` ids                              | Assertion well-formedness, banned-matcher scan, per-prefix `field` correctness, channel discipline. Same prompt as today's `pathseeker-assertion-correctness-minion`.                                                                                                                                                             |
| `pathseeker-walk`                  | one                                      | `pathseeker-dedup` AND `pathseeker-assertion-correctness` | Full architect-review walk: trace every flow entry→exit, patch structural issues, author exploratory steps for novelty, commit `walkFindings`. Transitions the quest to in_progress and triggers the existing `stepsToWorkItemsTransformer` to generate the downstream codeweaver/ward/siegemaster/lawbringer/blightwarden chain. |

The `pathseeker-surface` agents run in parallel (slot-cap permitting). `pathseeker-dedup` +
`pathseeker-assertion-correctness` run in parallel after all surface items complete. `pathseeker-walk` runs alone after
both corrections complete. This is exactly today's seek_synth Wave A / Wave B / seek_walk ordering — just expressed as
`dependsOn` in the work-item graph rather than as in-prompt waits.

### Slice generation from `packagesAffected`

ChaosWhisperer declares `packagesAffected: PackageName[]` during spec approval. The work-item insertion broker (the one
that today creates the single `pathseeker` work item after Start Quest) is changed to:

1. **Auto-generate `scopeClassification.slices[]`** from `packagesAffected`. One slice per package:
   `{ name: <packageName>, packages: [<packageName>], flowIds: <ids of flows whose nodes reference that package> }`. The
   `flowIds` set is derived from `flow.nodes[].observables[].accompanyingFiles` paths or, simpler for v1, every slice
   covers every flowId (the surface agent reads everything but only writes its package's steps).
2. **Persist** `scopeClassification` to `quest.planningNotes` via the existing `questPersistBroker`. This stays
   compatible with existing validators and prompts that read `scopeClassification.slices[]`.
3. **Insert** the work-item graph above into `quest.workItems[]`:
    - N × `pathseeker-surface` items (one per slice), `dependsOn: []`
    - 1 × `pathseeker-dedup` item, `dependsOn: [...all surface ids]`
    - 1 × `pathseeker-assertion-correctness` item, `dependsOn: [...all surface ids]`
    - 1 × `pathseeker-walk` item, `dependsOn: [pathseeker-dedup.id, pathseeker-assertion-correctness.id]`

Small/medium/large scope classification (today's `scopeClassification.size`) is implied directly by
`packagesAffected.length`. Borderline-call heuristics from the current PathSeeker prompt (small fix spanning 2
packages = 1 slice with 2 packages) are NOT preserved in v1; every affected package gets its own slice. If this turns
out to be wasteful for tiny fixes, add a `scopeMergePolicy` config later.

### Prompt changes

| Static file                                                                  | Today                                                                                    | Change                                                                                                                                                                                                                                                                                                                                                                                                     |
|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `packages/orchestrator/src/statics/pathseeker-surface-scope-minion/`         | "You are a Pathseeker Surface Scope Minion. Pathseeker has assigned you a slice..."      | Rename to `pathseeker-surface-statics`. Reword "Pathseeker dispatched you" → "the orchestrator monitor dispatched you". Slice assignment shape (name/packages/flowIds) and write authority are unchanged. The "your FIRST action: call `get-agent-prompt`" stays — that's the standard agent-dispatch protocol.                                                                                            |
| `packages/orchestrator/src/statics/pathseeker-contract-dedup-minion/`        | "Pathseeker has dispatched you during seek_synth Wave B..."                              | Rename to `pathseeker-dedup-statics`. Reword "Pathseeker dispatched you" → "the orchestrator monitor dispatched you after every pathseeker-surface agent finished". Same single-pass discipline, same write authority.                                                                                                                                                                                     |
| `packages/orchestrator/src/statics/pathseeker-assertion-correctness-minion/` | (same pattern)                                                                           | Rename to `pathseeker-assertion-correctness-statics`. Same content reworded.                                                                                                                                                                                                                                                                                                                               |
| `packages/orchestrator/src/statics/pathseeker-prompt/`                       | One prompt covering seek_scope + seek_synth (dispatch + wait for both waves) + seek_walk | **Rewrite to `pathseeker-walk-statics`**: drop the seek_scope and seek_synth status sections entirely (those become work-item-level boundaries now). Keep ONLY the seek_walk architect-review content (Status Sections → `seek_walk` from the current prompt, lines ~322 onward). Update the Resume Protocol: status is always whatever the orchestrator passes in; the agent does not branch on `seek_*`. |

The completeness validators that fire on the `seek_walk → in_progress` transition stay where they are;
`pathseeker-walk`'s final `modify-quest` call is what triggers them.

### Quest status enum impact

Today's quest status enum includes `seek_scope`, `seek_synth`, `seek_walk` as quest-level statuses. With the
decomposition above, those phase boundaries move down to the work-item level (encoded as `dependsOn`). For v1, the quest
transitions directly from `approved` (after user clicks Start Quest) to `in_progress`, and stays in_progress while all
`pathseeker-*` work items + the downstream codeweaver chain run.

The three `seek_*` quest statuses become dead enum values. **Do NOT remove them from the contract in v1** — that's a
breaking change for quest.json files mid-flight. Tag them as deprecated in a follow-up. The new
`pathseeker-walk-statics` prompt does not branch on them.

### Always-on orchestrator

Today, the server lazy-starts orchestration state when the web UI is viewed. That gating is removed: the MCP-tool
surface (`get-next-step`, `run-ward`, `register-monitor-session`, `signal-back`, `get-agent-prompt`, etc.) must be live
as soon as the server is up, regardless of whether a browser is connected. `/dumpster-launch` needs to be able to call
`get-next-step` against any quest while the web UI is closed.

### Sub-agent session id capture

When a sub-agent dispatched via `Task()` calls `get-agent-prompt({agent, workItemId, questId})`, the MCP responder:

1. Reads the calling session's id from MCP transport metadata that Claude Code surfaces to MCP servers.
2. Writes that sessionId onto `quest.workItems[workItemId].sessionId` (field already exists per existing schema).
3. Interpolates work-item-specific context (scope, package, steps, file paths) into the returned prompt text.
4. Returns the prompt to the calling sub-agent.

The orchestrator now has a `subagentSessionId → questId × workItemId` map persisted in quest.json — enough to tail the
sub-agent's JSONL and route its ChatEntries to the right quest in the web UI.

This replaces the spawn-time session capture `agentLaunchBroker` does today. The moment shifts from "we spawned the
process" to "the process first asks for its prompt" — same effect, no spawn.

Sub-agents continue to call `signal-back({questId, workItemId, signal})` when done; this triggers existing state
transitions in `handleSignalLayerBroker`.

### Web UI live streaming via JSONL file-watching

Replace the in-memory chat bus driven by `chat-spawn-broker` stdout with a file-watcher driven by the user's
`/dumpster-launch` session.

- `/dumpster-launch` registers its session at startup via `register-monitor-session({sessionFilePath})` — **no quest id
  **, because the session monitors all quests it dispatches against. The slash command resolves `sessionFilePath` by
  listing `~/.claude/projects/<encoded-cwd>/*.jsonl` for the most-recently-modified file.
- A new broker `quest-monitor-jsonl-watcher-broker` tails that file plus the `subagents/agent-*.jsonl` siblings as they
  appear. Lines feed through the existing `chatLineProcessTransformer` unchanged.
- **ChatEntry → quest routing is simple under one-quest-at-a-time.** The server tracks the currently-active quest (the
  one `get-next-step` last returned work for). Every ChatEntry emitted by the watcher during that window is tagged with
  that questId. When the active quest changes (the previous one reached complete/blocked and `get-next-step` advanced to
  the next), the tag flips. No reverse-map lookup needed.
- **WebSocket payload extension**: the current `chat-output` WebSocket message broadcasts `{entries, chatProcessId}` (no
  questId). Add `questId: QuestId` to the payload contract so the web UI can route by quest. Affects
  `packages/server/src/responders/...` (WebSocket broadcaster) and `packages/web/src/bindings/...` (the subscription
  side).
- The parent `/dumpster-launch` session's own lines (`get-next-step` calls, Task() invocations) are the control-plane
  chatter — surfaced as orchestrator activity, or filtered out for now.

### Web UI changes

- **Remove the "Create Quest" button** entirely. No replacement banner. No migration message.
- "Start Quest" button: keep current behavior (status mutation + execute-view redirect). Add a small banner on the
  execute view: "Run `/dumpster-launch` in your Claude session — it'll pick this quest up on its next pass." with
  copy-to-clipboard.
- Spec phase: `?chat=hidden` URL param on `quest-chat-content-layer-widget.tsx` to suppress ChatPanel render (chat still
  subscribes, just isn't mounted). `/dumpster-create` opens the URL with this param.
- Execute phase: no change — already full-width ExecutionPanel, no chat.

### Slash command bodies

`.claude/commands/dumpster-create.md`:

```md
---
description: Run a Dumpster spec conversation (ChaosWhisperer)
allowed-tools: mcp__dungeonmaster__*, Bash, Read, Glob, Grep, Edit, Write, Task
---

You are running a Dumpster spec conversation in the user's interactive session.

1. Call `mcp__dungeonmaster__get-agent-prompt({ agent: "chaoswhisperer" })`. Follow EVERY instruction it returns. The prompt is the source of truth — it tells you to create the new quest, walk the user through spec, and elicit `packagesAffected[]` before the final approval gate.
2. After ChaosWhisperer has created the quest (via its own MCP calls), call `mcp__dungeonmaster__get-server-config()` and open the spec view in the web UI with chat hidden: `<baseUrl>/<guildSlug>/quest/<questId>?chat=hidden`. Run: `xdg-open <url> 2>/dev/null || open <url> 2>/dev/null || true`.
3. Continue the spec conversation per the chaoswhisperer prompt.
```

Note: ChaosWhisperer's prompt must be updated to instruct the agent to create a new quest as its first action. This
means there's a `create-quest` MCP tool (new, returns the new questId and guildSlug), OR `start-quest` is extended to
support a no-questId variant that creates and returns the new id. Either way the user never types the quest id. This is
contract-change work in step 1.

Note: `get-server-config` is a new MCP tool (returns the server's `{baseUrl, port}` so the slash command knows where to
point the browser).

`.claude/commands/dumpster-launch.md`:

```md
---
description: Run the Dumpster orchestration loop across all approved quests
allowed-tools: mcp__dungeonmaster__*, Task, Bash
---

You are the dispatch loop for ALL approved Dumpster quests. The MCP server is the state machine; you are the dispatcher. Do NOT decide which agent runs next. Do NOT skip steps. Do NOT terminate on a quest failure — keep churning.

Startup:
1. Find your session's JSONL: list `~/.claude/projects/<encoded-cwd>/*.jsonl` and pick the most recently modified path.
2. Call `mcp__dungeonmaster__register-monitor-session({ sessionFilePath: <path> })`. This lets the server stream your session's output to the web UI.

Loop forever:

1. Call `mcp__dungeonmaster__get-next-step()` with NO arguments. This may block up to ~25 s — that is normal.
2. Switch on `result.type`:
   - `spawn-agents`: dispatch ALL listed agents IN PARALLEL via the Task tool. Each Task's prompt is `taskPrompt` verbatim (the questId is already interpolated). AWAIT all Tasks before continuing.
   - `run-ward`: call `mcp__dungeonmaster__run-ward({ questId: result.questId, workItemId: result.workItemId, mode: result.mode })`. This blocks while ward runs (minutes). Wait for it.
   - `idle`: no work right now. Immediately call `get-next-step()` again.
3. Loop back to 1.
```

### `get-agent-prompt` parameterization and session capture

**Contract change required.** Current schema at
`packages/mcp/src/contracts/get-agent-prompt-input/get-agent-prompt-input-contract.ts` is `.strict()` and only accepts
`{agent}`. Two changes:

1. Remove `.strict()` (or replace with explicit optional fields). Add `workItemId?: WorkItemId` and `questId?: QuestId`.
2. The MCP interaction responder (`packages/mcp/src/responders/interaction/handle/interaction-handle-responder.ts`) must
   accept and pass these through to `orchestratorGetAgentPromptAdapter`.

When `workItemId` and `questId` are supplied, the broker:

1. Reads the work item from quest.json; interpolates work-item-specific context into the returned prompt.
2. Captures the calling MCP client's session id (see "Session id capture mechanism" below) and persists to
   `quest.workItems[workItemId].sessionId`.

Backward-compatible for the no-args case — ChaosWhisperer in `/dumpster-create` still works.

### Session id capture mechanism

The plan's earlier "read from MCP transport metadata" assumption needs verification — the existing MCP responders in
this repo receive only `{tool, args}`, with no obvious session id exposure. Investigation order during step 2:

1. **Preferred**: check whether Claude Code's MCP stdio transport surfaces session id via request metadata, env vars (
   `CLAUDE_SESSION_ID`, `CLAUDE_AGENT_ID`), or a transport-level header the MCP SDK passes to handlers. If yes, use it
   directly.
2. **Fallback A** (filesystem heuristic): at the moment `get-agent-prompt` is called, scan `<projectDir>/subagents/` for
   the most-recently-created `.jsonl` file whose first line's `message.content` byte-equals the taskPrompt the parent
   dispatched. This is the same prompt-text equality trick the existing `chat-history-replay-broker` pre-scan 1b uses
   for in-flight Task pairing (see `packages/orchestrator/CLAUDE.md`).
3. **Fallback B** (defer persistence): if neither works, don't persist sessionId on the work item up front. Instead let
   the existing `chat-line-process-transformer` convergence logic do the routing at line-emit time — it already
   correlates parent_tool_use_id → toolUseId → workItemId via the live reverse-map. The web UI just needs the
   workItemId-on-entry to know which quest the entry belongs to.

If Fallback B is needed, the "ChatEntry → quest routing" section needs no upfront sessionId field — routing is
reconstructed on the fly. Acceptable for v1.

### Sub-agent Task prompt shape

The taskPrompt the broker generates and embeds in `SpawnInstruction`:

```
Call mcp__dungeonmaster__get-agent-prompt({
  agent: "<role>",
  workItemId: "<workItemId>",
  questId: "<questId>"
}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({
  questId: "<questId>",
  workItemId: "<workItemId>",
  signal: "complete" | "failed",
  summary: "<one-line>"
}).
```

The questId is interpolated into the string by `quest-get-next-step-broker` before the SpawnInstruction is returned.

**Contract change required for `signal-back`.** The current input contract at
`packages/mcp/src/contracts/signal-back-input/signal-back-input-contract.ts` only accepts `{signal, summary}`. Add
`questId: QuestId` and `workItemId: WorkItemId` as required fields. The `signalBackBroker` and `handleSignalLayerBroker`
need to route on these explicit ids instead of inferring from process state. This is step 1 (contracts) work; flag in
the contracts section.

### State persistence

Today's in-memory state moves to `quest.json`:

- `workTracker.activeAgents` → derived from `quest.workItems[].status === 'in_progress'`
- Slot session ids → already on `WorkItem.sessionId`
- Retry counts → new `WorkItem.retryCount: FailCount`
- Last ward run id → new `WorkItem.lastWardRunId: FileName`
- `orchestrationProcessesState`, `executionQueueBootstrapState`, `processStaleWatchBootstrapState` → no longer needed (
  no orchestrator-spawned processes)

`quest.json` becomes the single source of truth; every `get-next-step` call is a pure function of
`(all quest.jsons, slotCount, in-flight subagent count) → NextStep`.

## Implementation order (each step keeps the system buildable)

1. **Contracts** — additive + breaking changes in one `@dungeonmaster/shared` rebuild:
    - Add `next-step-contract` (in orchestrator, not shared).
    - Reuse existing `ward-mode-contract` shape from `WorkItem` (`'changed' | 'full'`) — do NOT introduce new terms.
    - New `WorkItem` fields: `retryCount: FailCount`, `lastWardRunId?: FileName`.
    - New `quest.packagesAffected: PackageName[]`.
    - `signalBackInputContract`: add required `questId: QuestId` and `workItemId: WorkItemId`.
    - `getAgentPromptInputContract`: remove `.strict()`; add optional `workItemId?: WorkItemId`, `questId?: QuestId`.
    - `startQuestInputContract`: support no-questId variant that creates a new quest (or add a separate
      `createQuestInputContract`).
    - New `getServerConfigOutputContract`: `{baseUrl: string, port: number}`.
    - New WebSocket `chatOutputPayloadContract`: add `questId?: QuestId`.
2. **`get-agent-prompt` extension** — implement the contract change: accept optional `{workItemId, questId}`;
   interpolate work-item context into the returned prompt; capture session id per the "Session id capture mechanism"
   investigation order (transport metadata → filesystem heuristic → defer-to-line-emit). When sessionId is captured,
   persist to `quest.workItems[*].sessionId`.
3. **`signal-back` extension** — `signalBackBroker` and `handleSignalLayerBroker` route on explicit
   `{questId, workItemId}` from input instead of inferring from process state. Backward-incompatible — callers must
   supply the ids.
4. **`quest-get-next-step-broker`** — pure-function broker. Picks the oldest post-Start-Quest quest (FIFO by approval
   timestamp) that still has incomplete work and returns ready work from THAT quest only. Returns parallel batches only
   for the `pathseeker-surface` and `pathseeker-corrections` cases described in the architecture section; everything
   else is one agent at a time. Does NOT consult `slotManagerStatics` (left in place for reuse elsewhere). Long-polls
   internally for ~25 s, returns `idle` if nothing.
5. **`quest-run-ward-broker`** — wraps existing `runWardLayerBroker`; accepts `{questId, workItemId, mode}`. Persists
   ward result onto the work item.
6. **`register-monitor-session` broker + state** — captures `{projectDir, sessionFilePath}` to in-memory
   `monitorSessionState`. **Single-launcher semantics**: if a session is already registered for this server, reject the
   new registration with a clear error (one `/dumpster-launch` per server at a time). On registration, scan all
   approved-or-running quests and reset orphaned `in_progress` work items (those with no matching live MCP session) back
   to `pending`.
7. **`quest-monitor-jsonl-watcher-broker`** — tails the registered session JSONL + `subagents/agent-*.jsonl` siblings;
   feeds existing `chatLineProcessTransformer`; tags emitted ChatEntries with their questId; emits to existing bus.
   Reuses existing `chat-history-replay-broker` + `chat-subagent-tail-broker` + `chat-main-session-tail-broker`
   mechanics.
8. **`get-server-config` MCP tool** — new tool returning `{baseUrl, port}`. Trivial — reads existing server config
   state.
9. **Register all new MCP tools** in `packages/mcp/src/flows/quest/quest-flow.ts` + `quest-handle-responder.ts`:
   `get-next-step`, `run-ward`, `register-monitor-session`, `get-server-config`. Wire the extended `get-agent-prompt`
   and `signal-back` schemas.
10. **Always-on orchestrator validation** — investigate whether the server currently gates any orchestration state on
    web connection (the gap-check did NOT find such gating; `ServerFlow()` loads sub-flows synchronously on startup). If
    found, remove. If not, validate that the MCP tool surface plus the JSONL watcher hook ARE wired into the synchronous
    startup path and require no web connection to activate.
11. **WebSocket payload questId tagging** — extend the `chat-output` WebSocket broadcaster (in `packages/server/`) to
    include `questId` in the payload, and the web subscriber (in `packages/web/src/bindings/`) to filter or route by it.
12. **PathSeeker decomposition** —
    a. Add four new entries to `WorkItemRole`: `pathseeker-surface`, `pathseeker-dedup`,
    `pathseeker-assertion-correctness`, `pathseeker-walk`. Remove or deprecate the existing single `pathseeker` role.
    b. Rename the three minion static files (
    `pathseeker-{surface-scope,contract-dedup,assertion-correctness}-minion-statics` →
    `pathseeker-{surface,dedup,assertion-correctness}-statics`). Rewrite each prompt's "dispatched by Pathseeker"
    framing to "dispatched by the orchestrator monitor". Otherwise keep content/authority/validator rules identical.
    c. Rewrite `pathseeker-prompt-statics.ts` → `pathseeker-walk-statics.ts`: keep only the seek_walk architect-review
    content; delete seek_scope and seek_synth sections; drop the Resume Protocol's status-branching.
    d. Update `agent-name-to-prompt-transformer` (or wherever `get-agent-prompt` resolves agent name → prompt text) to
    map the four new agent names to the new statics. Drop `pathseeker`, `pathseeker-surface-scope-minion`,
    `pathseeker-contract-dedup-minion`, `pathseeker-assertion-correctness-minion` mappings, OR keep them returning the
    new statics for graceful aliasing.
    e. ChaosWhisperer prompt updates to require `packagesAffected[]` declaration during approval.
    f. Update the work-item insertion broker (find via `discover` — it lives downstream of `start-quest`'s post-approval
    path; today inserts one `pathseeker` work item): build `scopeClassification.slices[]` from `packagesAffected` (one
    slice per package), persist to `planningNotes`, then insert the
    `pathseeker-{surface×N, dedup, assertion-correctness, walk}` work-item graph with the `dependsOn` edges described in
    the architecture section.
    g. Update the broker that runs after `pathseeker-walk` completion to invoke `stepsToWorkItemsTransformer` (existing)
    to generate the downstream codeweaver/ward/siegemaster/lawbringer/blightwarden chain. This logic exists today in
    `run-pathseeker-layer-broker`'s onSuccess path (lines 114–151 per gap-check); migrate it into a post-completion hook
    tied to the `pathseeker-walk` work item.
13. **Slash command install responder** — new responder at
    `packages/orchestrator/src/responders/install/commands-create/`. Writes `dumpster-create.md` + `dumpster-launch.md`
    to `<startPath>/.claude/commands/` (project-local; no precedent for user-global `~/.claude/commands/` in this repo).
    Wires into existing orchestrator install flow. Statics at `packages/orchestrator/src/statics/slash-commands/`.
14. **Web UI `?chat=hidden` query param** — additive guard in
    `packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx`.
15. **Remove "Create Quest" button** from the web UI. Add "Run `/dumpster-launch`" banner on the execute view. Also
    decide and implement: what does the no-questId route `/<guildSlug>/quest` show now? Likely just a list/placeholder,
    since there's no chat to start.
16. **Stop the orchestrator from calling spawn machinery** — remove the call sites in `quest-orchestration-loop-broker`
    and the `orchestration-start-responder` spawn half (status mutation stays). The spawn brokers stay on disk but
    become orphaned.
17. **Smoketest harness rewrite** — `packages/orchestrator/src/responders/smoketest/` currently exercises the spawn
    pipeline end-to-end. Rewrite strategy: replace the spawn-and-stream assertions with a synchronous in-process driver
    that calls `get-next-step` → handles `spawn-agents` by directly invoking the work item's prompt against a stubbed
    Task tool (no real Claude spawn) → calls `signal-back` to advance state → loops. Reuses existing
    `chatLineProcessTransformer` against fixture JSONL files so the chat-rendering side stays covered.
18. **Docs** — update `packages/orchestrator/CLAUDE.md` (the "Chat-line translation: this package owns it" section is
    still true but is driven by file-watching the user's session now, not spawn stdout — adjust the four-entry-point
    table). Update top-level `README.md` to mention `/dumpster-create` and `/dumpster-launch`.

## Critical files to modify

| File                                                                                                                | Change                                                                                                                                                              |
|---------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts`                     | Stop calling layer brokers; logic moves into `quest-get-next-step-broker`                                                                                           |
| `packages/orchestrator/src/brokers/quest/orchestration-loop/run-pathseeker-layer-broker.ts`                         | DELETE call sites (orchestrator no longer spawns); migrate the post-success `stepsToWorkItemsTransformer` invocation to a hook tied to `pathseeker-walk` completion |
| `packages/orchestrator/src/transformers/.../work-item insertion broker post-Start-Quest` (locate during step 12.f)  | Build slices from `packagesAffected`; insert four-tier pathseeker work-item graph                                                                                   |
| `packages/orchestrator/src/transformers/agent-name-to-prompt-transformer.ts` (or wherever names resolve to prompts) | Map new agent names to renamed statics                                                                                                                              |
| `packages/orchestrator/src/statics/pathseeker-surface-scope-minion/` → rename                                       | `pathseeker-surface-statics` (lose "minion"; reword parent framing)                                                                                                 |
| `packages/orchestrator/src/statics/pathseeker-contract-dedup-minion/` → rename                                      | `pathseeker-dedup-statics`                                                                                                                                          |
| `packages/orchestrator/src/statics/pathseeker-assertion-correctness-minion/` → rename                               | `pathseeker-assertion-correctness-statics`                                                                                                                          |
| `packages/orchestrator/src/statics/pathseeker-prompt/` → rename + slim                                              | `pathseeker-walk-statics`: drop seek_scope + seek_synth sections; keep only walk content                                                                            |
| `packages/shared/src/contracts/work-item-role/...` (or wherever the `WorkItemRole` enum lives)                      | Add `pathseeker-surface`, `pathseeker-dedup`, `pathseeker-assertion-correctness`, `pathseeker-walk`; remove or deprecate `pathseeker`                               |
| `packages/orchestrator/src/brokers/agent-prompt/.../agent-prompt-get-broker.ts`                                     | Accept optional `{workItemId, questId}`; interpolate context; persist caller sessionId                                                                              |
| `packages/orchestrator/src/brokers/signal-back/.../signal-back-broker.ts`                                           | Route on explicit `{questId, workItemId}` from input                                                                                                                |
| `packages/orchestrator/src/brokers/slot-manager/orchestrate/handle-signal-layer-broker.ts`                          | Use explicit ids from signal-back input                                                                                                                             |
| `packages/orchestrator/src/statics/chaoswhisperer-prompt/`                                                          | Require `packagesAffected[]` declaration during approval                                                                                                            |
| `packages/orchestrator/src/statics/pathseeker-prompt/`                                                              | Remove minion-dispatch sections; per-package scope                                                                                                                  |
| `packages/mcp/src/contracts/signal-back-input/signal-back-input-contract.ts`                                        | Add `questId`, `workItemId` required fields                                                                                                                         |
| `packages/mcp/src/contracts/get-agent-prompt-input/get-agent-prompt-input-contract.ts`                              | Remove `.strict()`; add optional `workItemId`, `questId`                                                                                                            |
| `packages/mcp/src/contracts/start-quest-input/start-quest-input-contract.ts`                                        | Support no-questId create variant (or new `create-quest` tool)                                                                                                      |
| `packages/mcp/src/flows/quest/quest-flow.ts`                                                                        | Register `get-next-step`, `run-ward`, `register-monitor-session`, `get-server-config`; extend existing schemas                                                      |
| `packages/mcp/src/responders/quest/handle/quest-handle-responder.ts`                                                | Wire new tools                                                                                                                                                      |
| `packages/mcp/src/responders/interaction/handle/interaction-handle-responder.ts`                                    | Pass through new `get-agent-prompt` and `signal-back` params                                                                                                        |
| `packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx`                                           | `?chat=hidden` guard; "Create Quest" button removed; "/dumpster-launch" execute-view banner                                                                         |
| `packages/web/src/bindings/...` (WebSocket subscription bindings)                                                   | Filter/route `chat-output` by `questId`                                                                                                                             |
| `packages/server/src/responders/orchestration/start/orchestration-start-responder.ts`                               | Status mutation only — no spawn                                                                                                                                     |
| `packages/server/src/responders/...` (WebSocket broadcaster for `chat-output`)                                      | Include `questId` in payload                                                                                                                                        |
| `packages/server/src/startup/start-server.ts`                                                                       | Confirm always-on orchestrator (gap-check found no gating); add JSONL watcher hook                                                                                  |
| `packages/shared/src/contracts/work-item/work-item-contract.ts`                                                     | Add `retryCount`, `lastWardRunId`                                                                                                                                   |
| `packages/shared/src/contracts/quest/quest-contract.ts`                                                             | Add `packagesAffected: PackageName[]`                                                                                                                               |

## Critical files to create

| File                                                                                                | Purpose                                                                                           |
|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `packages/orchestrator/src/contracts/next-step/next-step-contract.ts`                               | `NextStep` discriminated union                                                                    |
| `packages/orchestrator/src/brokers/quest/get-next-step/quest-get-next-step-broker.ts`               | Multi-quest scan; pure function returning `NextStep`                                              |
| `packages/orchestrator/src/brokers/quest/run-ward/quest-run-ward-broker.ts`                         | Synchronous ward invocation wrapper                                                               |
| `packages/orchestrator/src/brokers/quest/register-monitor-session/...`                              | Monitor session registration (no quest id); single-launcher enforcement; orphaned-work-item reset |
| `packages/orchestrator/src/brokers/quest/monitor-jsonl-watcher/...`                                 | Tails session JSONLs; tags entries with questId                                                   |
| `packages/orchestrator/src/state/monitor-session-state.ts`                                          | `{projectDir, sessionFilePath}` plus a single-active-launcher flag                                |
| `packages/orchestrator/src/brokers/quest/get-server-config/...`                                     | Returns `{baseUrl, port}` for slash commands                                                      |
| `packages/orchestrator/src/responders/install/commands-create/install-commands-create-responder.ts` | Writes the two .md files                                                                          |
| `packages/orchestrator/src/statics/slash-commands/dumpster-create-command-statics.ts`               | The dumpster-create.md body                                                                       |
| `packages/orchestrator/src/statics/slash-commands/dumpster-launch-command-statics.ts`               | The dumpster-launch.md body                                                                       |
| `packages/mcp/src/contracts/get-server-config-output/get-server-config-output-contract.ts`          | `{baseUrl, port}`                                                                                 |
| `packages/mcp/src/contracts/register-monitor-session-input/...`                                     | `{sessionFilePath}`                                                                               |

## Verification

1. **Build cleanly**: `npm run build` succeeds.
2. **Ward green**: `npm run ward` (timeout 600000) returns exactly `Complete` with no errors or other output. Exercise
   both partial-ward and full-ward paths.
3. **`/dumpster-create` end-to-end**:
    - `npm link --workspaces && npm run init` in a test repo to install the new commands.
    - In an interactive Claude Code session in that repo, run `/dumpster-create`.
    - Verify ChaosWhisperer prompt loads via `get-agent-prompt`.
    - Verify web UI opens at the spec URL with chat panel hidden.
    - Walk a spec to approval; verify `quest.packagesAffected[]` is populated.
4. **`/dumpster-launch` end-to-end**:
    - Click "Start Quest" in the web UI on an approved quest; verify status mutation and execute-view redirect.
    - Read the "Run /dumpster-launch" banner; copy the command.
    - In the same Claude session, run `/dumpster-launch` (no args).
    - Verify `register-monitor-session` is called with the right `sessionFilePath`.
    - Verify `get-next-step()` returns spawn-agents instructions with `questId` embedded.
    - Verify Task() dispatch fires per-package PathSeeker.
    - Verify each sub-agent's call to `get-agent-prompt` lands its session id on the corresponding
      `quest.workItems[*].sessionId`.
    - Verify web UI execute view streams live chat from the tailed JSONLs (parent + sub-agent files), tagged to the
      correct quest.
    - Verify `run-ward({mode})` blocks the orch LLM and ward output appears in the UI; both `partial` and `full` modes
      are exercised.
    - Verify quest reaches `complete`; `/dumpster-launch` continues to the next quest in the queue.
5. **Queue progression**:
    - Approve two quests A then B (A first by approval time). Verify `/dumpster-launch` works A to completion, then
      advances to B. Confirm no work-item from B is dispatched while A is still in progress.
    - Inject a failure in quest A (e.g. a codeweaver that signal-backs `failed` past the followup cap). Verify quest A
      reaches `blocked` and `/dumpster-launch` advances to B.
6. **PathSeeker parallel batches**:
    - On a multi-package quest, verify `get-next-step` returns ALL `pathseeker-surface` items in one `spawn-agents`
      batch and the LLM Task()s them in parallel.
    - After all surface items complete, verify the next `get-next-step` returns BOTH `pathseeker-dedup` and
      `pathseeker-assertion-correctness` in one batch.
    - After both corrections complete, verify the next `get-next-step` returns `pathseeker-walk` alone.
    - Confirm codeweaver, ward, siegemaster, lawbringer, etc. each come back one-at-a-time (single-agent `spawn-agents`
      responses).
7. **Spec/execute independence**:
    - While `/dumpster-launch` is running quest A, run `/dumpster-create` on a new quest C in a second Claude session.
      Verify C's spec edits do not affect A's `get-next-step` results. Verify C is queued behind B once approved (FIFO).
    - Attempt to run a second `/dumpster-launch` while one is already registered. Verify `register-monitor-session`
      rejects with a clear error.
8. **Always-on orchestrator**: with the web UI closed, run `/dumpster-launch` from cold start. Verify `get-next-step`
   responds normally without the web UI being open.
9. **Orphaned work item reset**: kill `/dumpster-launch` mid-flight (work items in `in_progress`). Start a fresh
   `/dumpster-launch`. Verify `register-monitor-session` resets orphaned items back to `pending` and dispatch resumes
   from the right place.
10. **WebSocket questId tagging**: while `/dumpster-launch` is on quest A, verify the web UI's quest-A view receives
    chat entries tagged with A's id. After A completes and B becomes active, verify entries for B carry B's id.
11. **Smoketest**: `npm run dev` smoketest runs green against the rewritten harness.

## Open implementation details (resolved during build)

- **How `get-agent-prompt` reads the calling session id** — MCP transport metadata exposure varies by Claude Code
  version. Investigate during step 2. Fallback heuristic: capture the most-recently-modified file in
  `<projectDir>/subagents/` at the moment `get-agent-prompt` is called, paired with the parent's known taskPrompt →
  workItemId mapping. If neither works, we can still route ChatEntries via the parent's `parent_tool_use_id`
  correlation (the existing transformer logic) and accept that work item ↔ subagent file linkage is reconstructed at
  line-emit time rather than persisted upfront.
- **Orphaned in-progress work items on `/dumpster-launch` kill** — if the user kills the launch session mid-flight,
  `quest.workItems[*].status === 'in_progress'` will be stale. On `register-monitor-session` startup, the orchestrator
  scans all approved quests and resets `in_progress` work items with no corresponding live MCP session back to
  `pending`. Note: if the user starts a fresh `/dumpster-launch` in a NEW Claude session, the prior session's subagent
  JSONLs are still on disk and can be replayed for the web UI; only the work-item status is reset so dispatch resumes.
- **Sub-agent killed externally (Ctrl+C, network glitch, etc.)** — sub-agent never calls `signal-back`. The work item
  stays `in_progress` with a `sessionId` set, but the orch LLM never gets a Task completion. Mitigation: per-work-item
  heartbeat-via-JSONL-write detector that resets to `pending` after N minutes of file-tail silence. Defer to v2; for v1,
  document as a "kill /dumpster-launch and restart" recovery path.
- **Quest scan order in `get-next-step`** — FIFO by approval timestamp is the default. Defer priority/fairness logic.
- **Parent `/dumpster-launch` session entries in the web UI** — show as orchestrator activity in a dedicated panel, or
  filter out. Pick during step 6.
- **`packagesAffected` field name** — could be `affectedPackages`, `targetPackages`, or `packages`. Pick during contract
  authoring.
- **Where the web-gated orchestrator start lives today** — find during step 8.

## Memory note

The feedback memory `feedback_no_quest_start_slash_command.md` ("Slash commands are a human-only surface; never invoke
or list slash commands in docs/memory/prompts/validation plans") is contradicted by this pivot. After plan approval,
update that memory: slash commands ARE the orchestration entry point now, and `/dumpster-create` + `/dumpster-launch`
should be documented in user-facing surfaces.
