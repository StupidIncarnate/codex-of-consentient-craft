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
  `packages/orchestrator/src/statics/` (e.g., `pathseeker-prompt-statics.ts` — the PathSeeker parent —
  plus the minions it summons: `pathseeker-surface-minion-statics.ts`, `pathseeker-dedup-minion-statics.ts`,
  `pathseeker-assertion-correctness-minion-statics.ts`, `codeweaver-minion-statics.ts`,
  `lawbringer-minion-statics.ts`, `chaoswhisperer-gap-minion-statics.ts`). There are no `.claude/agents/*.md` files for these agents.
  A work-item role calls `get-agent-prompt({agent, questId, workItemId})`; a parent-summoned minion calls
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
  ├─ pathseeker ──── single Task(); classifies scope, then summons its minions as Agent sub-agents —
  │     │            pathseeker-surface (N parallel, one per slice) → pathseeker-dedup +
  │     │            pathseeker-assertion-correctness — and runs the architect-review walk itself.
  │     │            On complete the signal-back handler fires the post-walk hook.
  │     ▼   (post-walk hook runs stepsToWorkItemsTransformer over authored steps + flows)
  ├─ Codeweaver ──── one Task() per package (flows/startup excluded), capped at `codeweaverMaxFilesPerChunkStatics.value` (~20); implementation + unit tests
  ├─ Ward (changed)─ mcp__dungeonmaster__run-ward({mode: 'changed'}); spawnerType: 'command'
  ├─ Flowrider ───── one Task() per flow, chained; owns flows/startup files + their flow-perspective test suite (integration or e2e). Only when ≥1 flow/startup step exists.
  ├─ Siegemaster ─── one Task() per flow, chained (at most one at a time); manual QA + reviews flowrider's suite + TDD-fixes what it breaks
  ├─ Lawbringer ──── one Task() per package (reviewable source pairs only); each parent fans out lawbringer-minion sub-agents per pair-group (whole-diff review for bug-hunt)
  ├─ Blightwarden ── single Task(); whole-diff cross-cutting audit
  ├─ Ward (full) ─── mcp__dungeonmaster__run-ward({mode: 'full'}); spawnerType: 'command'
  │
  │   (on failure, recovery items are spliced or the quest is blocked — see "Failure handling")
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
- **Concurrency**: intrinsic — `spiritmender` items return as one `spawn-agents` batch; the single `pathseeker`
  item, the single `blightwarden` item, and everything else return one agent per response. PathSeeker,
  Blightwarden, AND each per-package Lawbringer fan out internally by summoning their minions as `Agent`
  sub-agents — that parallelism lives inside the parent's turn, not in the work-item graph (PathSeeker summons
  surface/cleanup minions; Blightwarden summons the five security/dedup/perf/integrity/dead-code minions; each
  Lawbringer partitions its package's reviewable pairs and summons `lawbringer-minion`s per pair-group).
  `slotManagerStatics` slot caps stay
  configured but are not consulted by `get-next-step`.
- **Dynamic insertion**: the mechanism is to append work items with correct `dependsOn`. The
  `pathseeker` post-completion hook calls `stepsToWorkItemsTransformer` to generate the downstream
  codeweaver / ward / flowrider / siegemaster / lawbringer / blightwarden chain. The ward recovery splice
  (spiritmender batch + retry) uses the same mechanism via `questSpliceFixerBroker`, plus
  `replacementMapping` to rewire downstream dependents onto the retry — see "Failure handling".
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

The `seek_scope` / `seek_synth` / `seek_walk` enum values remain on the contract. A quest never
*rests* in one under the dispatch-loop model, but they are not dead: `orchestration-start-responder`
transitions `approved → seek_scope → in_progress` on every Start because `approved`'s allowlist
forbids `planningNotes`, so the auto-seed of `planningNotes.scopeClassification` lands in the
transient `seek_scope` window, and the `seek_walk → in_progress` completeness gate still lives in
`questSaveInvariantsTransformer` / `questCompletenessForTransitionTransformer`. Because PathSeeker
runs its ENTIRE planning lifecycle while the quest stays `in_progress`, the `in_progress`
write-allowlist imposes NO per-phase `planningNotes` sub-field gating
(`allowedPlanningNotesFields: 'all'`): any sub-field — `scopeClassification` / `surfaceReports` /
`synthesis` / `walkFindings`, plus the execution-phase `blightReports` (Blightwarden) and
`codeweaverPlans` (Codeweaver) — is writable, so PathSeeker can write scope/surface/synthesis/walk
artifacts (and re-slice on walk-time scope creep) during its own run. Only the statuses BEFORE
`in_progress` — the spec/design phases plus the `seek_scope`/`seek_synth`/`seek_walk` planning phases —
keep a per-phase sub-field allowlist, so each retains its write-discipline.
What is gone is any quest that *settles* in a `seek_*` status: PathSeeker is a single `pathseeker`
work item that runs entirely while the quest is `in_progress`; its scope → summon → walk phase
boundaries live inside its own turn, tracked by `planningNotes` presence rather than quest status
(see "PathSeeker work-item graph" below).

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

Four consumers read different parts:

- **User** reads given/when/then as a human-readable acceptance criteria checklist
- **PathSeeker** reads `then[].type` tags (file planning: ui-state -> widgets, api-call -> responders)
- **Flowrider** uses the full observable to author the flow-perspective test suite (integration or e2e)
- **Siegemaster** uses the full observable to manually QA the flow and review the suite's coverage

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
  post-walk hook then generates the `codeweaver → ward → flowrider → siegemaster → lawbringer →
  blightwarden → ward` chain (flowrider only when ≥1 flow/startup step exists).
- **`bug-hunt`** (`/dumpster-hunt`): `questBuildBugHuntGraphBroker` hand-seeds the WHOLE chain at Start
  (no PathSeeker, no post-walk hook): `pesteater → ward(changed) → lawbringer(whole-diff) → blightwarden
  → ward(full)`. Bug-hunt reuses the flow/observable spec lifecycle — the bug is captured as two flows
  (the actual-state reproduction path ending at the symptom, and the expected-state path ending at the
  correct behavior), with the expected behavior an observable PestEater turns into a failing test.

Each type owns its COMPLETE work-item flow; PathSeeker's single planning work item is the *feature*
type's planning sub-stage, not universal. Adding a type = one `questTypeRegistryStatics` entry + a
graph builder + the type added to `questTypeContract`.

## Agent Roles

The orchestrator is RECOVERY-FIRST: no agent role blocks the quest on failure. A `failed` (a code
failure) splices a spiritmender + a re-run of the same role; a `failed-replan` (a plan hole) splices a
PathSeeker replan; ward / role retry exhaustion (and orphaned-agent crash-loop exhaustion) escalate to
a PathSeeker replan. Only PathSeeker blocks the quest — when its replan loop or its own retry budget is
spent. See "Failure handling". The quest then derives `complete`/`blocked`/`in_progress` from
work-item states.

| Role                             | Dispatched By                                                                                | Signals                         | MCP Tools (modify-quest)                                               |
|----------------------------------|----------------------------------------------------------------------------------------------|---------------------------------|------------------------------------------------------------------------|
| ChaosWhisperer                   | `/dumpster-create`                                                                           | N/A (spec)                      | full spec surface (flows, observables, contracts, packagesAffected, …) |
| Glyphsmith                       | startDesignChat                                                                              | N/A (design)                    | status                                                                 |
| pathseeker                       | `/dumpster-launch` via Task() (single planner; summons surface/dedup/assertion minions, walks itself) | complete, failed (retry→block) | planningNotes (scope/synthesis/walkFindings), steps, contracts          |
| Codeweaver                       | `/dumpster-launch` via Task() (one per package; flows/startup excluded; unit tests)          | complete, failed, failed-replan | none                                                                   |
| Ward                             | `/dumpster-launch` via `run-ward` MCP tool (command)                                         | terminal set by exit code       | none (server writes wardResults + item status)                         |
| Flowrider                        | `/dumpster-launch` via Task() (one per flow, chained; owns flows/startup files + flow tests) | complete, failed, failed-replan | none                                                                   |
| Siegemaster                      | `/dumpster-launch` via Task() (one per flow, chained; manual QA + suite review + gap-fill)   | complete, failed, failed-replan | none                                                                   |
| Lawbringer                       | `/dumpster-launch` via Task() (whole-diff mode for bug-hunt)                                 | complete, failed, failed-replan | none (fixes findings inline)                                           |
| Blightwarden                     | `/dumpster-launch` via Task()                                                                | complete, failed, failed-replan | none                                                                   |
| Spiritmender                     | `/dumpster-launch` via Task()                                                                | complete, failed (soft)         | none                                                                   |
| PestEater                        | `/dumpster-launch` via Task() (bug-hunt front; reads quest itself)                           | complete, failed, failed-replan | none                                                                   |

### PathSeeker work-item graph

PathSeeker is **one** `pathseeker` work item that holds the whole planning lifecycle in a single
warm mind. Within its own turn it classifies scope, then summons its minions as `Agent` sub-agents
and runs the architect-review walk itself:

```
pathseeker (single work item, dependsOn: [chaoswhisperer])
   │  Phase 1 — classify scope, write scopeClassification.slices
   │  Phase 2 — summon minions via the Agent tool (minion-fetch: get-agent-prompt with no workItemId):
   │              Wave A: pathseeker-surface ×N (parallel, one per slice)
   │              Wave B: pathseeker-dedup + pathseeker-assertion-correctness (parallel, after Wave A)
   │            each minion writes steps/contracts via modify-quest and returns a summary (no signal-back)
   │  Phase 3 — architect-review walk (PathSeeker itself), commit walkFindings
   ▼   signal-back complete → post-walk hook
stepsToWorkItemsTransformer fires → codeweaver / ward / flowrider / siegemaster / lawbringer / blightwarden chain inserted
```

Slice generation: on Start Quest, `questBuildPathseekerGraphBroker` reads `quest.packagesAffected[]`
(declared during ChaosWhisperer spec approval), builds one slice per package into
`scopeClassification.slices[]`, and seeds the single `pathseeker` work item. PathSeeker resumes off
`planningNotes` presence (scopeClassification → synthesis → walkFindings), so a Task crash mid-plan
re-enters at the right phase. Its minions are summoned sub-agents, NOT work items — they are
observable under PathSeeker's chain via wire-level toolUseId correlation. The `pathseeker-surface`,
`pathseeker-dedup`, `pathseeker-assertion-correctness`, and `pathseeker-walk` `WorkItemRole` values
are not seeded as work items; they stay on the contract for quest.json back-compat.

## Signal System

Agents report via the `signal-back` MCP tool. The live handler is
`quest-handle-signal-back-responder.ts`, which:

1. Marks the named work item terminal — `complete` for `complete`; a failure signal routes by role +
   signal (see "Failure handling") and stamps `completedAt`.
2. If the item is `pathseeker` AND the signal is `complete`, fires `questPostWalkHookBroker` to
   generate the downstream codeweaver/ward/siegemaster/lawbringer/blightwarden chain.
3. A `failed` (code failure) → spiritmender fix + a re-run of the role. A `failed-replan` (plan hole)
   → PathSeeker replan. Neither blocks the quest — only PathSeeker does, when its loop is spent.

### Failure handling

Terminal-failure routing lives in the two places that set terminal status: the `run-ward` broker
(`quest-run-ward-broker.ts`) for ward items and the `signal-back` handler
(`quest-handle-signal-back-responder.ts`) for agent items. It is RECOVERY-FIRST — every failure
splices a fixer + retry and the quest stays `in_progress`; the SOLE block path is PathSeeker
exhausting its loop.

- **ward-fail → RECOVER, then REPLAN when exhausted.** A non-zero ward exit with retry budget
  remaining (`attempt < maxAttempts - 1`) splices a batch of `spiritmender` items plus a `ward`-retry
  (same `wardMode`, `attempt + 1`) via `questSpliceFixerBroker`, rewiring downstream onto the retry.
  When ward's retries are exhausted the build could not be made green, so the failure escalates to a
  PathSeeker replan (`questSplicePathseekerReplanBroker`) — never a direct block.
- **code-recovery role `failed` (code failure) → RECOVER, then REPLAN when exhausted.** Any
  code-recovery role (`codeweaver`, `flowrider`, `siegemaster`, `lawbringer`, `blightwarden`,
  `pesteater` — every non-interactive, non-command, non-planner, non-spiritmender, non-minion role,
  derived by `codeRecoveryRolesTransformer`) that signals `failed` splices a `spiritmender` (fed the
  finding via a `spiritmender-batches/<id>.json` sidecar built from the signal-back `summary`) + a
  `ward(changed)` gate + a fresh re-run of the SAME role (`attempt + 1`, same `relatedDataItems`) via
  `questRecoverRoleBroker`, rewiring downstream onto the fresh run. Siege keeps its manual-QA
  spiritmender context; other roles get a generic code-failure context. Budget
  `slotManagerStatics.<role>.maxAttempts`; when spent the code failure escalates to a PathSeeker
  replan.
- **any role `failed-replan` (plan hole) → REPLAN.** `questSplicePathseekerReplanBroker` marks the
  item `failed` (superseded via `insertedBy`), drains pending to `skipped`, and splices a `pathseeker`
  replan (`dependsOn: []`) fed the brief; on its completion the post-walk hook regenerates the chain
  (dedup keeps built work). Bounded by `slotManagerStatics.pathseeker.replanMaxCycles`; once the loop
  is spent a further replan request routes to `questBlockOnFailureBroker` (the sole block path).
- **spiritmender `failed` → SOFT**, **pathseeker `failed` → RETRY then BLOCK.** The fixer's own failure
  just marks it terminal (the ward re-verify / fresh role run spliced after it carries on). A
  PathSeeker `failed` resets it to `pending` (`attempt + 1`) while budget remains, then blocks. A
  `blocked` quest is not scanned by `loadActiveQuestsLayerBroker` (filters on `in_progress`), so
  dispatch halts.
- **Flowrider and Siegemaster own their dev server.** For runtime flows, both agents control their own
  dev server via Playwright's `webServer` config (
  `{ command: <devCommand>, url: <devServerUrl>, reuseExistingServer: true }`),
  resolved from `.dungeonmaster.json` (`devCommand` + dev `port`) and passed into their WorkUnit by
  `agentPromptGetBroker`. Operational flows run no server. If either cannot build/start, it signals
  `failed` → spiritmender recovery per the table.

Recovery splices append work items with correct `dependsOn` (the same dynamic-insertion mechanism the
post-walk hook uses) and rewire downstream via `replacementMapping`. Both routing brokers are
idempotent on a double `signal-back`. Once routing settles, `workItemsToQuestStatusTransformer`
derives quest status from work-item states (`complete` when every item is non-failure-terminal,
`blocked` when pending items all depend on a `failed` id, `in_progress` while any item is active).
`skipped` is terminal and non-failure but does NOT satisfy `dependsOn`, so a `skipped` dep blocks its
dependents permanently — reinforcing the halt on a blocked quest.

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
| pathseeker-surface               | PathSeeker via the Agent tool (Wave A, N parallel) | Slice-scoped step + contract authoring; writes `quest.steps[]` and `quest.contracts[]` for its slice. Returns a summary (no signal-back)                   |
| pathseeker-dedup                 | PathSeeker via the Agent tool (Wave B)            | Cross-slice + in-package contract dedup; writes `steps[]` + `contracts[]`. Returns a summary (no signal-back)                                              |
| pathseeker-assertion-correctness | PathSeeker via the Agent tool (Wave B)            | Assertion well-formedness, banned-matcher scan, per-prefix `field` correctness, channel discipline; writes `steps[]`. Returns a summary (no signal-back)   |
| codeweaver-minion                | Codeweaver via the Agent tool (per isolated piece) | Focused TDD worker: builds one isolated step/file-group and returns a distilled artifact (working files + usage examples). No signal-back, no work item    |
| lawbringer-minion                | Lawbringer via the Agent tool (per pair-group)    | Focused review-and-fix worker: reviews one tight group of impl+test pairs (rules + branch-coverage walk + it.each cleanup), fixes violations inline, returns a distilled artifact. No signal-back, no work item |
| pesteater                        | `/dumpster-launch` via Task() (bug-hunt front)    | Single TDD bug-fix agent: root-cause → write the failing test FIRST → fix → verify via ward. Reads the bug report from the quest; no `modify-quest` writes |
