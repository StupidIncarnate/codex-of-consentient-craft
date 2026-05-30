# @dungeonmaster/orchestrator

## Chat-line translation: this package owns it

The orchestrator is the single place where raw Claude CLI output (the JSONL files on disk
that the user's interactive Claude session writes) is translated into structured
`ChatEntry[]`. The server just relays the translated entries; the web just renders them.
**If you're adding logic that parses a string format, filters stream content, or converts
one shape into another — it goes here.**

The translation pipeline is driven by `quest-monitor-jsonl-watcher-broker`, which tails the
`/dumpster-launch` session JSONL plus its `subagents/agent-*.jsonl` siblings as they appear
on disk. There is no orchestrator-spawned Claude process — the user's own session writes the
JSONL files and the watcher feeds them through the funnel below.

DO NOT ADD MIGRATION LOGIC! THIS PACKAGE IS STILL GREENFIELD!

### The unified funnel

Every line from every source — parent session JSONL tail, sub-agent JSONL file, replay of
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

### chatStreamProcessHandleBroker — the per-handle entry point

**If you are feeding lines into the chat pipeline, route them through
`chatStreamProcessHandleBroker`.** Do NOT call `chatLineProcessTransformer` directly and do
NOT hand-roll `rawLine → ChatEntry[]` translation.

The handle broker owns the per-handle lifecycle:

- One `chatLineProcessTransformer` instance per session (so the realAgentId↔toolUseId
  reverse map is shared across that session's JSONL tail AND any sub-agent JSONL tails it
  triggers)
- Auto-dispatch of `chatSubagentTailBroker` on every `agent-detected` signal
- Memoized `sessionId` capture from the first system/init line
- Plain-text fallback for non-JSON lines (`spawnerType: 'command'` ward runs invoked via the
  `run-ward` MCP tool) so ward output renders verbatim as a single assistant-text entry
- `stop()` to compose into teardown callbacks; `initialDrains()` to await pre-existing
  sub-agent JSONL drain before declaring catch-up complete

`quest-monitor-jsonl-watcher-broker` constructs one handle for the registered
`/dumpster-launch` session and keeps it alive for the session's lifetime. The legacy spawn
brokers (`chatSpawnBroker`, `runOrchestrationLoopLayerResponder`,
`orchestrationResumeResponder`, `recoverGuildLayerResponder`) remain on disk and still wire
through the same handle shape for any code path that hasn't moved to the
`/dumpster-launch` flow; the convergence below depends on every feeder following this
shape.

### Two-source sub-agent correlation (READ THIS IF YOU ARE TOUCHING SUB-AGENT CODE)

Claude CLI emits sub-agent activity in TWO incompatible shapes depending on the source:

| Source                                                 | What links sub-agent to parent Task?   | Where the link lives                                                                  |
|--------------------------------------------------------|----------------------------------------|---------------------------------------------------------------------------------------|
| **Streaming (legacy spawn stdout)**                    | `parent_tool_use_id` field (top-level) | On **every** sub-agent line                                                           |
| **File (JSONL on disk — the `/dumpster-launch` path)** | `agentId` = real internal id           | Sub-agent's JSONL filename (`subagents/agent-<realAgentId>.jsonl`) + inside each line |

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

| Path                            | Broker                                                | Source                                                         | Start position |
|---------------------------------|-------------------------------------------------------|----------------------------------------------------------------|----------------|
| `/dumpster-launch` session tail | `quest-monitor-jsonl-watcher-broker`                  | Registered launch session's `<sessionId>.jsonl` (live append)  | `end`          |
| Sub-agent tail                  | `chat-subagent-tail-broker`                           | `subagents/agent-<id>.jsonl` written by Task-dispatched agents | `beginning`    |
| Parent replay (web reopen)      | `chat-history-replay-broker`                          | `<sessionId>.jsonl` (full read for catch-up of past entries)   | —              |
| Legacy spawn stdout / tail      | `chat-spawn-broker` + `chat-main-session-tail-broker` | CLI stdout via `spawn-stream-json` + post-exit JSONL tail      | — / `end`      |

The `/dumpster-launch` session tail is the live driver under the dispatch-loop flow. The
sub-agent tail watches `subagents/agent-*.jsonl` siblings as new files appear (each Task
the launch session dispatches creates one). The replay path is what hydrates the web UI's
chat history when a browser reconnects to a quest that's mid-flight. The legacy spawn path
still backs any code path that hasn't moved to the launch model (e.g. surviving
non-pathseeker callers of `chat-spawn-broker`).

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

### Tail lifecycle

The `quest-monitor-jsonl-watcher-broker` owns the lifecycle of both tails it starts for
each active parent session. The watcher reactor lives in
`packages/server/src/responders/quest-driven-watchers/bootstrap/` on the HTTP server. It
maintains a `Map<SessionId, WatcherHandle>` keyed on the union of `workItems[].sessionId`
across all active quests, reconciles on every quest-modified outbox event (and via a 3s
fallback poll for direct quest.json writes), and starts/stops `questMonitorWatcherStartBroker`
instances to match. Multiple watcher instances coexist — one per active parent session.

- `fsWatchTailAdapter` accepts an optional `startPosition: 'beginning' | 'end'` param.
  Pass `'beginning'` for sub-agent tails — they must drain the JSONL Claude already wrote
  while the parent blocked on the Task tool. Pass `'end'` for the parent
  `/dumpster-launch` session tail — only NEW appends from the moment the watcher starts
  forward should emit.
- The watcher captures `sessionId` from the first system/init line it sees and starts the
  parent tail at `'end'`. As `Task`-dispatched agents create their own
  `subagents/agent-<id>.jsonl` files, `chatSubagentTailBroker` instances spin up against
  each one at `'beginning'`.

The legacy `chat-start-responder` still composes its own tail lifecycle for the surviving
spawn paths, with the same `fsWatchTailAdapter` semantics.

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
  `pathseeker-surface-statics.ts`, `pathseeker-dedup-statics.ts`,
  `pathseeker-assertion-correctness-statics.ts`, `pathseeker-walk-statics.ts`). There are no
  `.claude/agents/*.md` files for these agents — the `/dumpster-launch` dispatcher tells each
  Task-spawned sub-agent to call the MCP tool to get its instructions.

## Quest Pipeline

```
User runs /dumpster-create in their Claude session
  │   (slash command body = YAML frontmatter + dumpsterCreatePromptStatics template,
  │    composed inline in slash-commands-statics — no get-agent-prompt MCP fetch)
  ▼
ChaosWhisperer (the slash-command-loaded session) executes the prompt in order:
  │   1. Creates the new quest via mcp__dungeonmaster__create-quest
  │   2. Opens /<guildSlug>/quest/<questId>?chat=hidden in the web UI
  │   3. Walks the user through the status lifecycle below
  │
  ├─ Phase 1: Discovery ──────── explore codebase, interview user → status: explore_flows
  ├─ Phase 2: Flow Mapping ────── mermaid diagrams (mandatory) → status: review_flows
  ├─ Phase 3: Gate #1 ─────────── user approves flows → status: flows_approved
  ├─ Phase 4: Observables ─────── embedded in flow nodes → status: explore_observables → review_observables
  ├─ Phase 5: Gate #2 ─────────── user approves observables + contracts + packagesAffected[] → status: approved
  │
  ▼
Web UI "Start Quest" button ──► server orchestration-start-responder
  │   Mutates quest.status; redirects to execute view; does NOT spawn anything.
  │   Execute view banner: "Run /dumpster-launch in your Claude session."
  │
  ▼
User runs /dumpster-launch (long-lived dispatch loop in their session)
  │   Loop: get-next-step() → Task() / run-ward() → await → repeat
  │
  ├─ pathseeker-surface ──── N parallel via Task() (one per affected package)
  ├─ pathseeker-dedup + pathseeker-assertion-correctness ──── 2 parallel via Task()
  ├─ pathseeker-walk ─────── single Task(); on complete the signal-back handler fires the post-walk hook
  │     │
  │     ▼   (post-walk hook runs stepsToWorkItemsTransformer over authored steps + flows)
  ├─ Codeweaver ──── one Task() per chunk; chunked by `agents.batchGroups`, capped at `defaultMaxStepsPerChunkStatics.value`
  ├─ Ward (changed)─ mcp__dungeonmaster__run-ward({mode: 'changed'}); spawnerType: 'command'
  ├─ Siegemaster ─── one Task() per flow, chained (at most one at a time); integration/E2E tests for observables
  ├─ Lawbringer ──── one Task() per chunk; same chunking as codeweaver
  ├─ Blightwarden ── single Task(); whole-diff cross-cutting audit
  ├─ Ward (full) ─── mcp__dungeonmaster__run-ward({mode: 'full'}); spawnerType: 'command'
  │
  │   (no recovery items are auto-created on failure — see "Failure handling (current path)")
  ▼
Complete ──► /dumpster-launch's next get-next-step() picks up the next FIFO quest in the queue
```

## Work Items Model

All execution is driven by `quest.workItems[]`. Each work item is a generic container with a `role`,
`status`, `dependsOn` (ordering), and `relatedDataItems` (links to quest-level data like steps or wardResults).

- **Ordering**: `dependsOn` array — item runs when all deps are complete/skipped
- **Dispatch**: `quest-get-next-step-broker` selects ready work items from the FIFO-active quest and returns a
  `NextStep` (`spawn-agents` / `run-ward` / `idle`) to `/dumpster-launch`, which then Task()s the agents or calls the
  `run-ward` MCP tool
- **Concurrency**: intrinsic — `pathseeker-surface` items (siblings via `dependsOn: []`) return as one `spawn-agents`
  batch; `pathseeker-dedup` + `pathseeker-assertion-correctness` return as one batch; everything else returns one agent
  per response. `slotManagerStatics` slot caps stay configured but are not consulted by `get-next-step`.
- **Dynamic insertion**: the mechanism is to append work items with correct `dependsOn`. The one live use is the
  `pathseeker-walk` post-completion hook, which calls `stepsToWorkItemsTransformer` to generate the downstream
  codeweaver / ward / siegemaster / lawbringer / blightwarden chain. Recovery insertions (retries, spiritmenders, fix
  chains) would use the same mechanism but are not currently wired — see "Failure handling (current path)".
- **Session tracking**: each work item carries `sessionId` (parent /dumpster-launch session UUID) AND `agentId`
  (the sub-agent's realAgentId, used to scope chat replay to one `subagents/agent-<id>.jsonl` file). For chat
  roles (ChaosWhisperer, Glyphsmith), `sessionId` is captured from the spawned Claude's first stream-json init
  line via `chat-spawn-broker`'s `onSessionId` callback. For every Task-dispatched sub-agent under
  `/dumpster-launch`, both fields are stamped MCP-side: when the sub-agent calls `get-agent-prompt`, the MCP
  responder reads `request.params._meta.claudecode/toolUseId` — the toolUseId of the SUB-AGENT'S OWN MCP call
  (NOT the parent Task() dispatch id) — and passes it to `claudeCodeParentSessionFindByToolUseIdBroker`, which
  scans every `~/.claude/projects/<encoded-cwd>/<sessionId>/subagents/agent-*.jsonl` file for an assistant line
  whose `tool_use.id` matches. The matching JSONL's basename yields `realAgentId`; its containing session dir
  yields `parentSessionId`. The broker retries on miss (~3 s budget) to absorb the Claude-Code-dispatches-MCP-call-
  before-flushing-JSONL race. Result is stamped via `modify-quest`, deterministic across any number of parallel
  Claude sessions in the same cwd.
- **Ward**: only non-agent item (`spawnerType: 'command'`); driven by the `run-ward` MCP tool which blocks until ward
  exits and persists the result onto the work item

## Quest Status Lifecycle

```
pending ──┐
           ▼
created ──► explore_flows ──► review_flows ──► flows_approved ──► explore_observables ──► review_observables ──► approved ──► in_progress ──► complete
                                    │                                                          │                   │                                │
                                    └──► explore_flows (back)                                   └──► explore_observables (back)                      ├──► blocked ──► in_progress
                                                                                                                   │                                 └──► abandoned
                                                                                                                   ▼
                                                                                                            explore_design ──► review_design ──► design_approved ──► in_progress
                                                                                                                                      │
                                                                                                                                      └──► explore_design (back)
```

The `seek_scope` / `seek_synth` / `seek_walk` enum values remain on the contract for
quest.json backward compatibility but are no longer assigned by any transition. The
pathseeker phase boundaries that those statuses used to encode are now expressed as
`dependsOn` edges on the four `pathseeker-*` work items (see "PathSeeker work-item graph"
below).

| Status                | Set By                                          | Gate                                                                                              |
|-----------------------|-------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `created`             | `add-quest`                                     | ChaosWhisperer starting up                                                                        |
| `explore_flows`       | ChaosWhisperer (Phase 1 exit)                   | Can add: flows, designDecisions                                                                   |
| `review_flows`        | ChaosWhisperer (Phase 2 exit)                   | User reviews flows, APPROVE button visible                                                        |
| `flows_approved`      | User approves flows (Gate #1)                   | Can add: observables (in flow nodes), contracts, tooling                                          |
| `explore_observables` | ChaosWhisperer (Phase 4 entry)                  | Can add: observables, contracts, tooling                                                          |
| `review_observables`  | ChaosWhisperer (Phase 4 exit)                   | User reviews observables, APPROVE button visible                                                  |
| `approved`            | User approves observables (Gate #2)             | Spec locked. `start-quest` or `explore_design` allowed.                                           |
| `explore_design`      | Glyphsmith starts design work                   | Create prototypes, iterate on designs                                                             |
| `review_design`       | Glyphsmith ready for design review              | User reviews designs, APPROVE button visible                                                      |
| `design_approved`     | User approves designs                           | Design locked. `start-quest` allowed.                                                             |
| `in_progress`         | `start-quest` (via Web UI "Start Quest" button) | Steps can be added/modified; `/dumpster-launch` dispatches pathseeker-* and downstream work items |
| `blocked`             | Pipeline blocker                                | Execution paused                                                                                  |
| `complete`            | All phases pass                                 | Terminal                                                                                          |
| `abandoned`           | User abandons                                   | Terminal                                                                                          |

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

## Quest Types

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). `questTypeRegistryStatics`
(`@dungeonmaster/shared/statics`) is the single source of truth per type — its intake slash command,
create-time seed role, Start-Quest `startGraphKind`, and role set. `orchestration-start-responder`
switches on `startGraphKind` to seed the matching work-item graph:

- **`feature`** (`/dumpster-create`): `questBuildPathseekerGraphBroker` seeds the PathSeeker graph; the
  post-walk hook then generates the `codeweaver → ward → siegemaster → lawbringer → blightwarden → ward`
  chain.
- **`bug-hunt`** (`/dumpster-hunt`): `questBuildBugHuntGraphBroker` hand-seeds the WHOLE chain at Start
  (no PathSeeker, no post-walk hook): `pesteater → ward(changed) → lawbringer(whole-diff) → blightwarden
  → ward(full)`. Bug-hunt reuses the flow/observable spec lifecycle — the reproduction path is a flow,
  the expected behavior an observable PestEater turns into a failing test.

Each type owns its COMPLETE work-item flow; PathSeeker's four-tier graph is the *feature* type's
planning sub-stage, not universal. Adding a type = one `questTypeRegistryStatics` entry + a graph
builder + the type added to `questTypeContract`.

## Agent Roles

On failure, every execution role's work item is simply marked `failed` (no recovery item is created on
the live path — see "Failure handling (current path)"). Because `failed` satisfies `dependsOn`, the
chain runs past it; the quest then derives `complete`/`blocked`/`in_progress` from work-item states.

| Role                             | Dispatched By                                                       | Signals                         | MCP Tools (modify-quest)                                               |
|----------------------------------|---------------------------------------------------------------------|---------------------------------|------------------------------------------------------------------------|
| ChaosWhisperer                   | `/dumpster-create`                                                  | N/A (spec)                      | full spec surface (flows, observables, contracts, packagesAffected, …) |
| Glyphsmith                       | startDesignChat                                                     | N/A (design)                    | status                                                                 |
| pathseeker-surface               | `/dumpster-launch` via Task() (N parallel, one per slice)           | complete, failed                | planningNotes (surface slice), steps (slice), contracts (slice)        |
| pathseeker-dedup                 | `/dumpster-launch` via Task() (after surface)                       | complete, failed                | steps, contracts (in-package + cross-slice dedup)                      |
| pathseeker-assertion-correctness | `/dumpster-launch` via Task() (after surface)                       | complete, failed                | steps (assertion correctness)                                          |
| pathseeker-walk                  | `/dumpster-launch` via Task() (after dedup + assertion-correctness) | complete, failed                | planningNotes.walkFindings, steps (exploratory)                        |
| Codeweaver                       | `/dumpster-launch` via Task()                                       | complete, failed                | none                                                                   |
| Ward                             | `/dumpster-launch` via `run-ward` MCP tool (command)                | terminal set by exit code       | none (server writes wardResults + item status)                         |
| Siegemaster                      | `/dumpster-launch` via Task() (one per flow, chained)               | complete, failed                | none                                                                   |
| Lawbringer                       | `/dumpster-launch` via Task() (whole-diff mode for bug-hunt)        | complete, failed                | none                                                                   |
| Blightwarden                     | `/dumpster-launch` via Task()                                       | complete, failed-replan, failed | none                                                                   |
| Spiritmender                     | `/dumpster-launch` via Task()                                       | complete, failed                | none                                                                   |
| PestEater                        | `/dumpster-launch` via Task() (bug-hunt front; reads quest itself)  | complete, failed                | none                                                                   |

### PathSeeker work-item graph

PathSeeker is dispatched as four distinct work-item roles, each with `dependsOn` edges that
encode the previous three-phase (seek_scope / seek_synth / seek_walk) ordering:

```
pathseeker-surface (×N slices, one per packagesAffected entry, dependsOn: [])
        │
        ▼   (after all surface items complete)
pathseeker-dedup + pathseeker-assertion-correctness (parallel, dependsOn: [...all surface ids])
        │
        ▼   (after both corrections complete)
pathseeker-walk (single, dependsOn: [dedup, assertion-correctness])
        │
        ▼   (post-success hook)
stepsToWorkItemsTransformer fires → codeweaver / ward / siegemaster / lawbringer / blightwarden chain inserted
```

Slice generation: on Start Quest, the work-item insertion broker reads
`quest.packagesAffected[]` (declared during ChaosWhisperer spec approval), builds one slice
per package into `scopeClassification.slices[]`, and inserts the graph above.

Each pathseeker-* work item writes its own output directly via `modify-quest`. Writes flow
through the same `modify-quest` pipeline as any other agent; the
`questStatusInputAllowlistStatics` entry for `in_progress` governs which `planningNotes.*`
sub-fields are writable. Work-item output is durable the moment it's committed — a Task
crash after write does not lose work. Resumed work items read accumulated planning state
via the `get-quest-planning-notes` MCP tool.

## Signal System

Agents report via the `signal-back` MCP tool. The live handler is
`quest-handle-signal-back-responder.ts`, which does exactly two things:

1. Marks the named work item terminal — `complete` for signal `complete`, `failed` for signal `failed`
   **or** `failed-replan` — and stamps `completedAt`.
2. If the item is `pathseeker-walk` AND the signal is `complete`, fires `questPostWalkHookBroker` to
   generate the downstream codeweaver/ward/siegemaster/lawbringer/blightwarden chain.

### Failure handling (current path)

There is no failure-recovery routing wired into the `/dumpster-launch` flow. A `failed` signal just
marks the item `failed`; `run-ward` marks a non-zero ward `failed` and persists the result (it
explicitly delegates retry/recovery away — `quest-run-ward-broker.ts`). No recovery work items
(spiritmenders, ward-retries, siege fix chains, pathseeker replans) are created anywhere on the live
path. `failed-replan` is recorded as a plain `failed`.

A `failed` item **satisfies** its dependents (`satisfiesDependencyWorkItemStatusGuard` =
`{complete, failed}`), so the chain runs past a failure rather than halting. Quest status is then
derived by `workItemsToQuestStatusTransformer`:

- every item terminal AND none `failed` → `complete`
- any item `in_progress` → `in_progress`
- pending items remain AND each depends on a `failed` id → `blocked`
- otherwise unchanged (a `failed` item with nothing pending leaves the quest `in_progress` — the stuck
  state)

`skipped` is terminal and non-failure, but does NOT satisfy `dependsOn` — a `skipped` dep blocks its
dependents permanently.

> The per-role recovery apparatus (drain+skip, batched spiritmenders, ward-retry items, the siege fix
> chain `codeweaver-fix → ward-rerun → siege-recheck`, pathseeker replans) lives only in the
> unreferenced `run-*-layer-broker` / `slot-manager/` / `questOrchestrationLoopBroker` code. When
> recovery returns it will hang off the `signal-back` handler and the `run-ward` broker — the two
> places that currently set terminal status.

### MCP Sanitization

The MCP `modify-quest` tool strips server-only fields before passing to the orchestrator:

- `workItems` — server-only, managed by the `signal-back` handler + post-walk hook
- `wardResults` — server-only, written by `quest-run-ward-broker`

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

| Surface                                | Purpose                                                                                                                                                                   |
|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/dumpster-create` slash command       | Primary entry point (feature). Runs ChaosWhisperer in the user's Claude session; creates the new quest via MCP as its first action.                                       |
| `/dumpster-hunt` slash command         | Primary entry point (bug-hunt). Runs the BugHunt intake; first action is `create-quest` with `questType: 'bug-hunt'`, then captures the repro flow + expected observable. |
| `/dumpster-launch` slash command       | Primary entry point. Long-lived dispatch loop in the user's Claude session; calls `get-next-step()` → Task() / `run-ward` → await → repeat across all approved quests.    |
| MCP `create-quest` tool                | Programmatic quest creation (used by ChaosWhisperer/BugHunt). Accepts optional `questType` so `/dumpster-hunt` births a `bug-hunt` quest.                                 |
| MCP `start-quest` tool                 | Programmatic transition from `approved` to `in_progress` (status mutation only — `/dumpster-launch` picks the quest up on its next pass).                                 |
| Server `orchestration-start-responder` | HTTP endpoint that the Web UI "Start Quest" button calls; mutates status and redirects to execute view. Does NOT spawn anything.                                          |

## Agents (MCP-Delivered)

Agents get their prompts dynamically via the `get-agent-prompt` MCP tool. The dispatch
surface (`/dumpster-launch`'s Task() invocations) hands each sub-agent a stub prompt that
says "call `get-agent-prompt({agent, workItemId, questId})` and follow its instructions
exactly." The MCP responder interpolates work-item-specific context (scope, package, steps,
file paths) into the returned prompt and stamps `workItem.sessionId` (parent UUID) +
`workItem.agentId` (sub-agent realAgentId) from MCP request metadata: Claude Code surfaces
`request.params._meta.claudecode/toolUseId` on every MCP call (the toolUseId of the
sub-agent's OWN MCP call, not the parent Task() dispatch id). The responder scans every
session's `subagents/agent-*.jsonl` file for an assistant line whose `tool_use.id`
matches — deterministically identifying the calling sub-agent race-free even when N
sub-agents call in parallel against the same MCP stdio child.

| Agent                            | Dispatched By                                     | Purpose                                                                                                                                                    |
|----------------------------------|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| chaoswhisperer-gap-minion        | ChaosWhisperer (inside `/dumpster-create`)        | Validate spec completeness before execution                                                                                                                |
| pathseeker-surface               | `/dumpster-launch` via Task() (N parallel)        | Slice-scoped step + contract authoring; writes `quest.steps[]` and `quest.contracts[]` for its slice                                                       |
| pathseeker-dedup                 | `/dumpster-launch` via Task() (after surface)     | Cross-slice + in-package contract dedup; writes `steps[]` + `contracts[]`                                                                                  |
| pathseeker-assertion-correctness | `/dumpster-launch` via Task() (after surface)     | Assertion well-formedness, banned-matcher scan, per-prefix `field` correctness, channel discipline; writes `steps[]`                                       |
| pathseeker-walk                  | `/dumpster-launch` via Task() (after corrections) | Full architect-review walk: trace every flow entry→exit, patch structural issues, author exploratory steps, commit `walkFindings`                          |
| pesteater                        | `/dumpster-launch` via Task() (bug-hunt front)    | Single TDD bug-fix agent: root-cause → write the failing test FIRST → fix → verify via ward. Reads the bug report from the quest; no `modify-quest` writes |
