# @dungeonmaster/orchestrator

## Chat-line translation: this package owns it

The orchestrator is the single place where raw Claude CLI output (the JSONL files on disk
that the user's interactive Claude session writes) is translated into structured
`ChatEntry[]`. The server just relays the translated entries; the web just renders them.
**If you're adding logic that parses a string format, filters stream content, or converts
one shape into another — it goes here.**

The translation pipeline is driven by `quest-monitor-jsonl-watcher-broker`, which tails each
active session's JSONL plus its `subagents/agent-*.jsonl` siblings as they appear on disk.
The session is either the user's own `/dumpster-launch` session (MCP dispatch mode) or a
headless child the Node dispatcher spawned (see "Two dispatchers" below) — in both modes the
watcher keys on `workItems[].sessionId` and feeds the files through the funnel below. The
Node dispatcher deliberately does NOT wire its children's stdout into the chat pipeline;
the file tail is the single rendering source, so lines are never double-emitted.

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

`quest-monitor-jsonl-watcher-broker` constructs one handle per active session and keeps it
alive for the session's lifetime. The chat spawn surfaces (`chatSpawnBroker`,
`orchestrationResumeResponder`, `recoverGuildLayerResponder`) wire through the same handle
shape; the convergence below depends on every feeder following this shape.

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
still backs the interactive chat callers (ChaosWhisperer / Glyphsmith) of
`chat-spawn-broker`.

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
  `packages/orchestrator/src/statics/`: the relay roles (`codeweaver-prompt-statics.ts`,
  `flowrider-prompt-statics.ts`, `siegemaster-prompt-statics.ts`, `lawbringer-prompt-statics.ts`,
  `blightwarden-prompt-statics.ts`, `spiritmender-prompt-statics.ts`, `pesteater-prompt-statics.ts`) plus the minions a
  parent summons via the Agent tool (`codeweaver-minion-statics.ts`, `lawbringer-minion-statics.ts`, the five
  `blightwarden-*-minion-statics.ts`, `chaoswhisperer-gap-minion-statics.ts`). The valid names are the
  `agentPromptNameContract` enum; `agentPromptClassificationStatics` classifies which are parent-summoned minions vs
  orchestrator-dispatched relay roles. There are no `.claude/agents/*.md` files for these agents. A relay work-item role
  calls `get-agent-prompt({agent, questId, workItemId})` — the responder resolves the work item's linked operation item
  (its `operations/<id>` ref) and interpolates its scope into the returned prompt; a parent-summoned minion calls
  `get-agent-prompt({agent, questId})` (no workItemId — it has no work item) and is briefed inline by its parent.

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
  │     │  ChaosWhisperer ALSO authors the operations ledger here: an ordered list of
  │     │  { role: 'codeweaver', text } items (one per scope a Codeweaver session builds). This is the
  │     │  ONLY ledger authoring an agent ever does — the orchestrator appends the verify tail at Start.
  ├─ Phase 5: Gate #2 ─────────── user approves observables + ≥1 codeweaver op item + packagesAffected[] → status: approved
  │
  ▼
Web UI "Start Quest" button ──► server orchestration-start-responder
  │   approved → in_progress. Seeds the relay (questBuildRelayGraphBroker): appends the quest type's
  │   startImplementationOps + the fixed verify tail as operation items and creates the FIRST work item.
  │   Redirects to execute view; banner: "Run /dumpster-launch in your Claude session."
  │
  ▼
User runs /dumpster-launch (long-lived dispatch loop in their session)
  │   Loop: get-next-step() → Task() / run-ward() → await → repeat.
  │   Each response dispatches ONE work item (= one agent session) for the operation item the relay
  │   marked in_progress; on signal-back / ward exit the relay advances to the next pending item.
  │
  │   The operations ledger drives the order. For a feature quest the sequence is:
  ├─ codeweaver ──── one session per codeweaver op item ChaosWhisperer authored; implementation + unit tests
  ├─ ward (changed)─ mcp__dungeonmaster__run-ward({mode: 'changed'}); spawnerType: 'command'
  ├─ flowrider ───── one session; authors the flow-perspective test suite over ALL quest flows; owns flows/ + startup/ files
  ├─ siegemaster ─── one session; manual QA + reviews the flow suite + TDD-fixes what it breaks
  ├─ lawbringer ──── one session; standards review across the whole quest diff (fixes inline)
  ├─ blightwarden ── one session; cross-cutting whole-diff audit
  ├─ ward (full) ─── mcp__dungeonmaster__run-ward({mode: 'full'}); spawnerType: 'command'
  │
  │   (a red ward inserts a spiritmender + a fresh ward after it; a spent ward budget blocks the quest.
  │    That is the ONLY failure path — see "Failure handling".)
  ▼
Complete ──► /dumpster-launch's next get-next-step() picks up the next FIFO quest in the queue
```

## Operations Ledger & Work Items

Execution is a **reactive relay over `quest.operations`** — an ordered `OperationItem[]` ledger. Each item is
`{ id, role, text, status: pending | in_progress | complete, locked, wardMode? }` (`operationItemContract`).

**The ledger has exactly TWO writers:**

- **ChaosWhisperer** authors the plan items at spec time (`{ role: 'codeweaver', text }`, one per implementation
  scope) via `modify-quest`. `operations` is on the modify-quest allowlist only at `flows_approved` /
  `explore_observables` (and the `review_observables → explore_observables` back-edge) — so an execution agent
  writing `operations` at `in_progress` is rejected.
- **The orchestrator** mutates status + does duplicate-on-partial at runtime, through `questOperationsUpdateBroker` —
  the ONLY runtime ledger writer. It deliberately bypasses the modify-quest allowlist (`operations` is inspectable, so
  `questModifyBroker` rejects it at `in_progress`); execution agents have no runtime ledger write path at all.

**Work item = one agent session.** `quest.workItems[]` are generic session containers (`role`, `status`, `dependsOn`,
`relatedDataItems`, `sessionId`, `agentId`). The load-bearing invariant is **strict 1:1**: each work item links to
exactly one operation item via `relatedDataItems: ['operations/<id>']`, and each operation item is worked by exactly
one work item over its life.

- **Advance / relay** (`questAdvanceBroker`): the next actionable item is the FIRST `pending` operation item. Advance
  creates ONE work item for it (role; `spawnerType` = `command` for ward else `agent`; `dependsOn` chained after the
  most recent dependency-satisfying work item; `relatedDataItems: ['operations/<id>']`) and marks the operation item
  `in_progress` — in the same atomic persist. It is called from BOTH the signal-back handler AND the dispatch scan's
  self-heal. A **resume guard** makes it act only on a `pending` item with NO linked work item, so no caller (double
  signal, re-entrant scan, restart) can ever mint a second work item for one operation.
- **Seed** (`questBuildRelayGraphBroker`, at Start): appends the quest type's `startImplementationOps` + `relayTail`
  (from `questTypeRegistryStatics`) as pending locked operation items, force-completes any leftover
  chaoswhisperer/glyphsmith intake items, and creates the first work item — all in one `questOperationsUpdateBroker`
  persist. Idempotent: a re-Start detects the already-seeded verify tail (a locked `role: ward` item) and skips
  straight to the status transition.
- **Dispatch** (`quest-get-next-step-broker`): FIFO-scans active quests, picks the oldest with incomplete work, and
  returns a `NextStep` (`spawn-agents` / `run-ward` / `idle`) to `/dumpster-launch`, which Task()s the agent or calls
  the `run-ward` MCP tool.
- **Session tracking**: each work item carries `sessionId` (parent /dumpster-launch session UUID) AND `agentId`
  (the sub-agent's realAgentId, used to scope chat replay to one `subagents/agent-<id>.jsonl` file). For chat roles
  (ChaosWhisperer, Glyphsmith), `sessionId` is captured from the spawned Claude's first stream-json init line via
  `chat-spawn-broker`'s `onSessionId` callback. For every Task-dispatched sub-agent under `/dumpster-launch`, both
  fields are stamped MCP-side: when the sub-agent calls `get-agent-prompt`, the responder reads
  `request.params._meta.claudecode/toolUseId` — the toolUseId of the SUB-AGENT'S OWN MCP call (NOT the parent Task()
  dispatch id) — and scans every `~/.claude/projects/<encoded-cwd>/<sessionId>/subagents/agent-*.jsonl` file for an
  assistant line whose `tool_use.id` matches. The matching JSONL's basename yields `realAgentId`; its containing
  session dir yields `parentSessionId`. It retries on miss (~3 s budget) to absorb the
  Claude-Code-dispatches-MCP-call-before-flushing-JSONL race. Deterministic across any number of parallel Claude
  sessions in the same cwd.
- **Ward** is the only non-agent item (`spawnerType: 'command'`); the `run-ward` MCP tool blocks until ward exits and
  `quest-run-ward-broker` applies the result to the ledger + the work item.

## Quest Status Lifecycle

```
created ──► explore_flows ──► review_flows ──► flows_approved ──► explore_observables ──► review_observables ──► approved ──► in_progress ──► complete
                                    │                                                          │                   │                                │
                                    └──► explore_flows (back)                                   └──► explore_observables (back)                      ├──► blocked ──► in_progress
                                                                                                                   │                                 └──► abandoned
                                                                                                                   ▼
                                                                                                            explore_design ──► review_design ──► design_approved ──► in_progress
                                                                                                                                      │
                                                                                                                                      └──► explore_design (back)
```

The valid transitions are `questStatusTransitionsStatics`; `paused` is reachable from every live status and restores
`pausedAtStatus` on resume. There are NO `seek_*` statuses — there is no PathSeeker planning phase. ChaosWhisperer
runs the entire spec lifecycle; the orchestrator drives the operations relay entirely within `in_progress`.

Gate content (`questGateContentRequirementsStatics`, enforced by `has-quest-gate-content-guard`):

- `flows_approved` and `design_approved` require non-empty `flows`.
- `approved` requires `flows` AND — for `feature` quests only — an `operations` ledger containing at least one
  `role: codeweaver` item. (A `bug-hunt` quest's implementation op — the pesteater item — is orchestrator-seeded at
  Start, not authored at spec time, so the requirement carries `questTypes: ['feature']`.)

`Start Quest` transitions `approved → in_progress` directly (`orchestration-start-responder`), seeding the relay. Once
execution starts, quest status is DERIVED from work-item + operation state by `work-items-to-quest-status-transformer`
(see "Completion").

| Status                | Set By                                          | Gate                                                                    |
|-----------------------|-------------------------------------------------|-------------------------------------------------------------------------|
| `created`             | `add-quest`                                     | ChaosWhisperer starting up                                              |
| `explore_flows`       | ChaosWhisperer (Phase 1 exit)                   | Can add: flows, designDecisions                                         |
| `review_flows`        | ChaosWhisperer (Phase 2 exit)                   | User reviews flows, APPROVE button visible                              |
| `flows_approved`      | User approves flows (Gate #1)                   | Can add: observables, contracts, tooling, packagesAffected, operations  |
| `explore_observables` | ChaosWhisperer (Phase 4 entry)                  | Can add: observables, contracts, tooling, packagesAffected, operations  |
| `review_observables`  | ChaosWhisperer (Phase 4 exit)                   | User reviews observables + the operations ledger, APPROVE visible       |
| `approved`            | User approves (Gate #2)                         | Spec + ledger locked. `start-quest` or `explore_design` allowed         |
| `explore_design`      | Glyphsmith starts design work                   | Create prototypes, iterate on designs                                   |
| `review_design`       | Glyphsmith ready for design review              | User reviews designs, APPROVE button visible                            |
| `design_approved`     | User approves designs                           | Design locked. `start-quest` allowed                                    |
| `in_progress`         | `start-quest` (Web UI "Start Quest")            | Relay dispatches operation items; agents may write only `contracts`/`tooling`/`flows` (observable-wording-only) |
| `blocked`             | `quest-block-on-failure-broker`                 | Execution halted; user resumes to `in_progress`                         |
| `complete`            | Derived when the ledger drains                  | Terminal (re-openable by appended work)                                 |
| `abandoned`           | User abandons                                   | Terminal                                                                |

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

Consumers read different parts:

- **User** reads given/when/then as a human-readable acceptance criteria checklist
- **ChaosWhisperer** reads observables while authoring the `{ role: 'codeweaver', text }` operation items (the
  implementation plan) during the spec phase
- **Flowrider** uses the full observable to author the flow-perspective test suite (integration or e2e)
- **Siegemaster** uses the full observable to manually QA the flow and review the suite's coverage

## Quest Stages

| Stage            | Sections Included                                                             |
|------------------|-------------------------------------------------------------------------------|
| `spec`           | flows (with observables), designDecisions, contracts, tooling                 |
| `spec-flows`     | flows (nodes/edges only, no observables), designDecisions, contracts, tooling |
| `spec-obs`       | flows (observables only), designDecisions, contracts, tooling                 |
| `planning`       | planningNotes, operations, contracts                                          |
| `implementation` | planningNotes, operations, contracts, tooling                                 |

Use `?stage=spec-flows` to get flow structure without observables. Use `?stage=spec-obs` to get observables without flow structure.

## Quest Types

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). `questTypeRegistryStatics`
(`@dungeonmaster/shared/statics`) is the single source of truth per type — its intake slash command, create-time seed
role (`initialWorkItemRole`), Start-Quest relay seed (`startImplementationOps` + `relayTail`), and the execution
`roles` it uses. `orchestration-start-responder` seeds every type through the SAME `questBuildRelayGraphBroker`, which
reads the registry entry for `quest.questType`:

- **`feature`** (`/dumpster-create`): `startImplementationOps` is empty — ChaosWhisperer authors the `codeweaver`
  operation items at spec time. `relayTail` = `ward(changed) → flowrider → siegemaster → lawbringer → blightwarden →
  ward(full)`.
- **`bug-hunt`** (`/dumpster-hunt`): `startImplementationOps` = a single `pesteater` item (orchestrator-seeded, no
  intake authoring); `relayTail` = `ward(changed) → lawbringer → blightwarden → ward(full)` (no flowrider/siegemaster).
  Bug-hunt reuses the flow/observable spec lifecycle — the bug is captured as two flows (the actual-state reproduction
  path ending at the symptom, and the expected-state path ending at the correct behavior), with the expected behavior
  an observable PestEater turns into a failing test.

Each type owns its COMPLETE relay via its registry entry. Adding a type = one `questTypeRegistryStatics` entry + the
type added to `questTypeContract`.

## Agent Roles

Every relay role is one operation item → one work item → one agent session. An agent does its work, then signals
`complete` with an `operationStatus` (`done` or `partial`); the orchestrator applies the outcome to the ledger and
advances. Agents have **no failure signal** — they fix their own problems and move forward. The ONLY failure concept
is a **ward exit-code red** (`quest-run-ward-broker`), which inserts a spiritmender + a fresh ward and, when the ward
retry budget is spent, blocks the quest. Quest status is then derived from work-item + operation state.

The relay role set per quest type is `questTypeRegistryStatics[type].roles`. The `agentRoleContract` enumerates the
Claude-dispatched agent roles (codeweaver, spiritmender, lawbringer, flowrider, siegemaster, blightwarden, the five
`blightwarden-*-minion`s, pesteater); the broader `workItemRoleContract` (shared) adds the command/interactive roles
(`ward`, `chaoswhisperer`, `glyphsmith`) an operation item may carry.

| Role           | Dispatched By                                                       | Operation outcome         | Ledger writes (modify-quest)                    |
|----------------|---------------------------------------------------------------------|---------------------------|-------------------------------------------------|
| ChaosWhisperer | `/dumpster-create` (interactive)                                    | N/A (spec)                | full spec surface + authors codeweaver op items |
| Glyphsmith     | startDesignChat (interactive)                                       | N/A (design)              | status                                          |
| codeweaver     | `/dumpster-launch` via Task() (one per codeweaver op item)          | complete (done / partial) | none                                            |
| ward           | `/dumpster-launch` via `run-ward` MCP tool (command)                | exit code (green / red)   | none (broker writes wardResults + item status)  |
| flowrider      | `/dumpster-launch` via Task() (one session over ALL flows)          | complete (done / partial) | none (owns flows/ + startup/ files inline)      |
| siegemaster    | `/dumpster-launch` via Task() (one session over ALL flows)          | complete (done / partial) | none (edits inline)                             |
| lawbringer     | `/dumpster-launch` via Task() (whole-diff review)                   | complete (done / partial) | none (fixes findings inline)                    |
| blightwarden   | `/dumpster-launch` via Task() (whole-diff audit)                    | complete (done / partial) | planningNotes.blightReports (via its minions)   |
| spiritmender   | `/dumpster-launch` via Task() (inserted on ward red)                | complete (done / partial) | none                                            |
| pesteater      | `/dumpster-launch` via Task() (bug-hunt front; reads quest itself)  | complete (done / partial) | none                                            |

### The pt-N verify fixpoint

`flowrider`, `siegemaster`, `lawbringer`, `blightwarden` (and `ward`) are **fixpoint roles**: a session signals
`partial` when its pass changed code, and the orchestrator appends a `"pt N: {text}"` continuation operation item so a
FRESH session of the same role re-runs against the new state. The role converges when a pass changes nothing and it
signals `done`. Each locked (verify-tail) role's pt chain is bounded by `slotManagerStatics.<role>.maxAttempts` (ward
by `slotManagerStatics.ward.maxRetries`); a spent chain blocks the quest instead of looping. See "Signal System" +
"Failure handling".

### Minions (parent-summoned sub-agents)

Blightwarden, Codeweaver, and Lawbringer fan their single session out to sub-agent minions summoned via the Agent tool
(the `blightwarden-*-minion`, `codeweaver-minion`, `lawbringer-minion` names in `agentPromptClassificationStatics`).
Minions are NOT work items and NOT operation items: they call `get-agent-prompt` with no `workItemId`, are briefed
inline by their parent, and never signal back — that parallelism lives inside the parent's turn, observable under the
parent's chain via wire-level toolUseId correlation. Blightwarden's five report-only finders (security / dedup / perf
/ integrity / dead-code) each write a `PlanningBlightReport` into `planningNotes.blightReports`, which the blightwarden
synthesizer judges and cleans up.

## Signal System

Agents report via the `signal-back` MCP tool. `complete` is the SOLE signal kind — a session-terminal marker. The
operation OUTCOME rides on the same call as `operationStatus` (`signalBackInputContract`: `signal: 'complete'`,
`operationItemId?`, `operationStatus?: 'done' | 'partial'` — `failed` is explicitly rejected). The live handler is
`quest-handle-signal-back-responder.ts`, which applies the outcome server-side (authoritative — an agent cannot forget
to patch the ledger, because agents never write it):

1. Marks the signaled work item terminal (`complete`, `completedAt`, `actualSignal`).
2. Resolves the linked operation item (the call's `operationItemId`, else the work item's `operations/<id>` ref).
3. `operationStatus: 'done'` (or absent) → marks that operation item `complete`.
4. `operationStatus: 'partial'` → marks it `complete` AND appends a `"pt N: {text}"` continuation item (same role,
   `locked`/`wardMode` preserved) immediately after it — **duplicate-on-partial**. This keeps the strict 1:1
   operation↔work-item invariant and an immutable pt audit trail (instead of reverting a shared item's status). The pt
   chain is the verify fixpoint; for a locked role it is bounded by `slotManagerStatics.<role>.maxAttempts`, and a
   spent chain blocks via `quest-block-on-failure-broker` instead of appending.

Work-item-terminal + operation-complete + the optional pt N land in ONE `questOperationsUpdateBroker` persist
(all-or-nothing on crash). The handler is **idempotent**: a redelivered signal for an already-terminal work item is a
no-op (no second pt N, no second work item). Afterwards `questAdvanceBroker` creates the next work item.

### Failure handling

The orchestrator has ONE failure concept: **a ward exit-code red**. There is no `failed`/`failed-replan` agent signal
and no PathSeeker replan. Terminal-failure routing lives entirely in `quest-run-ward-broker.ts`:

- **ward green** → mark the ward operation item complete, advance to the next pending item.
- **ward red** → mark the ward work item `failed` and the ward operation item `complete`, then append a `spiritmender`
  operation item PLUS a fresh ward continuation (`"pt N"`, same `wardMode`) immediately after it, and advance. The
  next dispatched item is therefore the spiritmender (never two wards back-to-back); the fresh ward re-verifies after
  the fix.
- **ward red, budget spent** → the red chain is bounded: once the ward operation items of this `wardMode` since the
  last GREEN ward of the same mode reach `slotManagerStatics.ward.maxRetries`, the broker calls
  `quest-block-on-failure-broker` (marks the item `failed`, drains pending work items to `skipped`, sets status
  `blocked`) instead of appending another fix loop. A `blocked` quest is not scanned by the active-quest loader
  (filters on `in_progress`), so dispatch halts until the user resumes.

**Resume, don't restart.** An `in_progress` work item observed during a get-next-step scan is necessarily orphaned
(the loop holds no dispatch in flight), so `recover-orphaned-work-items-layer-broker` flips it back to `pending`
KEEPING `sessionId`/`agentId` and adds a `resume` marker; Node/UI dispatch resumes the retained Claude session
(`claude --resume`) so partial work survives. An early crash with no captured session falls back to a fresh spawn; the
MCP-Task path re-dispatches fresh. Budget: each recovery bumps `retryCount`; at
`slotManagerStatics.orphanRecovery.maxResets` the crash loop is terminal and the quest blocks.

**Flowrider and Siegemaster own their dev server.** For runtime flows both control their own dev server via
Playwright's `webServer` config (`{ command: <devCommand>, url: <devServerUrl>, reuseExistingServer: true }`, resolved
from `.dungeonmaster.json` — `devCommand` + dev `port` — and passed into their WorkUnit by `agentPromptGetBroker`).
Operational flows run no server.

### Completion

`work-items-to-quest-status-transformer` is operation-aware. It never derives `complete` while ANY operation item is
`pending` or `in_progress` — that window is exactly "last session finished, advance hasn't created the next work item
yet." Pre-execution, user-paused, abandoned, and blocked statuses are never derived over. When every work item is
terminal AND the ledger is drained it returns `complete`; an unrecovered sink failure with a drained ledger returns
`blocked`; otherwise `in_progress` (a dispatchable item exists, or advance will create one from the ledger). `skipped`
is terminal and non-failure but does NOT satisfy `dependsOn`, so a `skipped` dep permanently dead-ends its dependents.

### MCP Sanitization

The MCP `modify-quest` tool gates writes by the per-status allowlist (`quest-status-input-allowlist-statics`):

- `operations` — writable ONLY at `flows_approved` / `explore_observables` (and the `review_observables` back-edge),
  where ChaosWhisperer authors the plan. Rejected at `in_progress`; the orchestrator's runtime ledger writes go
  through `questOperationsUpdateBroker`, which bypasses the allowlist.
- `workItems` — server-only, managed by the advance / signal-back / ward brokers.
- `wardResults` — server-only, written by `quest-run-ward-broker`.

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

## Two dispatchers, one state machine

`quest-get-next-step-broker` is the single dispatch brain. Two dispatchers drive it:

- **MCP mode (`/dumpster-launch`)** — the user's interactive Claude session polls the
  `get-next-step` MCP tool and dispatches via Task() sub-agents. Runs under the user's plan.
- **Node mode (the `/queue` page's play button)** — the server's Node dispatch runner
  (`quest-node-dispatch-runner-broker` + `quest-node-dispatch-loop-broker`, bootstrapped by
  `OrchestrationDispatchBootstrapResponder`) calls the same broker in-process and dispatches by
  spawning headless `claude -p` children (one per SpawnInstruction, same `taskPrompt` stub) via
  `agentSpawnUnifiedBroker`. The spawn-batch layer pre-stamps each work item `in_progress`
  before spawning and stamps `sessionId` from the child's init line (which activates the
  quest-driven watcher tail for live chat; `agentId` stays unset for top-level sessions).
  Pause is graceful: `isPlaying()` is checked between steps, in-flight children finish.

**Exclusivity** is file-backed at `<dungeonmasterHome>/dispatch-state.json`
(`dispatchStateContract`) because the MCP server is a separate OS process: every MCP
`get-next-step` call writes an `mcpHeartbeatAt` heartbeat; while the file says `node-playing`,
the MCP responder returns `{ type: 'idle', reason }` so `/dumpster-launch` reports why and
stops. The play gate (`dispatch-state-play-gate-broker`) refuses to play while the heartbeat
is fresh OR any active quest has an `in_progress` work item with `agentId` stamped (a
Task-dispatched agent mid-flight); `force: true` overrides for a crashed launch loop. The
state normalizes to `paused` on server boot — the Node dispatcher never auto-plays after a
restart.

## Quest Kickoff Surfaces

| Surface                                | Purpose                                                                                                                                                                   |
|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/dumpster-create` slash command       | Primary entry point (feature). Runs ChaosWhisperer in the user's Claude session; creates the new quest via MCP as its first action.                                       |
| `/dumpster-hunt` slash command         | Primary entry point (bug-hunt). Runs the BugHunt intake; first action is `create-quest` with `questType: 'bug-hunt'`, then captures the repro flow + expected observable. |
| `/dumpster-launch` slash command       | MCP dispatch mode. Long-lived dispatch loop in the user's Claude session; calls `get-next-step()` → Task() / `run-ward` → await → repeat across all approved quests.      |
| Web UI `/queue` page play button       | Node dispatch mode. `POST /api/orchestration/dispatch/play` starts the server-side runner (headless `claude -p` children); pause stops new dispatches gracefully.         |
| MCP `create-quest` tool                | Programmatic quest creation (used by ChaosWhisperer/BugHunt). Accepts optional `questType` so `/dumpster-hunt` births a `bug-hunt` quest.                                 |
| MCP `start-quest` tool                 | Programmatic transition from `approved` to `in_progress` (status mutation only — the active dispatcher picks the quest up on its next pass).                              |
| Server `orchestration-start-responder` | HTTP endpoint that the Web UI "Start Quest" button calls; mutates status and redirects to execute view. Does NOT spawn anything.                                          |

## Agents (MCP-Delivered)

Agents get their prompts dynamically via the `get-agent-prompt` MCP tool. The dispatch
surface (`/dumpster-launch`'s Task() invocations) hands each sub-agent a stub prompt that
says "call `get-agent-prompt({agent, workItemId, questId})` and follow its instructions
exactly." The MCP responder interpolates work-item-specific context (the linked operation
item's scope, package, contracts, file paths) into the returned prompt and stamps
`workItem.sessionId` (parent UUID) +
`workItem.agentId` (sub-agent realAgentId) from MCP request metadata: Claude Code surfaces
`request.params._meta.claudecode/toolUseId` on every MCP call (the toolUseId of the
sub-agent's OWN MCP call, not the parent Task() dispatch id). The responder scans every
session's `subagents/agent-*.jsonl` file for an assistant line whose `tool_use.id`
matches — deterministically identifying the calling sub-agent race-free even when N
sub-agents call in parallel against the same MCP stdio child.

| Agent (parent-summoned minion) | Summoned By                                | Purpose                                                                                                 |
|--------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------------|
| chaoswhisperer-gap-minion      | ChaosWhisperer (inside `/dumpster-create`) | Validate spec completeness before approval                                                              |
| codeweaver-minion              | Codeweaver via the Agent tool (per piece)  | Focused TDD worker: builds one isolated step/file-group, returns a distilled artifact. No work item      |
| lawbringer-minion              | Lawbringer via the Agent tool (per group)  | Focused review-and-fix worker over one group of impl+test pairs; fixes violations inline. No work item   |
| blightwarden-security-minion   | Blightwarden via the Agent tool            | Report-only: cross-file taint-flow review; writes a `PlanningBlightReport`                               |
| blightwarden-dedup-minion      | Blightwarden via the Agent tool            | Report-only: semantic-duplication review                                                                |
| blightwarden-perf-minion       | Blightwarden via the Agent tool            | Report-only: performance-regression review                                                             |
| blightwarden-integrity-minion  | Blightwarden via the Agent tool            | Report-only: blast-radius review                                                                       |
| blightwarden-dead-code-minion  | Blightwarden via the Agent tool            | Report-only: orphan-export / unreachable-branch review                                                 |

The relay roles that DO own a work item (`codeweaver`, `flowrider`, `siegemaster`, `lawbringer`, `blightwarden`,
`spiritmender`, `pesteater`) fetch their prompt the same way, calling `get-agent-prompt({agent, questId, workItemId})`
— see "Agent Roles".
