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
across every NON-TERMINAL quest, reconciles on every quest-modified outbox event (and via a 3s
fallback poll for direct quest.json writes), and starts/stops `questMonitorWatcherStartBroker`
instances to match. Multiple watcher instances coexist — one per active parent session.

**Non-terminal, not in-progress.** The real target test is "an ACTIVE work item carrying a
`sessionId`"; quest status is only a cheap pre-filter that skips loading `quest.json` for
quests that can no longer hold a live session. So the SPEC PHASE is in scope: a quest sitting
at `created` / `explore_flows` / `review_flows` has an intake work item (chaoswhisperer,
glyphsmith, or bughunt) carrying the chat session's id, and its tail runs — which is what
streams an intake conversation into the browser chat panel while the user is still having it
in their terminal. Narrowing the pre-filter to `approved`/`design_approved`/`in_progress`
starts no watcher for those quests and the panel stays empty for the whole conversation.

- `fsWatchTailAdapter` accepts an optional `startPosition: 'beginning' | 'end'` param.
  Pass `'beginning'` for sub-agent tails — they must drain the JSONL Claude already wrote
  while the parent blocked on the Task tool. Pass `'end'` for the parent
  `/dumpster-launch` session tail — only NEW appends from the moment the watcher starts
  forward should emit.
- The watcher captures `sessionId` from the first system/init line it sees and starts the
  parent tail at `'end'`. As `Task`-dispatched agents create their own
  `subagents/agent-<id>.jsonl` files, `chatSubagentTailBroker` instances spin up against
  each one at `'beginning'`.

**Every delivery identity owes a terminal event.** A `chat-output` frame naming a `chatProcessId`
is what arms the web composer's running indicator, and only a `chat-complete` naming that SAME id
disarms it. One chat turn is delivered under TWO identities — the spawn's own `chat-<uuid>` (stdout
plus its post-exit main-session tail) and this watcher's `proc-worker-<sessionId>` over the session
JSONL that same child writes — and the spawn's `chat-complete` speaks only for itself. So
`questMonitorWatcherStartBroker.stop()` emits a `chat-complete` for its own tail id, once. Without
it, the drain that lands after the turn ended re-arms the indicator with nothing left to clear it,
and the follow-up composer holds STOP forever. The emit is scoped to a WORKER tail
(`workerWorkItemId` + `workerQuestId`, supplied by `reconcile-watchers-layer-responder`): a
`chat-complete` is a per-quest wire event, and a `/dumpster-launch` dispatcher session tails
sub-agents belonging to several quests at once, so no single questId would be honest there.

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
  `flowrider-prompt-statics.ts`, `groundstomper-prompt-statics.ts`, `siegemaster-prompt-statics.ts`,
  `blightscout-prompt-statics.ts`, `spiritmender-prompt-statics.ts`, `pesteater-prompt-statics.ts`,
  `warpgate-prompt-statics.ts`) plus the minions a
  parent summons via the Agent tool (`codeweaver-piece-minion-statics.ts`,
  `flowrider-authoring-minion-statics.ts`, `flowrider-coverage-minion-statics.ts`,
  `siegemaster-walker-minion-statics.ts`, `siegemaster-test-audit-minion-statics.ts`,
  `chaoswhisperer-gap-minion-statics.ts`). `blightscout` (the standards review that replaced
  `blightwarden` and its three minions) summons no minions at all — see "Minions" below. The valid names are the
  `agentPromptNameContract` enum; `agentPromptClassificationStatics` classifies which are parent-summoned minions vs
  orchestrator-dispatched relay roles, and `agentNameToPromptTransformer` is the exhaustive switch that maps each name
  to its statics + model — a `never` check there is what fails the build when a name is added without a prompt.
  `tavernkeeper-prompt-statics.ts` is deliberately absent from all three: the follow-up chat is served by the chat
  prompt path (`chatPromptBuildTransformer`), not by `get-agent-prompt`. There are no `.claude/agents/*.md` files for
  these agents. A relay work-item role
  calls `get-agent-prompt({agent, questId, workItemId})` — the responder resolves the work item's linked operation item
  (its `operations/<id>` ref) and interpolates its scope into the returned prompt; a parent-summoned minion calls
  `get-agent-prompt({agent, questId})` (no workItemId — it has no work item) and is briefed inline by its parent.

  **A minion must NEVER pass a workItemId, not even its parent's.** `subagentStopNeedsBlockGuard` treats a
  `get-agent-prompt` call carrying a workItemId as proof the caller is a work-item agent and blocks it from ending its
  turn until it calls `signal-back`. A minion held to that rule could only escape by signalling on its PARENT's
  operation item — completing the parent's scope and advancing the relay while the parent is still working. The
  no-workItemId fetch is what keeps minions outside that guard.

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
  │     │  ChaosWhisperer authors NO ledger at all — `operations` is off the modify-quest allowlist
  │     │  entirely, for every role at every status. The codeweaver ledger is DERIVED at Start Quest
  │     │  from the flow nodes' `packages` tags and the contracts' `source` paths instead — see
  │     │  "Operations Ledger & Work Items" below.
  ├─ Phase 5: Gate #2 ─────────── user approves observables + packagesAffected[] → status: approved
  │
  ▼
Web UI "Start Quest" button ──► server orchestration-start-responder
  │   approved → in_progress. Seeds the relay (questBuildRelayGraphBroker): mints the quest type's
  │   startImplementationOps + the fixed verify tail as operation items (the codeweaver seed FANS OUT
  │   into the derived per-cell ledger here) and creates the FIRST work item.
  │   Redirects to execute view; banner: "Run /dumpster-launch in your Claude session."
  │
  ▼
User runs /dumpster-launch (long-lived dispatch loop in their session)
  │   Loop: get-next-step() → Task() / run-ward() → await → repeat.
  │   Each response dispatches ONE work item (= one agent session) for the operation item the relay
  │   marked in_progress; on signal-back / ward exit the relay advances to the next pending item.
  │
  │   The operations ledger drives the order. For a feature quest the sequence is:
  ├─ codeweaver ──── one session per DERIVED codeweaver op item (one per package+flow cell, plus one
  │                   flow-less foundation item per package); implementation + unit tests
  ├─ ward (changed)─ mcp__dungeonmaster__run-ward({mode: 'changed'}); spawnerType: 'command'
  ├─ flowrider ──── one session for ALL quest flows; authors their test suites below the browser
  ├─ groundstomper ─ one session per runtime flow reaching an e2e-eligible package; authors its Playwright walk
  ├─ siegemaster ── ONE SESSION PER FLOW; orchestrates manual QA of that flow via walker minions
  ├─ ward (full) ─── mcp__dungeonmaster__run-ward({mode: 'full'}); spawnerType: 'command'
  │
  │   `blightscout` — the one-COMMIT standards review that replaced `blightwarden` — is NOT one of
  │   this seeded tail's items. `quest-handle-signal-back-responder` APPENDS one (operation item plus
  │   its linked work item, in the same persist) immediately after every session above that commits
  │   — codeweaver, flowrider, groundstomper, siegemaster, pesteater, spiritmender — so the real
  │   dispatch order is `codeweaver → blightscout → codeweaver → blightscout → … → ward(changed) →
  │   flowrider → blightscout → …`. See "Operations Ledger & Work Items".
  │
  │   (a red ward inserts a spiritmender + a fresh ward after it; a spent ward budget blocks the quest.
  │    That is the ONLY failure path — see "Failure handling".)
  ▼
Complete ──► /dumpster-launch's next get-next-step() picks up the next FIFO quest in the queue
```

## Operations Ledger & Work Items

Execution is a **reactive relay over `quest.operations`** — an ordered `OperationItem[]` ledger. Each item is
`{ id, role, text, status: pending | in_progress | complete, locked, wardMode?, flowIds, packageNames }`
(`operationItemContract`).

**The ledger has exactly ONE writer: the orchestrator.** `operations` is off the modify-quest allowlist entirely —
ChaosWhisperer never authors it, at any status, and no execution agent ever writes it either. `questModifyBroker`
rejects an `operations` write from any caller at any status; the ledger's only content comes from two
orchestrator-owned mechanisms:

- **Derivation at Start** (`questBuildRelayGraphBroker`, reading `questTypeRegistryStatics[quest.questType]`): mints
  `startImplementationOps` + `relayTail` as pending operation items, expanding each seed through
  `relayTailFanOutTransformer` per its `fanOutBy`. A feature quest's ONE `codeweaver` seed
  (`fanOutBy: 'implementation'`) becomes the derived per-(package, flow) codeweaver ledger this way — see
  "The codeweaver ledger is derived, not authored" below — in place of a plan ChaosWhisperer used to write here.
- **Runtime mutation** (`questOperationsUpdateBroker`, the ONLY runtime ledger writer): status transitions,
  duplicate-on-partial, and the **blightscout auto-append** below. Execution agents have no ledger write path at all,
  ever — they read git + the ledger for context and signal an outcome.

### Blightscout is appended after every committing session, never seeded

`blightscout` appears in NO registry seed list. `quest-handle-signal-back-responder` appends one — the operation item
AND its linked work item, inside the same `questOperationsUpdateBroker` callback that completes the signalling item —
whenever a COMMITTING role's operation item goes complete. Five things about that append are load-bearing:

- **Eligibility is data, not a name chain.** `blightscoutOperationStatics.committingRoles` lists the roles whose
  session ends in a commit (`codeweaver`, `flowrider`, `groundstomper`, `siegemaster`, `pesteater`, `spiritmender`).
  The responder tests membership and matches no role name, exactly as `questBuildRelayGraphBroker` reads `fanOutBy`
  instead of matching seed roles. `ward` is absent (it is `spawnerType: 'command'` and writes no code), every chat role
  is absent, and `warpgate` is absent (its commit is a merge of commits earlier scouts already reviewed, and it runs
  after the ledger has drained).
- **`blightscout` is absent from that list, and that absence IS the termination proof.** A scout can never mint a
  scout, so the relay appends at most ONE review per committing session and cannot recurse. The static's colocated
  test pins the absence directly.
- **It is inserted AHEAD of any pt continuation.** A scout measures `HEAD~1...HEAD`; letting the continuation run
  first would move `HEAD~1` onto the continuation's own commit and leave the reviewed commit permanently unreviewed.
- **It is `locked: true`,** which enrols it in `slotManagerStatics.blightscout.maxAttempts`. The deliberate contrast is
  the codeweaver item, minted UNLOCKED precisely so its pt chain stays unbounded — the flows are the acceptance target
  and that work has to land. A review is not the acceptance target, so a scout that cannot settle one commit in three
  passes is a halt worth surfacing.
- **Its TEXT NAMES the operation item it follows,** which is the whole mechanism behind "one budget per commit".
  `blightscoutOperationStatics` carries a `textTemplate` whose `{reviewedOperation}` placeholder the responder fills
  with the completed item's ROLE and ID — the same device as `relayTailFanOutTransformer`'s `— flow: <id>` /
  `— package: <name>` suffixes, and for the same reason: `operationPtChainTransformer` keys a chain on role + base
  text, so a per-item scope in the text is what buys a per-item budget. The ID is the handle because it is the only
  thing unique per commit AND unchanged by this scout's own `pt N` continuation (which copies the base text) — a
  sibling's text can repeat, two ward reds appending two identically-worded spiritmender items being the standing case.
  The role rides along so the ledger line says whose commit is under review. One shared sentence collapses every scout
  on the quest into ONE chain, and the fourth review to signal `partial` then trips the spent-budget halt below and
  blocks a quest with its whole verify tail still pending.

It fires on `partial` as well as `done`: a partial session still landed a real commit. A session that in fact
committed nothing costs one cheap scout — it lands on the PREVIOUS commit, whose units already carry dispositions, so
`remainingItemIds` comes back empty and it signals `done` immediately. That self-correction is why **no sha is
persisted anywhere** (see `quest-get-blight-checklist-broker`). It does NOT fire on `blocked` or on a spent pt chain:
both halt the quest through `quest-block-on-failure-broker`, which drains pending work items to `skipped`, so the
review would be born dead — and the resume re-dispatches the same scope, whose outcome mints the review then.

The scout's work item carries `dependsOn: [<the signalling work item>]` — the OPPOSITE call from warpgate's
`dependsOn: []`, for the opposite reason. A merge is a fresh top-level dispatch on a finished quest whose trailing work
items are `skipped` (which never satisfies `dependsOn`); a scout is the very next relay step after a session going
terminal as `complete` in that same persist, so naming it is both satisfiable and load-bearing. It carries NO `flowIds`
and NO `packageNames`: a commit is not a slice of the spine, and `get-blight-checklist({ scope: 'commit' })` derives
every unit from the diff alone.

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
- **Seed** (`questBuildRelayGraphBroker`, at Start): mints the quest type's `startImplementationOps` + `relayTail`
  (from `questTypeRegistryStatics`) as pending operation items (locked, except the feature `codeweaver` seed, which
  mints unlocked so its pt chain stays unbounded — see below), force-completes any leftover
  chat-role intake items (`isChatWorkItemRoleGuard` — chaoswhisperer / glyphsmith / bughunt), and creates the first
  work item — all in one `questOperationsUpdateBroker`
  persist. Most `relayTail` entries map 1:1 to an operation item. **`codeweaver` fans out BY IMPLEMENTATION CELL**
  (`relayTailFanOutTransformer`, `fanOutBy: 'implementation'`, on `startImplementationOps` rather than `relayTail`):
  one item per (package, flow) cell across BOTH flow types, plus one flow-less **foundation** item per package
  holding the contracts — and the individual contract PROPERTIES, each of which may carry its own `source` —
  resolving under it (this is the only reason a package with zero tagged nodes gets an item at all — `shared`
  routinely owns contracts but tags no flow node; and a contract is one-to-many, so a property whose file lives
  in another package routes there instead of riding along with the contract's own path). Cell membership is
  "this package TAGS a node in this flow", so a glue node is in BOTH sides' cells — a seam has two halves and
  each side builds its own, with the tier order below deciding which runs first. Items are ordered by package KIND
  tier first (`packageBuildOrderStatics.tiers` — library → programmatic-service/mcp-server → http-backend →
  frontend-react/frontend-ink → cli-tool/hook-handlers/eslint-plugin), then `packageGraph` depth as a tiebreak WITHIN
  a tier. The tier ranks ahead of depth deliberately: manifest depth is Kahn's order over `package.json` edges, which
  is inverted across an HTTP seam — this repo's `server` depends on `@dungeonmaster/web` because it serves the built
  bundle, so raw depth would schedule the browser package's session before the backend route it calls exists. See
  `relay-tail-fan-out-transformer.ts` for the full membership/ordering logic. **`flowrider` fans out BY PACKAGE**
  (`relayTailFanOutTransformer`, `fanOutBy: 'package'`): one item per package its runtime nodes tag that resolves to a
  kind in `signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes`, plus ONE seam item for the glue nodes where
  two such packages meet. A node landing only in a browser-reachable kind mints nothing here — those units are
  Groundstomper's — so a quest whose every runtime node is frontend gets NO flowrider item at all, exactly as a quest
  with no browser-reachable node gets no groundstomper item. A package absent from `packagesAffected` resolves to no
  kind and is KEPT, matching what the completion gate does with it. A quest with no runtime node to slice on falls back
  to one whole-quest item, so the role is never silently dropped. **`groundstomper` fans out to ONE ITEM PER RUNTIME
  FLOW** reaching a browser-reachable package. **`siegemaster` fans out to ONE ITEM PER FLOW**, each carrying a
  single `flowId` and a text suffixed `— flow: <id>`. Its work is strictly serial (one dev server, one reset lever),
  so a whole-quest item put every flow behind one session's context AND one pt budget; per-flow items give each flow
  its own budget (the pt chain keys on role + base text, and the text carries the flow id) and its own completion
  gate. A flow-less quest still gets exactly one siegemaster item, so the off-map probe families — this quest's only
security (`hostile-input`) and performance (`perf`) coverage — keep an owner. Idempotent:
  a re-Start detects the already-seeded verify tail (a locked `role: ward` item) and skips straight to the status
  transition.
- **Dispatch** (`quest-get-next-step-broker`): FIFO-scans active quests, picks the oldest with incomplete work, and
  returns a `NextStep` (`spawn-agents` / `run-ward` / `idle`) to `/dumpster-launch`, which Task()s the agent or calls
  the `run-ward` MCP tool.
- **Session tracking**: each work item carries `sessionId` (parent /dumpster-launch session UUID) AND `agentId`
  (the sub-agent's realAgentId, used to scope chat replay to one `subagents/agent-<id>.jsonl` file). For chat roles —
  ChaosWhisperer, Glyphsmith, BugHunt, matched by the shared `isChatWorkItemRoleGuard`
  (`@dungeonmaster/shared/guards`, backed by `workItemRoleStatics.chat`), which is the SINGLE predicate for "is this
  work item the user's own conversation?" — `sessionId` is captured from the spawned Claude's first stream-json init
  line via `chat-spawn-broker`'s `onSessionId` callback. For every Task-dispatched sub-agent under `/dumpster-launch`,
  both
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

- `flows_approved`, `approved`, and `design_approved` each require non-empty `flows` — nothing else. `approved` no
  longer demands a `role: codeweaver` item: since the codeweaver ledger is DERIVED at Start (`fanOutBy:
  'implementation'`, not authored at spec time by anyone, feature or bug-hunt alike), coverage is definitional rather
  than checked — a quest that clears `flows_approved` already carries every input the generator reads. The guard's
  richer `{ field, contains, questTypes }` form went with it, since nothing was left for that shape to type. What DID
  stay checkable moved to `questSaveInvariantsTransformer` as "Contract Source Coverage": a contract's `source` must
  resolve to a declared package, or the foundation item it should have minted at Start never exists.

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
| `in_progress`         | `start-quest` (Web UI "Start Quest")            | Relay dispatches operation items; agents may write `contracts`/`tooling`/`packagesAffected`/`flows` (additive-only: add nodes/edges/observables to an existing flow, never delete, never a new flow) |
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
- **ChaosWhisperer** reads observables while authoring flows, contracts, and `packagesAffected` during the spec
  phase — it no longer authors the codeweaver operation items themselves; those are DERIVED later, at Start Quest,
  from the flow nodes' package tags and the contracts' source paths
- **Flowrider** uses the full observable to author the flow-perspective test suite below the browser (integration)
- **Groundstomper** uses the full observable to author the Playwright walk for the flow it owns
- **Siegemaster** uses the full observable to manually QA the flow and review the suite's coverage

## Quest Stages

| Stage            | Sections Included                                                             |
|------------------|-------------------------------------------------------------------------------|
| `spec`           | flows (with observables), designDecisions, contracts, tooling, operations, workItems |
| `planning`       | planningNotes, operations, contracts                                                 |
| `implementation` | every section — flows, designDecisions, contracts, tooling, operations, workItems, planningNotes |

`spec` carries the ledger alongside the flows so one read can reconcile plan against spine; `implementation` withholds nothing, because a plan handed over without the flows it targets is not diagnosable. The text renderer OMITS a section a stage excludes rather than printing it as `(none)` — an empty header reads to an agent as "this quest has none of these".

## Quest Types

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). `questTypeRegistryStatics`
(`@dungeonmaster/shared/statics`) is the single source of truth per type — its intake slash command, create-time seed
role (`initialWorkItemRole`), Start-Quest relay seed (`startImplementationOps` + `relayTail`), and the execution
`roles` it uses. `orchestration-start-responder` seeds every type through the SAME `questBuildRelayGraphBroker`, which
reads the registry entry for `quest.questType`:

- **`feature`** (`/dumpster-create`): `initialWorkItemRole` = `chaoswhisperer`. `startImplementationOps` is a single
  `codeweaver` seed carrying `fanOutBy: 'implementation'` — NOT authored by ChaosWhisperer, and NOT empty; it is what
  `relayTailFanOutTransformer` expands at Start into the derived per-(package, flow) ledger plus foundation items
  (see "Operations Ledger & Work Items" above). `relayTail` = `ward(changed) → flowrider → groundstomper →
  siegemaster → ward(full)` — three fixed items plus one `siegemaster` item per quest flow (or one, on a flow-less
  quest), one `groundstomper` item per e2e-eligible runtime flow, and the `flowrider` items its package slicing
  mints. There is no blight-review role in this list at all: `blightscout` replaces `blightwarden` and its items are
  APPENDED by the signal-back handler after every committing session rather than seeded once here — see "Blightscout
  is appended after every committing session, never seeded" above.
- **`bug-hunt`** (`/dumpster-hunt`): `initialWorkItemRole` = `bughunt`, so `create-quest` seeds a `bughunt` intake
  operation item + work item exactly as `feature` seeds a `chaoswhisperer` one. That work item is where the intake
  session's `sessionId` lands, which is what gives the browser chat panel a session to hook onto during the hunt.
  `bughunt` is a CHAT role (`workItemRoleStatics.chat`) and is DISTINCT from `pesteater`, the implementation op Start
  Quest seeds. `startImplementationOps` = a single `pesteater` item (orchestrator-seeded, no `fanOutBy`, so it fans
  to exactly one item — `pesteater-prompt-statics` already directs PestEater to write the reproducing e2e itself);
  `relayTail` = `ward(changed) → ward(full)` (no flowrider/groundstomper/siegemaster, and — same as `feature` — no
  seeded blight-review item either). Bug-hunt reuses the flow/observable spec lifecycle, in the shape **ONE FLOW PER
  BUG**: each flow is the reproduction path run once, forking at its last shared node (two outgoing edges labelled
  `today` / `after fix`) into two terminal nodes whose LABELS carry the indicator — `ACTUAL: <symptom today>` and
  `EXPECTED: <what the fix must make real>`. The observables sit on the EXPECTED side (never on ACTUAL — an observable
  is a positive expectation, so one on the broken branch asks PestEater for a test that asserts the bug), and each
  becomes one failing test. The prefixes are a LABEL convention, not a contract field: `flowNodeContract` carries
  id/label/type/packages/observables and has nowhere else to put them, so `dumpsterHuntPromptStatics` and
  `pesteaterPromptStatics` must spell them identically. A mirrored actual-state/expected-state flow PAIR is what this
  replaced — it duplicated the repro path across both flows, hid which step diverges, and gave a two-bug report four
  flows to pair up by name. Since the `pesteater` seed has no
  `fanOutBy`, one PestEater session owns every flow on the quest however many bugs the report named.

Each type owns its COMPLETE relay via its registry entry. Adding a type = one `questTypeRegistryStatics` entry + the
type added to `questTypeContract`.

## Agent Roles

Every relay role is one operation item → one work item → one agent session. An agent does its work, then signals
`complete` with an `operationStatus` (`done`, `partial`, or `blocked`); the orchestrator applies the outcome to the
ledger and advances. Agents have **no failure signal for work they could have done** — they fix their own problems and
move forward; `blocked` is reserved for an environment wall outside their reach and halts the quest for the user rather
than spawning a successor that hits the same wall. The other failure concept is a **ward exit-code red**
(`quest-run-ward-broker`), which inserts a spiritmender + a fresh ward and, when the ward retry budget is spent, blocks
the quest. Quest status is then derived from work-item + operation state.

The relay role set per quest type is `questTypeRegistryStatics[type].roles`. The `agentRoleContract` enumerates the
Claude-dispatched agent roles (codeweaver, spiritmender, flowrider, groundstomper, siegemaster, blightscout, pesteater,
warpgate) — no minion name is ever also a role, since `agentPromptClassificationStatics.roleNames` and `.minionNames`
are DISJOINT (see "Minions" below); the broader `workItemRoleContract` (shared) adds the command role
(`ward`) and the four interactive CHAT roles (`chaoswhisperer`, `glyphsmith`, `bughunt`, `tavernkeeper`) a work item may
carry. Those four ARE the `workItemRoleStatics.chat` tuple, and `isChatWorkItemRoleGuard` is the one predicate every
call site uses to match them — adding a chat role means adding it to that tuple, not to another `||` chain.

`tavernkeeper` — the post-quest follow-up conversation — is a chat role with two narrower subsets it alone occupies, and
both exist to stop it from being mistaken for the intake thread:

- `workItemRoleStatics.postQuestChat` — it has its own composer in the FOLLOW-UP tab, so any selector reaching for
  "the chat thread the MAIN composer resumes" must subtract this subset or it picks up the follow-up instead.
- `workItemRoleStatics.excludedFromStatusDerivation` — `workItemsToQuestStatusTransformer` ignores its work items,
  because a tavernkeeper item is created AFTER the quest terminated and asking a question must not flip a finished quest
  back to reading as running.

It owns a work item but never an operation item: the follow-up chat spawns outside the operations ledger entirely.

| Role           | Dispatched By                                                                         | Operation outcome                   | Ledger writes (modify-quest)                                                                          |
|----------------|---------------------------------------------------------------------------------------|-------------------------------------|-------------------------------------------------------------------------------------------------------|
| ChaosWhisperer | `/dumpster-create` (interactive)                                                      | N/A (spec)                          | full spec surface (flows, observables, contracts, packagesAffected) — never `operations`               |
| Glyphsmith     | startDesignChat (interactive)                                                         | N/A (design)                        | status                                                                                                |
| Tavernkeeper   | follow-up chat (interactive, AFTER the quest ends)                                    | N/A (chat; no operation item)       | none                                                                                                  |
| codeweaver     | `/dumpster-launch` via Task() (one per codeweaver op item)                            | complete (done / partial / blocked) | none                                                                                                  |
| ward           | `/dumpster-launch` via `run-ward` MCP tool (command)                                  | exit code (green / red)             | none (broker writes wardResults + item status)                                                        |
| flowrider      | `/dumpster-launch` via Task() (one session for every RUNTIME flow)                    | complete (done / partial / blocked) | `flowriderSignoff` per unit (written by `flowrider-coverage-minion`; the operator signs what it adds) |
| groundstomper  | `/dumpster-launch` via Task() (ONE SESSION PER e2e-eligible RUNTIME FLOW; no minions) | complete (done / partial / blocked) | `flowriderSignoff` per unit, over the browser-reachable package kinds                                 |
| siegemaster    | `/dumpster-launch` via Task() (ONE SESSION PER FLOW)                                  | complete (done / partial / blocked) | `siegemasterSignoff` per unit, plus `planningNotes.questNotes`                                        |
| blightscout    | `/dumpster-launch` via Task(); its item is APPENDED by signal-back after every committing session (ONE-COMMIT audit; no minions) | complete (done / partial / blocked) | `planningNotes.blightLedger` (per-unit dispositions)                                                  |
| spiritmender   | `/dumpster-launch` via Task() (inserted on ward red)                                  | complete (done / partial / blocked) | none                                                                                                  |
| pesteater      | `/dumpster-launch` via Task() (bug-hunt front; reads quest itself)                    | complete (done / partial / blocked) | none                                                                                                  |
| warpgate       | dispatched like any relay role, but its item is appended at MERGE time (see below)    | complete (done / partial / blocked) | none                                                                                                  |

### Warpgate — the one ledger item appended after the relay has drained

Every other operation item is derived/seeded at Start (`questBuildRelayGraphBroker` reading
`questTypeRegistryStatics` — including the codeweaver items themselves, via `fanOutBy: 'implementation'`). Warpgate
is neither: `OrchestrationMergeResponder`
appends it when the user presses "Teleport with Booty (Merge)" on a quest that is already `complete` or `blocked`
(`isMergeableQuestStatusGuard`). Because its text has no home in the registry, it lives in `warpgateOperationStatics`.
Once appended it dispatches exactly like any other relay role — `get-next-step` → Task ()/headless child →
`get-agent-prompt` → `signal-back`.

Four things about that append are load-bearing, and all four live inside `questOperationsUpdateBroker`'s per-quest lock:

- **Status flips to `merging` BEFORE the append.** The ops-update broker re-derives quest status on every write from
  whatever it reads off disk; from `complete`, a pending warpgate item would derive `in_progress` — neither a legal
  transition out of `complete` nor what a merge means.
- **The operation is minted WITH its work item**, so `questAdvanceBroker`'s strict-1:1 resume guard (which skips a
  pending operation that already has a linked work item) can never mint a second one for it.
- **`dependsOn: []`, deliberately unchained.** A merge is a fresh top-level dispatch on a finished quest, not the next
  relay step — and on a blocked quest the trailing work items are `skipped`, which does NOT satisfy `dependsOn`, so a
  chained merge item would never become ready.
- **Every non-complete operation item is force-completed first.** A blocked quest arrives with items still
  `pending`/`in_progress` (the block drained the WORK items to `skipped`, but an operation item has no skipped state).
  Left alone they would keep the quest deriving `merging` forever instead of settling at `merged`, and would let the
  dispatch scan's advance self-heal mint an abandoned relay item into the worktree the moment the merge finishes.

It is `locked: true`, which enrolls it in the `slotManagerStatics.warpgate.maxAttempts` pt budget — the only bound on an
agent that never converges on its own. A double-click on Teleport is two POSTs that both clear the mergeable-status gate
before either writes, so the update callback refuses a second warpgate operation from inside the lock; without that
guard N clicks mint N merge agents against the one worktree. The responder also kills any running follow-up chat
(`isPostQuestChatWorkItemRoleGuard`) before writing anything, because tavernkeeper spawns outside the ledger and nothing
else would stop it sharing the worktree warpgate is about to take.

### The pt-N verify fixpoint

`ward` is a **fixpoint role**: a red run completes its operation item and the orchestrator appends a `"pt N: {text}"`
continuation so a FRESH ward run re-verifies the new state; the chain converges when a run comes back green (see
"Failure handling" for the spiritmender splice that runs between them).

`flowrider`, `groundstomper`, `siegemaster`, and `blightscout` are **operators**, NOT fixpoint roles: they signal on remaining scope —
`done` once every unit in scope is settled on that role's own track, `partial` only for a named remainder. Writing a
test, walking a path, or landing a fix does not by itself earn another pass.

For all three that claim is not taken on trust. A flow decomposes into atomic **verification units**
(`get-qa-checklist` — every terminal, labelled branch, observable, and the seven off-map probe families), and each unit
carries TWO independent top-level sign-offs: `flowriderSignoff` (is it proven by a test?) and `siegemasterSignoff`
(does it hold when a human drives the real system?). Each is `{ verdict, evidence, question?, workItemId, at }` with
`verdict` one of `confirmed | unconfirmable`; a unit is done when BOTH fields have been signed. `get-qa-checklist` takes
a `track` param and an optional `packageNames`, and its `remainingItemIds` is that track's sign-off difference over that
slice. **`track` is the DENOMINATOR, not the field** — `signoffDenominatorTrackContract` carries three names
(`flowrider | groundstomper | siegemaster`) over the two fields `signoffTrackContract` carries, because Flowrider and
Groundstomper both write `flowriderSignoff` over disjoint `packageTypes`. Passing the sibling's name returns the exact
complement of your own work. With either authoring track and no `flowId` it returns RUNTIME flows only, because an
operational flow's end state is hand-checked rather than asserted by a suite. Pass `packageNames` when your operation
item declares any, or you read a whole-quest remainder while your own gate clears at zero — the refusal message names
the exact reproducing call, slice included. `blightscout`'s diff decomposes into atomic **review units**
(`get-blight-checklist({ scope: 'commit' })` — every file changed in the LAST COMMIT crossed with each of FIVE
concerns: `craft`, `perf`, `dedup`, `integrity`, `test-cases`), each unit getting a disposition in
`quest.planningNotes.blightLedger`. `scope: 'commit'` is deliberate and non-negotiable — omitting it reads the
WHOLE quest diff from `baseRef`, the exact whole-diff surface blightscout replaced `blightwarden` to get away from.
Blightwarden's old FOUR concerns (`craft`, `perf`, `dedup`, `integrity`) gained a fifth (`test-cases` — did every
branch this commit added get a test at all), but lost dead-code detection entirely: whether an export still has a
consumer is a property of the whole post-fix import graph, which no single-commit pass can answer, so it is now
deliberately UNOWNED pending a deterministic tool rather than covered by any role. Either way `signal-back` recomputes the
outstanding set and **refuses `done` while any unit is unsigned / undispositioned** (see "Signal System"). Completion
is computed, not remembered — a session that reported `done` having walked part of one flow, or reviewed part of one
commit, is the failure that motivated this.

**A measured defect is a NEW observable, not a verdict.** An observable is a positive expectation, so its inverse
("send `bleh` and the server crashes instead of returning 400") is ADDED to the flow through the additive spec
authority both operators hold, and then carries its own two sign-offs. Provenance is a separate axis: `addedBy` on the
observable (`spec | chaoswhisperer | codeweaver | flowrider | siegemaster | operator`) answers "was this in the spec at
approval, or added mid-quest, and by whom".

**`quest.planningNotes.questNotes[]` is the durable side channel** — `{ id, kind: 'open-question' | 'tooling-error' |
'out-of-scope' | 'walk-reset', role, workItemId, flowId?, unitId?, summary, detail, at }`. A note NEVER closes a unit;
only a sign-off does.

**Siegemaster's track has a reset lever.** `reset-flow-signoffs` clears `siegemasterSignoff` across ONE flow and
appends a `walk-reset` note; Flowrider's track is untouched. Sign-offs written before a mid-walk fix describe a system
that has since changed, so the operator resets and re-walks. Resets are free within a session — they cost no pt-chain
attempt.

Each locked (verify-tail) role's pt chain is bounded by `slotManagerStatics.<role>.maxAttempts` (ward by
`slotManagerStatics.ward.maxRetries`); a spent chain blocks the quest instead of looping. A chain is keyed on role +
base text — so **every one of these budgets is bought by what the item's TEXT names**, and a role whose siblings share
one sentence shares one budget across all of them. `blightscout` holds one budget PER COMMIT it is dispatched to
review — unlike old `blightwarden`, which held exactly one item (and one budget) for the whole quest, each blightscout
item is its own operation item scoped to `get-blight-checklist({ scope: 'commit' })`, never the whole quest, and
because each carries the reviewed operation item's role + id in its text, each commit gets its own budget;
`flowrider` holds one PER PACKAGE it owns
plus one seam item, and because each carries its package (or the seam's package set) in its text, each slice gets its
own budget; `groundstomper` and `siegemaster` each hold one
item PER FLOW, and because each carries the flow id in its text, each flow gets its own budget. The continuation
copies the item's `flowIds` AND its `packageNames` so the fresh session keeps that scope — a continuation that lost
either would silently work the whole quest instead of the remainder. See "Signal System" + "Failure handling".

### Minions (parent-summoned sub-agents)

Groundstomper and Blightscout both run alone, for different reasons. Groundstomper: a browser walk is one path at a
time against one served app, so there is nothing to fan out and the session that authors a case is the one that
watched it go red. Blightscout: its whole surface is ONE COMMIT — a single session's output — so there is nothing to
partition and nobody to brief; delegating would mean the session that reads the code is no longer the session that
signs for it. This is what replaced `blightwarden`'s three-minion fan-out
(`blightwarden-group-minion`/`blightwarden-crosscut-minion`/`blightwarden-deadcode-minion`, which existed only
because a whole-quest diff — measured at 170 files on the quest that motivated the split — had to be cut into 29
groups of 6 and dispatched 8 at a time): with no groups, the old crosscut concern becomes `dedup` + `integrity`
searched REPO-WIDE from blightscout's single session instead (every earlier commit on the branch is already on disk,
so a repo-wide search from the later of any duplicate pair sees the earlier one without a second pass), and the old
deadcode concern is dropped — deliberately unowned pending a deterministic orphan-export tool, since whether an
export still has a consumer is a property of the whole post-fix import graph that no per-commit pass can answer.
Codeweaver, Flowrider, and Siegemaster fan their single session out to sub-agent minions summoned via
the Agent tool (the `codeweaver-piece-minion`, `flowrider-authoring-minion`, `flowrider-coverage-minion`,
`siegemaster-walker-minion`, `siegemaster-test-audit-minion` names in `agentPromptClassificationStatics.minionNames`,
plus `chaoswhisperer-gap-minion` which ChaosWhisperer summons during spec).
Minions are NOT work items and NOT operation items: they call `get-agent-prompt` with no `workItemId`, are briefed
inline by their parent, and never signal back — that parallelism lives inside the parent's turn, observable under the
parent's chain via wire-level toolUseId correlation. Flowrider dispatches one
`flowrider-authoring-minion` per bundle and then ONE `flowrider-coverage-minion`, which is the only writer of the Flowrider
track: the authoring minion never signs its own work, or the gate would be satisfied the moment authoring returned.
The parent verifies every returned artifact before recording or trusting it.

**Fix authority is delegated, not withheld.** A minion that finds a hole in its own work may close it — forbidding that
defers a one-line fix downstream and makes the next session re-derive it. Each parent narrows that default in the brief
it writes, and two narrowings are structural rather than stylistic: a `siegemaster-walker-minion` must record a defect's broken
state BEFORE fixing it (the operator verifies by re-driving, which a premature fix makes impossible), and a
`READ-ONLY`-lane `siegemaster-walker-minion` edits nothing at all (a source edit reloads the dev server under whichever minion
is mid-walk). What every minion hands up instead of taking: architectural fixes, anything crossing bundles, and anything
needing a product decision — the parent holds the whole-quest view. No minion runs `git`; the parent owns the session's
single commit.

## Signal System

Agents report via the `signal-back` MCP tool. `complete` is the SOLE signal kind — a session-terminal marker. The
operation OUTCOME rides on the same call as `operationStatus` (`signalBackInputContract`: `signal: 'complete'`,
`operationItemId?`, `operationStatus?: 'done' | 'partial' | 'blocked'`, `blockedReason?` — `failed` is explicitly
rejected). The live handler is `quest-handle-signal-back-responder.ts`, which applies the outcome server-side
(authoritative — an agent cannot forget to patch the ledger, because agents never write it):

0. **Completion gate (before any mutation).** For a `flowrider` operation item, a `siegemaster` operation item
   declaring `flowIds`, or a `blightscout` operation item, `done` is recomputed rather than believed: the responder
   rebuilds the verification units in scope (flowrider / siegemaster) or the LAST COMMIT's blight checklist
   (blightscout, via `questGetBlightChecklistBroker({ questId, scope: 'commit' })` — never the whole-quest `scope:
   'quest'` diff) and THROWS if any unit carries no sign-off on THAT ROLE'S TRACK
   (`flowriderSignoff` / `siegemasterSignoff`) or no `blightLedger` entry respectively — naming the outstanding units
   so the agent can act. Nothing is persisted, so the session simply carries on and signals again. **Both verdicts
   clear a unit** (`confirmed` and `unconfirmable` alike), so the gate is always satisfiable honestly; it refuses
   ABSENCE, not honesty. The two tracks are independent: signing one never advances the other, and each denominator is
   defined by `signoffTrackEligibilityStatics`, which is keyed by ROLE rather than by sign-off field: Flowrider and
   Groundstomper both write `flowriderSignoff` over DISJOINT `packageTypes`, so neither settles the other's units.
   Flowrider's denominator excludes the off-map families and anything
   `addedBy: 'siegemaster'`. A siegemaster item declaring no `flowIds` is never gated, which keeps a flow-less quest
   and any pre-gate item completable. A quest with no pinned `baseRef` (so no diff can be computed, even for the
   single-commit `HEAD~1` measurement) is likewise never gated on the blightscout branch.
1. Marks the signaled work item terminal (`completedAt`, `actualSignal`) — `complete`, or `failed` on `blocked`.
2. Resolves the linked operation item (the call's `operationItemId`, else the work item's `operations/<id>` ref).
3. `operationStatus: 'done'` (or absent) → marks that operation item `complete`.
4. `operationStatus: 'partial'` → marks it `complete` AND appends a `"pt N: {text}"` continuation item (same role,
   `locked`/`wardMode` preserved) immediately after it — **duplicate-on-partial**. This keeps the strict 1:1
   operation↔work-item invariant and an immutable pt audit trail (instead of reverting a shared item's status). The pt
   chain is the verify fixpoint; for a locked role it is bounded by `slotManagerStatics.<role>.maxAttempts`, and a
   spent chain blocks via `quest-block-on-failure-broker` instead of appending.
4b. **Blightscout auto-append**, on `done` and `partial` alike — the two outcomes that leave a commit behind and let
   the quest carry on. When the completing item's role is in `blightscoutOperationStatics.committingRoles`, a
   `locked: true` `blightscout` operation item AND its linked work item (`dependsOn` the signalling work item) are
   appended right after the completed item and AHEAD of any pt continuation, so the review of that commit is the next
   thing dispatched. `blightscout` is not a member of that list, which is what makes the append terminate. Neither
   `blocked` nor a spent pt chain appends one. Full rationale in "Blightscout is appended after every committing
   session, never seeded" above.
5. `operationStatus: 'blocked'` (requires `blockedReason`) → the **environment wall**: a denied command, a missing
   credential, an unreachable service — something no fresh session of the same role could pass. The item is marked
   `complete` and a `pt N` continuation is appended exactly as for `partial`, so a resume re-dispatches this same scope;
   but the work item is marked `failed` carrying `blockedReason` as its `errorMessage` (the execution row renders it),
   and the quest blocks IMMEDIATELY via `quest-block-on-failure-broker`. The pt budget does NOT gate this append — the
   block is itself the bound, and withholding the continuation would leave the operation with no pending item, so a
   resume would silently skip the scope. Spending the budget on successors that provably cannot succeed is exactly what
   this outcome exists to prevent.

Work-item-terminal + operation-complete + the optional pt N + the optional scout (its operation AND its work item) land
in ONE `questOperationsUpdateBroker` persist (all-or-nothing on crash). The handler is **idempotent**: a redelivered
signal for an already-terminal work item is a no-op (no second pt N, no second scout, no second work item). Afterwards
`questAdvanceBroker` creates the next work item — except on the two halt routes (`blocked`, spent pt chain), which block
instead of advancing. When a scout was appended, advance is a no-op by design: the scout is the first pending operation
and already carries its work item, which is precisely what the strict-1:1 resume guard refuses to duplicate.

`agentOperatingRulesStatics` (Rule 5), embedded in every file-changing worker prompt, is what teaches each role to pick
`blocked` over `partial` when the wall is environmental.

### Failure handling

The orchestrator has TWO failure concepts: **a ward exit-code red** and an agent's **`operationStatus: 'blocked'`**
environment wall (see "Signal System" step 5). There is no `failed`/`failed-replan` agent signal for work an agent could
have done, and no PathSeeker replan. Ward routing lives entirely in `quest-run-ward-broker.ts`:

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
`slotManagerStatics.orphanRecovery.maxResets` the crash loop is terminal and the quest blocks. The broker returns
`{ quest, blocked }`, and `scan-once-layer-broker` STOPS on `blocked: true` — it does not fall through to the advance
self-heal, because minting and dispatching the next ledger scope's work item against a quest that just halted is exactly
the bug that flag exists to prevent.

**Never clobber a retained session.** `buildSpawnInstructionLayerBroker` decides resume-vs-fresh on
`sessionId !== undefined && agentId === undefined` — it does NOT consult the `resume` marker. Any
dispatchable work item carrying a session resumes it, whatever the role. Gating on the marker meant an
item whose session was recorded but never formally reclaimed (a quest that blocked before recovery
reached it, a hand-repaired quest.json) fresh-spawned, and the new child's init line overwrote
`sessionId` — silently orphaning a session that still held real work. `agentId` is the ONE exception:
`get-agent-prompt` stamps it together with a `sessionId` that is the user's `/dumpster-launch` loop
session, not the agent's own. The `resume` marker is still written as an audit record of "this item was
reclaimed"; it no longer gates dispatch. The resume prompt itself opens by telling the agent it was
CUT OFF (killed, not paused) and requires re-establishing real state before any new work, since its
last action may never have landed. Covered end-to-end by
`packages/web/src/flows/quest-chat/dispatch-resumes-retained-session.e2e.ts`, which asserts the
spawned child's actual argv and prompt.

**An API overload is not a crash.** A dispatched child that exits non-zero after emitting a 529 / `overloaded_error`
marker lost the upstream API, not its own work. `spawn-one-agent-layer-broker` owns that case BELOW orphan recovery: it
re-dispatches the same work item in place on `apiOverloadRetryStatics`' schedule (10 retries a minute apart, then 20 five
minutes apart) WITHOUT touching `retryCount`, resuming the captured session when the dead attempt reached its init line.
Recovery's budget is 3 resets and a 529 death takes seconds, so routing overloads through recovery blocks a quest inside
a few minutes of an outage that would have cleared itself. Detection needs BOTH the marker and the non-zero exit — a
marker alone is just an agent printing a string. The retry yields to a paused dispatcher (rechecked after each backoff,
which can sleep minutes) and to a work item that went terminal mid-wait.

**Resuming a blocked quest rearms it.** `OrchestrationResumeResponder` accepts `blocked` as well as `paused` (a block
leaves no `pausedAtStatus`, so it restores `in_progress`) and runs `quest-resume-rearm-work-items-transformer` first:
every work item whose linked operation item is still unfinished goes back to `pending` with `retryCount` cleared,
keeping `sessionId` + the `resume` marker. Without it the blocking item is still `failed` at the budget, so the next
recovery pass re-escalates and re-blocks — a resume that does nothing. The rearm persists BEFORE the status flip. Items
whose operation item is `complete` are left alone, so a red ward's superseded `failed` item is not resurrected.

**The dev server is Siegemaster's alone.** `agentPromptGetBroker` resolves `devServer.devCommand` + `devServer.port`
from `.dungeonmaster.json` for `role === 'siegemaster'` ONLY, and `workItemToPromptTransformer` appends
`Dev Server Command` / `Dev Server URL` to that role's Operation Context only.

- **Siegemaster starts one by hand and owns it** from Gate 5 to Gate 10, because hands-on walking cannot lean on a
  `webServer` that is torn down when an e2e run ends. It is also the single writer of the seed/reset lever, since the
  lever defines every walker's precondition. Teardown is a scoped kill (port + cwd), never a blanket one.
- **Flowrider and Groundstomper are given no dev server and need none.** Groundstomper's Playwright run brings its own
  up from the project's config (`webServer`) and tears it down with the run, and its tests navigate `baseURL`-relative
  so no URL reaches the test; Flowrider never touches a browser at all. The one thing the values could have bought —
  authoring a `webServer` block into a config that lacks one — is install-time scaffolding rather than a test, shared
  by every flow on the quest, and the sibling groundstomper items work against the same tree. A missing `webServer`
  makes every unit it blocks `unconfirmable` on the Flowrider track, not something any of these sessions writes.

Operational flows run no server.

**The operator roles' minions run in lanes, for opposite reasons.** Flowrider's minions run in PARALLEL — authoring
tests needs no exclusive resource — but the operator keeps the two things that are not parallel-safe: it runs
`npm run build` once before dispatch (concurrent `tsc` corrupts the shared `dist/`) and it owns the session's only
`git` write. Siegemaster's walker minions are SERIAL, always — browser, `curl`, CLI, queue and sweep alike, because
they share one server's state and one reset lever. Its `siegemaster-test-audit-minion`s run in PARALLEL, but only
because they run LAST: the walks are already finished, so nothing is driving the system while they read and add tests.

**Siegemaster's walkers converge by re-walking, not by self-certifying.** A walker walks its slice, STOPS at the first
defect, fixes it red-first, and reports — it never continues past its own repair. The operator then dispatches a FRESH
walker over the same slice from the reset state, and that independent clean traversal is what verifies the fix. This
is why a walker may fix at all: the session that made the repair is never the one that grades it.

### Completion

`work-items-to-quest-status-transformer` is operation-aware. It never derives `complete` while ANY operation item is
`pending` or `in_progress` — that window is exactly "last session finished, advance hasn't created the next work item
yet." Pre-execution, user-paused, abandoned, and blocked statuses are never derived over. When every work item is
terminal AND the ledger is drained it returns `complete`; an unrecovered sink failure with a drained ledger returns
`blocked`; otherwise `in_progress` (a dispatchable item exists, or advance will create one from the ledger). `skipped`
is terminal and non-failure but does NOT satisfy `dependsOn`, so a `skipped` dep permanently dead-ends its dependents.

### MCP Sanitization

The MCP `modify-quest` tool gates writes by the per-status allowlist (`quest-status-input-allowlist-statics`):

- `operations` — off the allowlist entirely, at every status. No agent writes the ledger anywhere: the codeweaver
  ledger is DERIVED at Start (`fanOutBy: 'implementation'`), not authored by ChaosWhisperer, and every runtime
  mutation goes through `questOperationsUpdateBroker`, which bypasses this allowlist.
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

| Agent (parent-summoned minion) | Summoned By                                 | Purpose                                                                                                                                                                                                                                                         |
|--------------------------------|---------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| chaoswhisperer-gap-minion      | ChaosWhisperer (inside `/dumpster-create`)  | Validate spec completeness before approval                                                                                                                                                                                                                      |
| codeweaver-piece-minion              | Codeweaver via the Agent tool (per piece)   | Focused TDD worker: builds one isolated step/file-group, returns a distilled artifact. No work item                                                                                                                                                             |
| flowrider-authoring-minion               | Flowrider via the Agent tool (per bundle)   | Authors the flow-perspective suite for one bundle of flows and closes the impl holes it exposes (red-first); PARALLEL siblings, so it never builds and never writes `git`. Returns the five-part evidence contract per observable. Signs NOTHING — the coverage minion grades its work                |
| flowrider-coverage-minion      | Flowrider via the Agent tool (alone, after authoring) | The ONLY writer of the Flowrider track. Crosses the `baseRef` diff against the units `get-qa-checklist` returns for `track: 'flowrider'` plus the dispatching item's `packageNames` — its slice of the quest's RUNTIME flows, with the browser-reachable package kinds already removed as Groundstomper's — and signs each `confirmed` (a `.test.ts` / `.integration.test.ts` `file:line` plus the break that reds it, witnessed; a Playwright spec is never evidence here) or `unconfirmable` (with a required `question`). Writes sign-offs BATCHED, one call per flow. Authors no tests: a unit with no honest test stays UNSIGNED and routes back to an authoring pass |
| siegemaster-walker-minion             | Siegemaster via the Agent tool (per slice)  | Hand-walks ONE slice of one flow; always SERIAL. STOPS at the first defect, fixes it red-first (e2e or integration by layer), and reports — never continues past its own repair, because a FRESH walker re-walks the slice to verify it. Never runs `git` or ward |
| siegemaster-test-audit-minion  | Siegemaster via the Agent tool (per flow)   | Runs LAST, after every slice is clean, so several may run in parallel. MUTATION-ONLY: breaks the production line, watches whether the test bites, reverts. Authors NO tests (authoring is Flowrider's lane below the browser and Groundstomper's inside it) and never edits implementation — a behaviour change now would invalidate the clean walks. Coverage holes come back for the operator to file as `questNotes`; suspected defects are reported for re-walk |

Blightscout, `blightwarden`'s replacement, summons NO minions at all — its whole surface is one commit, a single
session's output, so there is nothing here to fan out. It does not appear in this table.

The relay roles that DO own a work item (`codeweaver`, `flowrider`, `groundstomper`, `siegemaster`, `blightscout`,
`spiritmender`, `pesteater`, `warpgate`) fetch their prompt the same way, calling
`get-agent-prompt({agent, questId, workItemId})` — see "Agent Roles". `agentPromptGetBroker` THROWS on a role name that
arrives without a `workItemId`, so the split is enforced from both ends: a role cannot fetch as if it were a minion, and
a minion that passed one would be held by `subagentStopNeedsBlockGuard` until it signalled on its parent's item.

`roleNames` and `minionNames` are now fully DISJOINT — no minion name is ever also a dispatchable role. That overlap
used to exist for exactly `blightwarden-group-minion` and `blightwarden-crosscut-minion`, which are gone along with
the rest of the `blightwarden` family. Every minion left is minion-only: adding one of them to `roleNames` would
widen `agentRoleContract` with a role no operation item can ever hold.

## Importing the barrel in a unit test leaks real timers

`startup/start-orchestrator.ts` runs its passive-watcher bootstraps (rate-limits poller,
stale-process watchdog, execution-queue runner) at MODULE LOAD via `setInterval`. Any unit test that
imports the barrel (`./index` → `start-orchestrator`) starts ~3 REAL interval timers plus 2 fs
watchers.

Real Node timers live in the worker's libuv event loop, NOT the module registry — so jest's
per-test-FILE module reset does not stop them. They keep firing for the whole worker's lifetime. The
rate-limits poller reads `~/.dungeonmaster/rate-limits.json` every 5s and, on a transient non-ENOENT
read failure (concurrent processes during a full ward run), writes `rate-limits-watch read error: …`
to `process.stderr` — landing inside a LATER test file's stderr spy window and failing it.

`index.test.ts` calls `indexProxy()` (`index.proxy.ts`) before `await import('./index')`, which spies
`globalThis.setInterval`/`clearInterval` so module-load timers never start; a leak-guard test asserts
`process.getActiveResourcesInfo()`'s Timeout count is unchanged across the import. **Any new unit
test that imports the orchestrator barrel must neutralize the scheduler the same way.**
`start-orchestrator.integration.test.ts` imports `StartOrchestrator` without neutralizing and carries
the same latent leak.

## Headless spawns get Claude-in-Chrome ONLY via `--chrome`, and the flag IS the grant

Claude Code attaches the Claude-in-Chrome MCP only when a session passes `--chrome` (or ran the
interactive `/chrome` flow). A plain `claude -p` gets ZERO `mcp__claude-in-chrome__*` tools — the
extension being installed, and the user's interactive session having the tools, are irrelevant to the
child. `child-process-spawn-stream-json-adapter.ts` therefore passes `--chrome` unconditionally;
siegemaster is the role that needs it, since its prompt directs it to QA `ui-state` observables in a
real browser.

**No `settings.json` grant is required — the flag carries its own permission.** Verified against an
isolated `CLAUDE_CONFIG_DIR` holding no chrome grant and with the project's allow-list ignored:
`mcp__claude-in-chrome__tabs_context_mcp` was PERMITTED while `mcp__webstorm__*` was DENIED under the
same `defaultMode`. Nothing to add to `settingsPermissionsAddBroker` / `dungeonmaster init`.

Two ways it silently fails:
- **Bypass-permissions mode disables it.** `--dangerously-skip-permissions` + `--chrome` = no browser
  tools. Verify the flag actually took effect; do not assume.
- **Sub-agents may not inherit it** — the CLI reports the tool set "was fixed before the browser
  connection completed". Relevant to the `/dumpster-launch` Task() dispatch path, which the adapter
  fix does NOT cover.

The general rule still holds for every OTHER MCP server: an ungranted MCP tool in a headless `-p`
child is denied outright, never prompted — which is why `agentGitPermissionsStatics` exists. Chrome is
the exception because its CLI flag is itself the grant.

## Never parallel-dispatch different roles

The orchestration does not handle it: `signal-back` does not gate on readiness and `get-agent-prompt`
stamps identity without a dependency check, so dispatching two different roles concurrently
force-completes them out of dependency order and INVALIDATES the run. A dependency chain is strictly
serial. The only permitted parallelism is multiple agents OF THE SAME ROLE that a SINGLE
`get-next-step` returned together.

When driving the loop by hand: one `get-next-step` → dispatch only the `workItemId`(s) it returned →
wait → assert `quest.json` on disk → `get-next-step` again. Only ever use ids the tool echoes back,
never one recalled from a seed array or an earlier turn.
