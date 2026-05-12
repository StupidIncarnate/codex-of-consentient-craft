# @dungeonmaster/orchestrator

## Chat-line translation: this package owns it

The orchestrator is the single place where raw Claude CLI output (stdout stream-json OR the
JSONL file on disk) is translated into structured `ChatEntry[]`. The server just relays the
translated entries; the web just renders them. **If you're adding logic that parses a string
format, filters stream content, or converts one shape into another — it goes here.**

DO NOT ADD MIGRATION LOGIC! THIS PACKAGE IS STILL GREENFIELD!

### The unified funnel

Every line from every source — live stdout during streaming, sub-agent JSONL file, replay of
the main JSONL — passes through a single factory:

```
chatLineProcessTransformer() → processor.processLine({ line, source, agentId? }) → ChatLineOutput[]
```

`ChatLineOutput` has two variants:

- `{ type: 'entries', entries: ChatEntry[] }` — one or more ready-to-render entries
- `{ type: 'agent-detected', toolUseId, agentId }` — fired when the processor learns the
  "real" internal sub-agent id from `tool_use_result.agentId`. Consumers (chat-spawn-broker)
  use this to start `chatSubagentTailBroker` with the correct JSONL filename key. **NOT
  broadcast to the web** — the web's chain grouping uses `toolUseId` (eagerly stamped on the
  Task entry and on all sub-agent lines via the convergence below), not the real agentId.
  Wire-level correlation is complete the moment each entry ships, so the web never receives
  follow-up patches.

### chatStreamProcessHandleBroker — the per-spawn entry point

**If you are spawning a Claude CLI process anywhere in the orchestrator, route its lines
through `chatStreamProcessHandleBroker`.** Do NOT call `chatLineProcessTransformer` directly
and do NOT hand-roll `rawLine → ChatEntry[]` translation.

The handle broker owns the per-spawn lifecycle:

- One `chatLineProcessTransformer` instance per agent (so the realAgentId↔toolUseId reverse
  map is shared across that agent's stdout stream AND any sub-agent JSONL tails it triggers)
- Auto-dispatch of `chatSubagentTailBroker` on every `agent-detected` signal
- Memoized `sessionId` capture from the first system/init line
- Plain-text fallback for non-JSON stdout (`spawnerType: 'command'` ward runs) so ward
  output renders verbatim as a single assistant-text entry
- `stop()` to compose into kill callbacks; `initialDrains()` to await pre-existing sub-agent
  JSONL drain before declaring the spawn complete

Wire it once per spawn and keep the handle alive for the spawn's lifetime:

```ts
const handle = chatStreamProcessHandleBroker({
    chatProcessId,
    guildId,
    sessionId, // optional; auto-captured from system/init if omitted
    onEntries: ({entries, sessionId}) => { /* relay to bus / web */
    },
});
agentSpawnUnifiedBroker({prompt, onLine: ({line}) => handle.onLine({rawLine: line})});
await handle.initialDrains();
// later, in teardown:
handle.stop();
```

Every existing spawn site already does this — `chatSpawnBroker` (chaoswhisperer /
glyphsmith), `runOrchestrationLoopLayerResponder`, `orchestrationResumeResponder`,
`recoverGuildLayerResponder`, `questModifyResponder`, and the orchestration-quest harness
each keep a `Map<QuestWorkItemId, handle>` and route per-work-item lines through it. New
spawn pipelines must follow the same shape; the convergence below depends on it.

### Two-source sub-agent correlation (READ THIS IF YOU ARE TOUCHING SUB-AGENT CODE)

Claude CLI emits sub-agent activity in TWO incompatible shapes depending on the source:

| Source | What links sub-agent to parent Task? | Where the link lives |
|--------|---------------------------------------|----------------------|
| **Streaming (stdout)** | `parent_tool_use_id` field (top-level) | On **every** sub-agent line |
| **File (JSONL on disk)** | `agentId` = real internal id | Sub-agent's JSONL filename (`subagents/agent-<realAgentId>.jsonl`) + inside each line |

The translation between the two lives in ONE place: the main session JSONL's `user` tool_result
line, where `tool_use_result.agentId` (real id) sits alongside the content item's `tool_use_id`
(Task's id). If you don't converge them before they enter the funnel, downstream code ends up
with Task entries keyed by `toolUseId` and sub-agent entries keyed by real agentId — and the
web's chain grouping shows `(0 entries)` because those two keys never match.

Convergence strategy (`chat-line-process-transformer.ts`):

1. On every assistant line with a Task/Agent tool_use content item, **eagerly stamp the item
   with `agentId = item.id`** (the toolUseId). This is the wire-level correlation key.
2. On every line, check for `parent_tool_use_id`. If present (streaming source), stamp
   `source = 'subagent'` + `agentId = parentToolUseId`.
3. For file-sourced lines with NO `parent_tool_use_id` but an `agentId` param (= real
   internal id from the JSONL filename), look up the Task's toolUseId in the processor's
   reverse map and synthesize `parent_tool_use_id` before proceeding. The reverse map is
   populated three ways:
   - **(a) live during streaming:** as `user.tool_result` lines flow through the processor,
     each one carrying `tool_use_result.agentId` (real id) alongside the content item's
     `tool_use_id` (Task's id) registers the pair.
   - **(b) replay pre-scan 1a (`chat-history-replay-broker.ts`):** the same `tool_use_result`
     scan, run before pass 2 begins. This is required because sub-agent lines sort earlier
     than their own completion tool_result; without the pre-scan they'd reach pass 2 before
     a translation existed.
   - **(c) replay pre-scan 1b (`chat-history-replay-broker.ts`):** **prompt-text equality
     pairing** for in-flight Tasks. When the user pauses or interrupts a run before the
     Task's completion `user.tool_result` lands, neither (a) nor (b) registers the pair.
     The replay broker then walks every assistant Task/Agent `tool_use` whose `id` is still
     unpaired, reads the first line of each unclaimed subagent JSONL on disk, and pairs them
     when `subagentLine0.message.content` (string) **byte-equals** the Task's `input.prompt`.
     Claude CLI passes the prompt verbatim from `Task.input.prompt` to the subagent's first
     user-text line, so this is an id-equivalent pairing, not a fuzzy text match.
4. After the three preceding steps, the emitted `ChatEntry` shape is identical regardless of
   source. Everything downstream (the web, collect-subagent-chains, etc.) operates on one
   uniform wire contract.

**Why pass-1b exists (prompt-text pairing for in-flight Tasks):**

The completion `user.tool_result` line is the ONLY place Claude CLI co-locates `toolUseId`
with `tool_use_result.agentId` (the real internal id). For a paused/interrupted run, that
line never gets written, so paths (a) and (b) have nothing to register. Without pass-1b, the
subagent JSONL's lines flow through pass 2 with `agentId = realAgentId` (from the filename)
instead of `agentId = toolUseId`. The web's `collectSubagentChainsTransformer` keys chain
membership on toolUseId, so those entries fall out of `innerGroups` and render as **orphan
trailing singletons** below the chain header — visible to the user as "SUB-AGENT" rows
floating below the last chain with no header above them.

**Why prompt-text equality is the right pairing key:**

Claude CLI does not write any cross-file id link before the completion tool_result lands. We
audited every field on both surfaces:

- Parent's Task tool_use line carries `uuid`, `parentUuid`, `requestId`, `promptId`, content
  item `id` (= toolUseId), `input.{description, prompt, subagent_type, model}`.
- Subagent JSONL line 0 carries `uuid`, `parentUuid: null`, `promptId`, `agentId`
  (= realAgentId, also in filename), `message.content` (string = the prompt verbatim).

`promptId` identifies the parent user-prompt **turn**, not the individual Task — when one
turn fires N parallel Tasks, all N subagent files share the same `promptId`, so it's a
1-to-N grouping not a pairing. No other id co-occurs. The only field with byte-identical
content on both sides is the prompt itself.

For the prompt-collision corner case (two parallel Tasks with identical `input.prompt`):
each subagent file is still its own distinct sub-agent with its own realAgentId and JSONL
file, so pass-1b produces two separate chain groups regardless of which Task it pairs each
file to. Identical prompts also produce identical chain headers (same description, same
subagent_type), so a swapped pairing is visually indistinguishable. No tiebreaker needed.

**Tests that protect this convergence:**

- `chat-streaming-subagent-grouping.spec.ts` — streaming path via fake Claude CLI stdout.
- `chat-replay-subagent-grouping.spec.ts` — file-replay path via pre-seeded JSONL on disk.
  Two cases: completed Task (pass-1a) and in-flight Task with no completion (pass-1b).
- `chat-history-replay-broker.test.ts` — unit-level coverage of all three reverse-map
  population paths, including the prompt-text pairing.

If you touch sub-agent correlation, ALL of these tests must stay green. If one passes and
the others fail, the two sources are drifting apart again — do NOT "fix" by adjusting
web-side lookup logic; go back to the processor / replay broker and restore the invariant
that all paths produce identical ChatEntry shapes.

### Line-shape cheat sheet

The stream-line contracts in `@dungeonmaster/shared/contracts/*-stream-line/` (plus their
stubs) capture the common assistant/user message shape. They do NOT capture the fields
involved in sub-agent correlation — zod strips unknown keys; raw line normalization keeps
them. Below are the sub-agent-specific keys, verbatim from captured Claude CLI output.

**Streaming (stdout) — sub-agent lines carry `parent_tool_use_id` at the top level:**
```json
{
  "type": "assistant",
  "message": { "role": "assistant", "content": [ /* tool_use or text */ ] },
  "parent_tool_use_id": "toolu_01K6qfGEd8bFzkPvY8nHt1Ts",
  "session_id": "8bd90844-...",
  "uuid": "6257d359-..."
}
```
`parent_tool_use_id` is `null` on parent lines and the Task's own `tool_use_id` on
sub-agent lines. After `claudeLineNormalizeBroker` runs, the key is `parentToolUseId`.

**Streaming (stdout) — Task completion user tool_result carries `tool_use_result.agentId`
— the real internal agentId Claude CLI assigned to the sub-agent run:**
```json
{
  "type": "user",
  "parent_tool_use_id": null,
  "message": { "role": "user", "content": [ { "type": "tool_result", "tool_use_id": "toolu_01K6...", "content": "..." } ] },
  "tool_use_result": { "agentId": "a750c8bc", "status": "completed", ... }
}
```
This line is the ONLY place where `toolUseId` (Task's id) and `agentId` (real internal id)
co-occur. The reverse map is populated from here.

**File (main session JSONL on disk) — `<sessionId>.jsonl`:**
```json
{
  "parentUuid": "dd4198e9-...",
  "isSidechain": false,
  "message": { "role": "assistant", "content": [ { "type": "tool_use", "id": "toolu_...", "name": "Agent", "input": {...} } ] },
  "type": "assistant"
}
```
No `parent_tool_use_id` field. The completion `user` line carries `toolUseResult.agentId`
(camelCase — different from streaming's `tool_use_result`); this is the translation key
the replay pre-scan reads.

**File (sub-agent JSONL on disk) — `subagents/agent-<realAgentId>.jsonl`:**
```json
{
  "parentUuid": "4191db7e-...",
  "isSidechain": true,
  "agentId": "a0a7f82d9619a1800",
  "message": { "role": "assistant", "content": [...] }
}
```
`agentId` appears as a top-level field on EVERY line. `isSidechain: true` marks this as
sub-agent activity. The filename itself (`agent-${realAgentId}.jsonl`) is the primary key
the replay broker uses to tag lines when feeding them into the processor.

Field-presence matrix (post-normalization, camelCase):

| Field | Streaming parent | Streaming sub-agent | File main | File sub-agent |
|---|:-:|:-:|:-:|:-:|
| `parentToolUseId` | null | **set** | — | — |
| `toolUseResult.agentId` | set on Task completion | — | set on Task completion | — |
| `parentUuid` | — | — | set | set |
| `isSidechain` | — | — | `false` | `true` |
| top-level `agentId` | — | — | — | **set** |
| `sessionId` | set | set | — | — |
| `timestamp` | sometimes | sometimes | set | set |

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

### Message contract null-tolerance — DO NOT use `.optional()` alone on Claude CLI fields

Claude CLI streams explicit `null` (not `undefined`) for assistant message-level fields like
`stop_reason`, `stop_sequence`, `model` on every assistant delta until a turn settles. The
`message` block in `normalizedStreamLineContract` and `assistantStreamLineContract` MUST use
`.nullish()` (= `.nullable().optional()`), never `.optional()` alone.

**Failure mode if you regress this:** `safeParse` rejects every assistant line, the
processor's early return fires (`if (!lineParse.success) return [];`), and **every assistant
text + tool_use entry silently disappears from the WebSocket wire**. Streaming goes dark
end-to-end while file replay still works (because replay parses the same shape and hits the
same bug — but only after stream has already missed everything live). The regression is
invisible unless a stream-vs-replay parity test is in place.

Stubs in `@dungeonmaster/shared/contracts/assistant-stream-line/` and
`claude-queue-response.stub.ts` build assistant lines with `stop_reason: null` baked in so
every E2E using these stubs exercises the null-tolerance path automatically. Do not strip
that field from the stubs — you'd silently turn the parity tests into false positives.

The unit regression in `chat-line-process-transformer.test.ts`
(`describe('regression: Claude CLI null stop_reason on streamed deltas')`) feeds a real
Claude-shape line through the processor and asserts the entry survives. Keep it green.
4. Do NOT add parsing on the server or the web.

## Callouts

- **Agent prompts are served dynamically via the `get-agent-prompt` MCP tool.** Source of truth is in
  `packages/orchestrator/src/statics/` (e.g., `chaoswhisperer-gap-minion-statics.ts`,
  `pathseeker-surface-scope-minion-statics.ts`, `pathseeker-contract-dedup-minion-statics.ts`,
  `pathseeker-assertion-correctness-minion-statics.ts`). There are no `.claude/agents/*.md` files for these agents —
  parent roles tell spawned agents to call the MCP tool to get their instructions.

## Quest Pipeline

```
Web UI "Start Chat" ──► server chat-start-responder ──► chat-spawn-broker (role: chaoswhisperer)
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
Web UI "Start Quest" ──► server orchestration-start-responder  (or: MCP start-quest tool)
  │
  ▼
Orchestration Loop (workItems queue)
  │  "find next ready item, run it, repeat"
  │
  ├─ PathSeeker ──── phased statuses (seek_scope → seek_synth → seek_walk) + cleanup minions during seek_walk (contract-dedup, assertion-correctness)
  ├─ Codeweaver ──── x3 concurrent via slot manager, 1+ steps each (chunked by `agents.batchGroups`, capped at `defaultMaxStepsPerChunkStatics.value`)
  │     └─ PathSeeker on failure (drain + skip + replan)
  ├─ Ward ────────── npm run ward (spawnerType: 'command')
  │     └─ Spiritmender on failure (targeted code fix)
  ├─ Siegemaster ─── integration tests for observables
  │     └─ Creates fix chain: codeweaver-fix → ward-rerun → siege-recheck
  ├─ Lawbringer ──── x3 concurrent via slot manager, 1+ steps each (same chunking as codeweaver)
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
created ──► explore_flows ──► review_flows ──► flows_approved ──► explore_observables ──► review_observables ──► approved ──► seek_scope ──► seek_synth ──► seek_walk ──► in_progress ──► complete
                                    │                                                          │                   │                          │              │              │
                                    └──► explore_flows (back)                                   └──► explore_observables (back)                └──► seek_scope │              ├──► blocked ──► in_progress
                                                                                                                   │                                         └──► seek_scope │         └──► abandoned
                                                                                                                   ▼                                                                  └──► abandoned
                                                                                                            explore_design ──► review_design ──► design_approved ──► seek_scope ...
                                                                                                                                      │
                                                                                                                                      └──► explore_design (back)

                                                                                                 in_progress ──► seek_walk (failure routing)
                                                                                                 in_progress ──► seek_scope (full replan)
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
| `in_progress`         | `start-quest` / PathSeeker transition from `seek_walk`    | Steps can be added/modified                               |
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

These writes flow through the same `modify-quest` pipeline as PathSeeker's own writes; the `questStatusInputAllowlistStatics` entry for each seek_* status governs exactly which `planningNotes.*` sub-fields are writable at that status. Minion output is durable the moment it's committed — a minion crash after write does not lose work.

PathSeeker itself reads accumulated planning state via the `get-quest-planning-notes` MCP tool when resuming after a restart or downstream failure.

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

## Quest Kickoff Surfaces

| Surface                                | Purpose                                                                     |
|----------------------------------------|-----------------------------------------------------------------------------|
| Web UI "New Chat" / "Start Chat"       | Hits server `chat-start-responder`; spawns ChaosWhisperer spec conversation |
| MCP `start-quest` tool                 | Programmatic quest execution kickoff (agents + tests)                       |
| Server `orchestration-start-responder` | HTTP endpoint that the Web UI "Start Quest" button calls                    |

## Agents (MCP-Delivered)

Agents get their prompts dynamically via the `get-agent-prompt` MCP tool. Parent roles spawn an agent and instruct it to
call `get-agent-prompt` as its first action.

| Agent                           | Spawned By          | Purpose                                                     |
|---------------------------------|---------------------|-------------------------------------------------------------|
| chaoswhisperer-gap-minion             | ChaosWhisperer      | Validate spec completeness before execution                                                                       |
| pathseeker-surface-scope-minion       | PathSeeker pipeline | Surface-scope research per slice; writes `surfaceReports[]`                                                       |
| pathseeker-contract-dedup-minion      | PathSeeker pipeline | Cross-slice contract near-duplicates + in-package similar-contract scan during seek_walk; writes steps[] + contracts[] |
| pathseeker-assertion-correctness-minion | PathSeeker pipeline | Assertion well-formedness + clause-mapping depth + paraphrased banned matchers + per-prefix field correctness during seek_walk; writes steps[] |
