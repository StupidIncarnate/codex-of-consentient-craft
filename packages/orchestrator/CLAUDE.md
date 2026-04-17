# @dungeonmaster/orchestrator

## Chat-line translation: this package owns it

The orchestrator is the single place where raw Claude CLI output (stdout stream-json OR the
JSONL file on disk) is translated into structured `ChatEntry[]`. The server just relays the
translated entries; the web just renders them. **If you're adding logic that parses a string
format, filters stream content, or converts one shape into another — it goes here.**

### The unified funnel

Every line from every source — live stdout during streaming, sub-agent JSONL file, replay of
the main JSONL — passes through a single factory:

```
chatLineProcessTransformer() → processor.processLine({ line, source, agentId? }) → ChatLineOutput[]
```

`ChatLineOutput` has two variants:

- `{ type: 'entries', entries: ChatEntry[] }` — one or more ready-to-render entries
- `{ type: 'patch', toolUseId, agentId }` — a late-arriving correlation patch for an entry
  that already shipped (e.g. a Task tool_use whose agentId wasn't known when the assistant
  message was emitted)

The four entry points that feed the processor:

| Path                    | Broker                          | Source                             | Start position |
|-------------------------|---------------------------------|------------------------------------|----------------|
| Parent stdout streaming | `chat-spawn-broker`             | CLI stdout via `spawn-stream-json` | —              |
| Sub-agent streaming     | `chat-subagent-tail-broker`     | `subagents/agent-<id>.jsonl`       | `beginning`    |
| Parent replay           | `chat-history-replay-broker`    | `<sessionId>.jsonl` (full read)    | —              |
| Main JSONL post-exit    | `chat-main-session-tail-broker` | `<sessionId>.jsonl` (tail)         | `end`          |

The post-exit tail catches background-agent `<task-notification>` lines Claude CLI appends
after the parent process exits — stdout is already closed so the tail is the only live path.

### Sanitation & parsing happens here, not on the web

Everything below is implemented in `chat-line-process-transformer.ts` (or transformers it
invokes). Do NOT move any of this to the web:

- **Empty-thinking filter** — Claude CLI emits `{ type: 'thinking', thinking: '', signature }`
  when extended thinking is on. The empty-text blocks are stripped from `message.content` so
  renderers never see them.
- **Task-notification parsing** — user-text messages wrapped in `<task-notification>` XML are
  parsed via `parse-task-notification-transformer` and attached as a structured
  `taskNotification` field on the entry.
- **AgentId correlation** — assistant `Task`/`Agent` tool_use entries get `agentId` stamped
  once the matching user tool_result (with `toolUseResult.agentId`) is seen. Late arrivals
  trigger a `patch` output. The processor instance is SHARED across all three live paths
  within a session — parent stdout, sub-agent tail, AND the main-session post-exit tail —
  so correlation state carries seamlessly whichever source a line arrives on.
- **Source tagging** — every emitted entry carries `source: 'session' | 'subagent'` so the
  web can decide chain membership.

### Tail lifecycle (chat-start-responder)

The responder owns the lifecycle of both tails it starts:

- `fsWatchTailAdapter` accepts an optional `startPosition: 'beginning' | 'end'` param.
  Omit it (or pass `'beginning'`) for the sub-agent tail — it must drain the JSONL Claude
  CLI already wrote while the parent blocked on the Agent tool. Pass `'end'` for the main
  post-exit tail — stdout already streamed every existing line, so only NEW appends
  (background task-notifications) should emit.
- `chatMainSessionTailBroker` is started from `chat-start-responder`'s `onComplete` handler
  the moment a `sessionId` is known. The returned `stop` handle is captured in a
  closed-over variable and composed into the `registerProcess` kill callback so teardown
  cleans up both the CLI child process AND the file-tail watcher in one call.
- Sub-agent tails follow the same composition pattern (`subagentStopHandles[]` are all
  stopped synchronously in `onComplete` before the main tail starts).

After the processor, `streamJsonToChatEntryTransformer` converts the stamped raw line into
`ChatEntry[]`. `mapContentItemToChatEntryTransformer`, `mapUsageToChatUsageTransformer`,
`normalizeAskUserQuestionInputTransformer`, `parseAssistantStreamEntryTransformer`, and
`parseUserStreamEntryTransformer` all live here — they're the "ChatEntry builders."

### Adding new translation logic

1. If it's a format-specific parser (XML, CSV, a new Claude CLI shape): add a transformer in
   `transformers/` and call it from `chat-line-process-transformer.ts`.
2. If it's a new `ChatEntry` variant: update `chat-entry-contract` in
   `@dungeonmaster/shared/contracts/chat-entry/`, then handle it in
   `map-content-item-to-chat-entry-transformer.ts`.
3. If it's a new emit shape: extend `ChatLineOutput` in `chat-line-output-contract.ts` and
   update every call site (chat-spawn-broker, chat-subagent-tail-broker,
   chat-history-replay-broker, chat-main-session-tail-broker).
4. Do NOT add parsing on the server or the web.

## Callouts

- **Agent prompts are served dynamically via the `get-agent-prompt` MCP tool.** Source of truth is in
  `packages/orchestrator/src/statics/` (e.g., `chaoswhisperer-gap-minion-statics.ts`,
  `pathseeker-quest-review-minion-statics.ts`). There are no `.claude/agents/*.md` files for these agents — parent roles
  tell spawned agents to call the MCP tool to get their instructions.

## Quest Pipeline

```
/quest (ChaosWhisperer)
  ├─ Explore agents ────── codebase research (read-only)
  ├─ chaoswhisperer-gap-minion ── spec validation (read-only)
  │
  ├─ Phase 1: Discovery ──────── explore codebase, interview user → status: explore_flows
  ├─ Phase 2: Flow Mapping ────── mermaid diagrams (mandatory) → status: review_flows
  ├─ Phase 3: Gate #1 ─────────── user approves flows → status: flows_approved
  ├─ Phase 4: Observables ─────── embedded in flow nodes → status: explore_observables → review_observables
  ├─ Phase 5: Gate #2 ─────────── user approves observables + contracts → status: approved
  │
  ▼
/quest:start ──► start-quest MCP
  │
  ▼
Orchestration Loop (workItems queue)
  │  "find next ready item, run it, repeat"
  │
  ├─ PathSeeker ──── phased statuses (seek_scope → seek_synth → seek_walk → seek_plan) + pathseeker-quest-review-minion (retry max 3)
  ├─ Codeweaver ──── x3 concurrent via slot manager, 1 step each
  │     └─ PathSeeker on failure (drain + skip + replan)
  ├─ Ward ────────── npm run ward (spawnerType: 'command')
  │     └─ Spiritmender on failure (targeted code fix)
  ├─ Siegemaster ─── integration tests for observables
  │     └─ Creates fix chain: codeweaver-fix → ward-rerun → siege-recheck
  ├─ Lawbringer ──── x3 concurrent via slot manager, 1 file pair each
  │     └─ Spiritmender on failure (targeted code fix)
  │
  ▼
Complete
```

## Work Items Model

All execution is driven by `quest.workItems[]`. Each work item is a generic container with a `role`,
`status`, `dependsOn` (ordering), and `relatedDataItems` (links to quest-level data like steps or wardResults).

- **Ordering**: `dependsOn` array — item runs when all deps are complete/skipped
- **Dispatch**: orchestration loop finds next ready item, routes to layer broker by role
- **Concurrency**: slot manager groups parallel-capable roles (codeweaver, siegemaster, lawbringer)
- **Dynamic insertion**: retries, spiritmender, fix chains — append items with correct `dependsOn`
- **Session tracking**: `sessionId` on each work item (replaces executionLog/pathseekerRuns)
- **Ward**: only non-agent item (`spawnerType: 'command'`), all others are `'agent'`

## Quest Status Lifecycle

```
pending ──┐
           ▼
created ──► explore_flows ──► review_flows ──► flows_approved ──► explore_observables ──► review_observables ──► approved ──► seek_scope ──► seek_synth ──► seek_walk ──► seek_plan ──► in_progress ──► complete
                                    │                                                          │                   │                          │              │              │              │
                                    └──► explore_flows (back)                                   └──► explore_observables (back)                └──► seek_scope │              │              ├──► blocked ──► in_progress
                                                                                                                   │                                         └──► seek_scope │              │         └──► abandoned
                                                                                                                   │                                                         └──► seek_walk │              └──► abandoned
                                                                                                                   ▼                                                                        │
                                                                                                            explore_design ──► review_design ──► design_approved ──► seek_scope ...        │
                                                                                                                                      │                                                    │
                                                                                                                                      └──► explore_design (back)                           │
                                                                                                                                                                                           │
                                                                                                 in_progress ──► seek_walk (failure routing)                                               │
                                                                                                 in_progress ──► seek_scope (full replan) ─────────────────────────────────────────────────┘
```

| Status                | Set By                                                    | Gate                                                      |
|-----------------------|-----------------------------------------------------------|-----------------------------------------------------------|
| `created`             | `add-quest`                                               | ChaosWhisperer starting up                                |
| `explore_flows`       | ChaosWhisperer (Phase 1 exit)                             | Can add: flows, designDecisions                           |
| `review_flows`        | ChaosWhisperer (Phase 2 exit)                             | User reviews flows, APPROVE button visible                |
| `flows_approved`      | User approves flows (Gate #1)                             | Can add: observables (in flow nodes), contracts, tooling  |
| `explore_observables` | ChaosWhisperer (Phase 4 entry)                            | Can add: observables, contracts, tooling                  |
| `review_observables`  | ChaosWhisperer (Phase 4 exit)                             | User reviews observables, APPROVE button visible          |
| `approved`            | User approves observables (Gate #2)                       | Spec locked. `start-quest` or `explore_design` allowed.   |
| `explore_design`      | Glyphsmith starts design work                             | Create prototypes, iterate on designs                     |
| `review_design`       | Glyphsmith ready for design review                        | User reviews designs, APPROVE button visible              |
| `design_approved`     | User approves designs                                     | Design locked. `start-quest` allowed.                     |
| `seek_scope`          | PathSeeker agent transitions via modify-quest             | Requires `planningNotes.scopeClassification`              |
| `seek_synth`          | PathSeeker agent transitions via modify-quest             | Requires `planningNotes.surfaceReports[]` + `planningNotes.synthesis` |
| `seek_walk`           | PathSeeker agent transitions via modify-quest             | Requires `planningNotes.walkFindings`                     |
| `seek_plan`           | PathSeeker agent transitions via modify-quest             | Requires `steps[]`, `planningNotes.reviewReport`, + spec-completeness checks pass |
| `in_progress`         | `start-quest` / PathSeeker transition from `seek_plan`    | Steps can be added/modified                               |
| `blocked`             | Pipeline blocker                                          | Execution paused                                          |
| `complete`            | All phases pass                                           | Terminal                                                  |
| `abandoned`           | User abandons                                             | Terminal                                                  |

## Flows (Mermaid Diagrams)

Flows are mermaid diagrams that force the LLM to think through connected state transitions BEFORE writing observables.
Every node must have an entry and exit — this surfaces missing "glue" (loading states, error recovery, navigation
transitions) that isolated requirements miss.

- Flows come FIRST, observables are embedded directly in flow nodes
- No type enum — the mermaid syntax itself encodes the diagram style (`graph TD`, `sequenceDiagram`, etc.)
- Flows have `nodes: FlowNode[]` and `edges: FlowEdge[]`; each node has optional `observables: FlowObservable[]`
- Flows are mandatory — every quest must have flows before observables can be defined
- The `quest-has-flow-coverage` guard is hard (blocks verification on failure)

## Observables (GIVEN/WHEN/THEN)

Observables are embedded directly in flow nodes at `flows[].nodes[].observables[]`. Each uses a BDD-style format:

```
{
  id: "observable-uuid",
  given: "user is on /login page with empty form",
  when: "user submits valid credentials",
  then: [
    { type: "api-call", description: "POST /api/auth/login called with credentials" },
    { type: "ui-state", description: "redirected to /dashboard" }
  ]
}
```

Three consumers read different parts:

- **User** reads given/when/then as a human-readable acceptance criteria checklist
- **PathSeeker** reads `then[].type` tags (file planning: ui-state -> widgets, api-call -> responders)
- **Siegemaster** uses the full observable to create integration tests

## Quest Stages

| Stage            | Sections Included                                                             |
|------------------|-------------------------------------------------------------------------------|
| `spec`           | flows (with observables), designDecisions, contracts, tooling                 |
| `spec-flows`     | flows (nodes/edges only, no observables), designDecisions, contracts, tooling |
| `spec-obs`       | flows (observables only), designDecisions, contracts, tooling                 |
| `planning`       | planningNotes, steps, contracts                                               |
| `implementation` | planningNotes, steps, contracts, tooling                                      |

Use `?stage=spec-flows` to get flow structure without observables. Use `?stage=spec-obs` to get observables without flow structure.

## Agent Roles

| Role         | Spawned By         | Signals          | On Failure        | MCP Tools (modify-quest)                             |
|--------------|--------------------|------------------|-------------------|------------------------------------------------------|
| Glyphsmith   | startDesignChat    | N/A (design)     | N/A               | status                                               |
| PathSeeker   | orchestration loop | complete, failed | Bubble to user    | planningNotes, steps, contracts, toolingRequirements |
| Codeweaver   | slot manager (x3)  | complete, failed | → PathSeeker      | none                                                 |
| Spiritmender | slot manager       | complete, failed | → PathSeeker      | none                                                 |
| Siegemaster  | orchestration loop | complete, failed | Creates fix chain | none                                                 |
| Lawbringer   | slot manager (x3)  | complete, failed | → Spiritmender    | none                                                 |

**Minion direct-writes to `planningNotes`.** During the seek_* phases, PathSeeker's subordinate minions also commit their own output directly via `modify-quest`:

- `pathseeker-surface-scope-minion` writes entries to `planningNotes.surfaceReports[]` (one per minion — dispatched in parallel during `seek_synth`).
- `pathseeker-quest-review-minion` writes `planningNotes.reviewReport` during `seek_plan`.

These writes flow through the same `modify-quest` pipeline as PathSeeker's own writes; the `questStatusInputAllowlistStatics` entry for each seek_* status governs exactly which `planningNotes.*` sub-fields are writable at that status. Minion output is durable the moment it's committed — a minion crash after write does not lose work.

PathSeeker itself reads accumulated planning state via the `get-planning-notes` MCP tool when resuming after a restart or downstream failure.

## Signal System

Agents communicate via `signal-back` MCP tool. Two signals only:

- **`complete`** — work done, release slot, dispatch next ready item
- **`failed`** — work failed, trigger failure routing

### Failure Routing Map

```
codeweaver   → pathseeker    (drain + skip + replan)
lawbringer   → spiritmender  (targeted code fix)
spiritmender → pathseeker    (drain + skip + replan)
siegemaster  → fix chain     (codeweaver-fix → ward-rerun → siege-recheck)
pathseeker   → bubble to user (terminal — quest blocks)
```

Followup depth is limited to prevent infinite retry loops.

### Drain + Skip Model

When a non-PathSeeker agent fails inside the slot manager, the orchestration loop:

1. **Drain** — calls `workTracker.skipAllPending()`, marking all pending items as `skipped`
2. **Spawn** — creates a recovery work unit (pathseeker or spiritmender) and starts it immediately
3. **Finish** — already-running agents continue to completion (they're `started`, not `pending`)

Once all agents finish and the recovery agent completes, the quest either succeeds (all items
complete/skipped) or reaches a new failure which repeats the cycle (depth-limited).

`skipped` is a terminal status like `failed` but does NOT count as a failure — it means the item was
intentionally bypassed. Skipped deps do NOT satisfy `dependsOn` (the dependent item would be blocked,
but in practice it's also skipped by the drain).

**Siegemaster** does NOT use drain+skip. It handles failure by inserting a fix chain (codeweaver-fix →
ward-rerun → siege-recheck) directly into the quest's work items.

### MCP Sanitization

The MCP `modify-quest` tool strips server-only fields before passing to the orchestrator:

- `workItems` — server-only, managed by orchestration loop
- `wardResults` — server-only, written by ward layer broker

## Quest Event Notification (Two-Tier Model)

Quest mutations use a **file outbox** for cross-process notification. Transient chat events stay on the in-memory bus.

| Tier | Events | Mechanism |
|------|--------|-----------|
| **Persistent mutations** | quest-modified, quest-created | File outbox (`event-outbox.jsonl`) — automatic via `questPersistBroker` |
| **Transient streams** | chat-output, chat-complete, clarification-request, quest-session-linked, etc. | In-memory `orchestrationEventsState` bus |

**How it works:**
- All 4 quest mutation brokers write through `questPersistBroker` (file write + outbox append)
- `questOutboxWatchBroker` tails the outbox file and fires callbacks on new lines
- Server starts the watcher at init and broadcasts `quest-modified` WS messages

**Rules:**
- NEVER emit `quest-modified` or `quest-created` on `orchestrationEventsState` — those go through the outbox only
- NEVER call `fsWriteFileAdapter` directly for quest files — always use `questPersistBroker`
- Transient chat events stay on in-memory bus (single-process, high-frequency)

## User-Invoked Skills

| Skill          | Purpose                                                            |
|----------------|--------------------------------------------------------------------|
| `/quest`       | ChaosWhisperer — BDD spec creation with two human approval gates   |
| `/quest:start` | Start execution, poll progress                                     |
| `/test`        | Write unit tests for existing code                                 |
| `/tegrity`     | Fix lint + type errors iteratively                                 |
| `/document`    | Update project standards docs                                      |

## Agents (MCP-Delivered)

Agents get their prompts dynamically via the `get-agent-prompt` MCP tool. Parent roles spawn an agent and instruct it to
call `get-agent-prompt` as its first action.

| Agent                           | Spawned By          | Purpose                                                      |
|---------------------------------|---------------------|--------------------------------------------------------------|
| chaoswhisperer-gap-minion       | ChaosWhisperer      | Validate spec completeness before execution                  |
| pathseeker-surface-scope-minion | PathSeeker pipeline | Surface-scope research per slice; writes `surfaceReports[]`  |
| pathseeker-quest-review-minion  | PathSeeker pipeline | Verify + semantic review after steps; writes `reviewReport`  |
