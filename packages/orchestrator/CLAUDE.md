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
  `packages/orchestrator/src/statics/`, and the shape of that source is the design: **the five operation-owning roles
  (`codeweaver`, `pesteater`, `flowrider`, `groundstomper`, `siegemaster`) all resolve to ONE template**,
  `operation-orchestrator-prompt-statics.ts`, with a per-role **discipline pack** interpolated at `$DISCIPLINE` and the
  discipline's bare **id** at `$MY_DISCIPLINE`. `roleToDisciplineStatics` is the map
  (`codeweaver→implementation`, `pesteater→bug-repro`, `flowrider→below-browser`,
  `groundstomper→browser-e2e`, `siegemaster→manual-qa`); each discipline has one pack
  (`discipline-implementation-statics.ts`, `discipline-bug-repro-statics.ts`,
  `discipline-below-browser-statics.ts`, `discipline-browser-e2e-statics.ts`, `discipline-manual-qa-statics.ts`),
  and each pack carries FOUR blocks — `orchestratorMarkdown`, `plannerMarkdown`, `workerMarkdown`, `reviewerMarkdown` —
  one per session in the round. `spiritmender-prompt-statics.ts` and `warpgate-prompt-statics.ts` keep bespoke
  templates: neither is an operation grouping, so neither has a planner/worker/reviewer round or a discipline, and
  `roleToDisciplineStatics` deliberately omits them (a lookup returning `undefined` IS the signal for "bespoke prompt",
  not an error). The minions a parent summons via the Agent tool are `planner-minion-statics.ts`,
  `worker-minion-statics.ts`, `reviewer-minion-statics.ts` — three GENERIC minions serving all five disciplines — plus
  `chaoswhisperer-gap-minion-statics.ts`, the one minion outside that trio (spec phase, no discipline at all).
  See "Minions" below. The valid names are the
  `agentPromptNameContract` enum; `agentPromptClassificationStatics` classifies which are parent-summoned minions vs
  orchestrator-dispatched relay roles, and `agentNameToPromptTransformer` is the exhaustive switch that maps each name
  to its statics + model, and is also the ONE place `$DISCIPLINE`/`$MY_DISCIPLINE` are substituted — a `never` check
  there is what fails the build when a name is added without a prompt.
  `tavernkeeper-prompt-statics.ts` is deliberately absent from all three: the follow-up chat is served by the chat
  prompt path (`chatPromptBuildTransformer`), not by `get-agent-prompt`. There are no `.claude/agents/*.md` files for
  these agents. A relay work-item role
  calls `get-agent-prompt({agent, questId, workItemId})` — the responder resolves the work item's linked operation item
  (its `operations/<id>` ref) and interpolates its scope into the returned prompt; a parent-summoned minion calls
  `get-agent-prompt({agent, questId, discipline})` (no workItemId — it has no work item) and is briefed inline by its
  parent.

  **`agentPromptGetBroker` throws on all three ways to get that split wrong**, and each throw names a different fault:
  a ROLE that supplies a `discipline` (a role's discipline is derived from its role, so accepting one would let a
  dispatched session ask for a sibling discipline's instructions); a ROLE that omits its `workItemId`; and a generic
  minion that omits its `discipline` — served without one, the agent would hold the literal token `$DISCIPLINE` and no
  method at all. `chaoswhisperer-gap-minion` is the mirror case and is refused a discipline, because its template
  carries no placeholder for one to land in.

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
  │   startImplementationOps + the fixed verify tail as operation items (the riftcarver seed heads the
  │   ledger; the codeweaver seed FANS OUT into the derived per-cell ledger here) and creates the
  │   FIRST work item — the riftcarver, spawnerType: 'command'.
  │   PURE quest.json bookkeeping: no spawn, no git, no build, so the POST answers in milliseconds.
  │   Redirects to execute view; banner: "Run /dumpster-launch in your Claude session."
  │
  ▼
User runs /dumpster-launch (long-lived dispatch loop in their session)
  │   Loop: get-next-step() → Task() / run-riftcarver() / run-ward() → await → repeat.
  │   Each response dispatches ONE work item (= one agent session, or one command run) for the
  │   operation item the relay marked in_progress; on signal-back / command exit the relay advances
  │   to the next pending item.
  │
  │   The operations ledger drives the order. For a feature quest the sequence is:
  ├─ riftcarver ──── mcp__dungeonmaster__run-riftcarver({questId, workItemId}); spawnerType: 'command'.
  │                   Carves the branch + worktree, pins baseRef from the new tree's HEAD, mirrors
  │                   node_modules, runs the preflight build. Streams live; log persisted to
  │                   riftcarver-results/<id>.log. Nothing else can run until it goes green.
  ├─ codeweaver ──── one session per DERIVED codeweaver op item (one per package+flow cell, plus one
  │                   flow-less foundation item per package); implementation + unit tests
  ├─ ward (changed)─ mcp__dungeonmaster__run-ward({mode: 'changed'}); spawnerType: 'command'
  ├─ flowrider ──── one session per PACKAGE SLICE; authors those flows' test suites below the browser
  ├─ groundstomper ─ one session per runtime flow reaching an e2e-eligible package; authors its Playwright walk
  ├─ siegemaster ── ONE SESSION PER FLOW; manual QA of that flow
  ├─ ward (full) ─── mcp__dungeonmaster__run-ward({mode: 'full'}); spawnerType: 'command'
  │
  │   Each of those four agent roles (and `pesteater` on a bug-hunt) is an ORCHESTRATOR, not a
  │   worker: its session never opens a source file. It runs a bounded round loop — planner-minion →
  │   worker-minions one at a time → reviewer-minion → build → ward → commit — and loops on the
  │   reviewer's remainder up to three times. There is no separate standards-review role on the
  │   ledger: the five standards concerns are taken by the `reviewer-minion` INSIDE each of those
  │   sessions, before that session commits. See "Minions" and "The round loop is the unit of work".
  │
  │   (a red ward inserts a spiritmender + a fresh ward after it; a REPAIRABLE riftcarver red does the
  │    same with a fresh pt N carve; a spent budget on either blocks the quest, as does a riftcarver
  │    git-state or permission failure — see "Failure handling".)
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
  duplicate-on-partial, and the ward and riftcarver failure splices. Execution
  agents have no ledger write path at all, ever — they read git + the ledger for context and signal an outcome.

**Nothing is appended to the ledger between two seeded items.** The ledger a quest starts with is the ledger it
finishes with, plus `pt N` continuations, the ward/riftcarver failure splices, and the one warpgate item a merge
appends after it has drained. In particular there is **no standards-review role on it at all** — see below.

### The round loop is the unit of work, and standards review happens inside it

The five operation-owning roles (`codeweaver`, `pesteater`, `flowrider`, `groundstomper`, `siegemaster`) do not do
their own work. Each is an ORCHESTRATOR over one operation item, and its whole session is a bounded loop, at most
three rounds:

```
build → planner-minion → read the plan back → worker-minions ONE AT A TIME → reviewer-minion
      → build → ward(the round's files) → commit the round → loop on the reviewer's REMAINDER
```

Five things about that loop are load-bearing, and every one of them is a measurement rather than a preference:

- **The orchestrator never opens a source file.** Its tool surface is an exhaustive ALLOWED/FORBIDDEN table near the
  top of `operation-orchestrator-prompt-statics.ts`: `Read`/`Edit`/`Write` under `src/`, `discover`,
  `get-project-map`/`-inventory`/`get-folder-detail`, and `get-architecture`/`get-syntax-rules`/`get-testing-patterns`
  are all FORBIDDEN to it. It does not load the project standards at all — **its minions do.** This is not
  minimalism: a post-mortem of a 10.5-hour quest measured a monolithic operator running 217 turns with ZERO `Agent`
  calls and writing all 27 of its own sign-offs, because a session that reads source fills up mid-loop and starts
  skipping the dispatches it was told to make. The fix is a session whose context CANNOT fill.
- **ONLY the orchestrator runs `npm run build`** — not its planner, not a worker, not the reviewer. `tsc` writes one
  shared `dist/` per package, so a second builder hands every sibling session phantom TS2339s on correct code. That is
  also why the **workers are strictly SERIAL**: one `Agent` call per assistant message, never two in one message.
  "Independent" in the plan means safe to order any way, not safe to run at once.
- **The plan is PERSISTED, not returned.** The planner writes `quest.planningNotes.operationPlans[]`
  (`operationPlanContract` / `operationPlanPieceContract`, in `@dungeonmaster/shared`) and returns 3-5 lines; the
  orchestrator reads it back with `get-quest-planning-notes`. It has to: the orchestrator cannot check a plan against
  the tree, and a plan that only ever existed in one minion's final message is invisible to the reviewer that verifies
  against it and to any successor session.
- **The reviewer is the only session on the round that verifies anything**, and it is a DIFFERENT session from the one
  that wrote the code. "The author never grades its own work" stopped being an instruction that can be ignored and
  became the shape of the pipeline.
- **The reviewer takes the five standards concerns** — `craft`, `perf`, `dedup`, `integrity`, `test-cases`
  (`standardsReviewConcernsStatics`, embedded in every `reviewer-minion` whatever its discipline) — over
  `get-blight-checklist({ scope: 'working-tree' })`, and records a disposition per unit in
  `quest.planningNotes.blightLedger`. This is what replaced a separate standards-review relay role. That role was
  measured costing 13 sessions, 718 turns and ~370k tokens of preamble on one quest to produce three cosmetic changes;
  the concerns are cheap, the session around them is not, and the reviewer is already open in the files. Its
  `scope: 'working-tree'` (changed since HEAD, **untracked included**) is not interchangeable with `commit`: the
  reviewer runs INSIDE its parent's turn, BEFORE that parent commits, so a commit-shaped reading hands it the round
  BEFORE its own — and every form of `git diff` reports tracked paths only, which on a fresh round hides most of what
  was just written. `blightConcernGatingStatics` withholds `perf` and `integrity` from declaration-shaped files
  (`-contract.ts`, `.stub.ts`, `.proxy.ts`, `.test.ts`, `.e2e.ts`, `.harness.ts`, `index.ts`): across 88 review units
  on one real quest those two produced ZERO findings on that file mix, which is a property of the QUESTION, not of the
  reviewer — a unit that can only be dispositioned "n/a" costs a review pass to say so.

**Work item = one agent session.** `quest.workItems[]` are generic session containers (`role`, `status`, `dependsOn`,
`relatedDataItems`, `sessionId`, `agentId`). The load-bearing invariant is **strict 1:1**: each work item links to
exactly one operation item via `relatedDataItems: ['operations/<id>']`, and each operation item is worked by exactly
one work item over its life.

- **Advance / relay** (`questAdvanceBroker`): the next actionable item is the FIRST `pending` operation item. Advance
  creates ONE work item for it (role; `spawnerType` = `command` when `isCommandWorkItemRoleGuard` matches, else
  `agent`; `dependsOn` chained after the most recent dependency-satisfying work item;
  `relatedDataItems: ['operations/<id>']`) and marks the operation item `in_progress` — in the same atomic persist.
  That guard, backed by `workItemRoleStatics.command` (`['ward', 'riftcarver']`), is the SINGLE input to the
  `spawnerType` decision and to "is this Claude's to run" — data rather than a `role === 'ward'` ternary, because a
  ternary has to be found and edited at every dispatch site and a missed site hands the role to `agentRoleContract`,
  which throws on a name it does not enumerate. It is called from BOTH the signal-back handler AND the dispatch scan's
  self-heal. A **resume guard** makes it act only on a `pending` item with NO linked work item, so no caller (double
  signal, re-entrant scan, restart) can ever mint a second work item for one operation.
- **Seed** (`questBuildRelayGraphBroker`, at Start): mints the quest type's `startImplementationOps` + `relayTail`
  (from `questTypeRegistryStatics`) as pending operation items (locked, except the feature `codeweaver` seed, which
  mints unlocked so its pt chain stays unbounded — see below), force-completes any leftover
  chat-role intake items (`isChatWorkItemRoleGuard` — chaoswhisperer / glyphsmith / bughunt), and creates the first
  work item — all in one `questOperationsUpdateBroker`
  persist. **`startImplementationOps` leads with a `riftcarver` seed for BOTH quest types**, so the first work item
  this mints is always the carve, `spawnerType: 'command'`. It carries no `fanOutBy` (exactly one item) and no
  `locked` override (defaults true, which enrols it in `slotManagerStatics.riftcarver`'s budget), and it is excluded
  from the spine-packages fallback the other orchestrator-seeded items get: `packageNames` exists to narrow an
  AGENT's search, and a command has no prompt to narrow — writing the flow-tagged packages onto it would claim the
  carve builds only those, when what it prepares is the whole worktree. This broker also stamps **no `baseRef`**: it
  runs before any worktree exists, so the only HEAD it could read is the server process's own checkout, and
  riftcarver is the sole writer of that field. Most `relayTail` entries map 1:1 to an operation item. **`codeweaver` fans out BY IMPLEMENTATION CELL**
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
  returns a `NextStep` (`spawn-agents` / `run-riftcarver` / `run-ward` / `idle`) to `/dumpster-launch`, which Task()s
  the agent or calls the matching MCP tool. A ready COMMAND item is returned ALONE, under its own step type, before
  anything is batched — each command owns the whole tree for the length of its run (riftcarver creates the workspace,
  ward grades it), so batching one beside an agent would let that agent edit the tree mid-run, and a riftcarver item
  reaching `build-spawn-instruction-layer-broker` is a crash rather than a mis-dispatch. `scan-once-layer-broker`'s
  missing-worktree halt exempts `run-riftcarver` and only `run-riftcarver`: the carve OWNS creating that path and its
  own done-check re-creates it, so halting ahead of it would leave the quest blocked by the one step that could have
  repaired it.
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
- **The COMMAND roles** are the non-agent items (`spawnerType: 'command'`) — `workItemRoleStatics.command` is
  `['ward', 'riftcarver']`. The `run-ward` / `run-riftcarver` MCP tools each block until the command exits, and
  `quest-run-ward-broker` / `quest-run-riftcarver-broker` apply the result to the ledger + the work item. Neither has
  a `sessionId`, so no JSONL watcher can tail either: both brokers take a **required `onLine`**, which is the sole
  route their output has to a UI for minutes at a time. Each also persists a per-run history file under the quest
  folder and back-links it onto the work item — ward its structured detail blob at `ward-results/<id>.json` via a
  `wardResults/<id>` ref, riftcarver the streamed text verbatim at `riftcarver-results/<id>.log` via a
  `riftcarverResults/<id>` ref. That ref is the ONLY route the execution panel has to the detail.

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

`Start Quest` transitions `approved → in_progress` directly (`orchestration-start-responder`), seeding the relay —
and that is ALL it does: pure `quest.json` bookkeeping, no spawn and no git, so the POST answers in milliseconds and
the `quest-modified` event that swaps the browser from the spec panel to the execution panel fires at once. The branch,
worktree, `node_modules` mirror and preflight build are the `riftcarver` item it seeds at the head of the ledger, run
by the dispatcher when the quest is next in line. Once execution starts, quest status is DERIVED from work-item +
operation state by `work-items-to-quest-status-transformer` (see "Completion").

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

**`startImplementationOps` leads with a `riftcarver` seed for BOTH types**, and that placement is the whole design:
the branch, the worktree, the `node_modules` mirror and the preflight build are the HEAD of the relay, so the
workspace is forged when the quest is next in line rather than the moment its spec is approved — and Start Quest
stays a millisecond status flip. The seed carries no `fanOutBy` (exactly one item) and no `locked` override
(defaults true, enrolling it in `slotManagerStatics.riftcarver.maxRetries`). Both types also list `riftcarver` in
their `roles` tuple.

- **`feature`** (`/dumpster-create`): `initialWorkItemRole` = `chaoswhisperer`. `startImplementationOps` is the
  `riftcarver` seed followed by a single
  `codeweaver` seed carrying `fanOutBy: 'implementation'` — NOT authored by ChaosWhisperer, and NOT empty; it is what
  `relayTailFanOutTransformer` expands at Start into the derived per-(package, flow) ledger plus foundation items
  (see "Operations Ledger & Work Items" above). `relayTail` = `ward(changed) → flowrider → groundstomper →
  siegemaster → ward(full)` — three fixed items plus one `siegemaster` item per quest flow (or one, on a flow-less
  quest), one `groundstomper` item per e2e-eligible runtime flow, and the `flowrider` items its package slicing
  mints. **There is no blight-review role in this list, and none is appended to it either**: the standards concerns
  are taken by the `reviewer-minion` inside each of these sessions' own rounds, before that session commits — see
  "The round loop is the unit of work" above. The registry's own comment says so at the point where such a seed
  would otherwise sit, so the absence reads as a decision rather than an omission.
- **`bug-hunt`** (`/dumpster-hunt`): `initialWorkItemRole` = `bughunt`, so `create-quest` seeds a `bughunt` intake
  operation item + work item exactly as `feature` seeds a `chaoswhisperer` one. That work item is where the intake
  session's `sessionId` lands, which is what gives the browser chat panel a session to hook onto during the hunt.
  `bughunt` is a CHAT role (`workItemRoleStatics.chat`) and is DISTINCT from `pesteater`, the implementation op Start
  Quest seeds. `startImplementationOps` = the `riftcarver` seed then a single `pesteater` item (orchestrator-seeded,
  no `fanOutBy`, so it fans to exactly one item — `disciplineBugReproStatics` already directs the round to write the
  reproducing test itself);
  `relayTail` = `ward(changed) → ward(full)` (no flowrider/groundstomper/siegemaster; and, as with `feature`, no
  blight-review item — `pesteater` is itself an orchestrator whose `reviewer-minion` takes the standards concerns
  over the round it just built). Bug-hunt reuses the flow/observable spec lifecycle, in the shape **ONE FLOW PER
  BUG**: each flow is the reproduction path run once, forking at its last shared node (two outgoing edges labelled
  `today` / `after fix`) into two terminal nodes whose LABELS carry the indicator — `ACTUAL: <symptom today>` and
  `EXPECTED: <what the fix must make real>`. The observables sit on the EXPECTED side (never on ACTUAL — an observable
  is a positive expectation, so one on the broken branch asks PestEater for a test that asserts the bug), and each
  becomes one failing test. The prefixes are a LABEL convention, not a contract field: `flowNodeContract` carries
  id/label/type/packages/observables and has nowhere else to put them, so `dumpsterHuntPromptStatics` (which writes
  them) and every block in `disciplineBugReproStatics` (which reads them) must spell them identically; nothing
  typechecks it and the pack's colocated test is the only thing holding it. A mirrored actual-state/expected-state
  flow PAIR is what this
  replaced — it duplicated the repro path across both flows, hid which step diverges, and gave a two-bug report four
  flows to pair up by name. Since the `pesteater` seed has no
  `fanOutBy`, one PestEater session owns every flow on the quest however many bugs the report named.

Each type owns its COMPLETE relay via its registry entry. Adding a type = one `questTypeRegistryStatics` entry + the
type added to `questTypeContract`.

## Agent Roles

Every relay role is one operation item → one work item → one agent session. **For the five operation-owning roles
that session does not do the work itself** — it drives a planner/worker/reviewer round loop and never opens a source
file (see "The round loop is the unit of work"). An agent does its work, then signals
`complete` with an `operationStatus` (`done`, `partial`, or `blocked`); the orchestrator applies the outcome to the
ledger and advances. Agents have **no failure signal for work they could have done** — they fix their own problems and
move forward; `blocked` is reserved for an environment wall outside their reach and halts the quest for the user rather
than spawning a successor that hits the same wall. The other failure concept is a **COMMAND role's exit code**: a
**ward red** (`quest-run-ward-broker`) inserts a spiritmender + a fresh ward and blocks once the ward retry budget is
spent, and a **riftcarver red** (`quest-run-riftcarver-broker`) routes by failure class — a repairable red inserts a
spiritmender + a fresh `pt N` carve, while a git-state or permission red blocks on the spot. Quest status is then
derived from work-item + operation state.

The relay role set per quest type is `questTypeRegistryStatics[type].roles`. The `agentRoleContract` enumerates the
Claude-dispatched agent roles (codeweaver, flowrider, groundstomper, siegemaster, pesteater, spiritmender, warpgate)
— the first five are the orchestrator roles `roleToDisciplineStatics` maps to a discipline; `spiritmender` and
`warpgate` keep bespoke prompts and run no round. No minion name is ever also a role, since
`agentPromptClassificationStatics.roleNames` and `.minionNames`
are DISJOINT (see "Minions" below); the broader `workItemRoleContract` (shared) adds the two COMMAND roles
(`ward` and `riftcarver`) and the four interactive CHAT roles (`chaoswhisperer`, `glyphsmith`, `bughunt`,
`tavernkeeper`) a work item may
carry. Those four ARE the `workItemRoleStatics.chat` tuple, and `isChatWorkItemRoleGuard` is the one predicate every
call site uses to match them — adding a chat role means adding it to that tuple, not to another `||` chain. The command
pair is `workItemRoleStatics.command`, matched the same way by `isCommandWorkItemRoleGuard`; `riftcarver` is
deliberately absent from `agentRoleContract`, so a dispatch site that mistook it for an agent throws rather than
spawning a Claude session for a git sequence.

`tavernkeeper` — the post-quest follow-up conversation — is a chat role with two narrower subsets it alone occupies, and
both exist to stop it from being mistaken for the intake thread:

- `workItemRoleStatics.postQuestChat` — it has its own composer in the FOLLOW-UP tab, so any selector reaching for
  "the chat thread the MAIN composer resumes" must subtract this subset or it picks up the follow-up instead.
- `workItemRoleStatics.excludedFromStatusDerivation` — `workItemsToQuestStatusTransformer` ignores its work items,
  because a tavernkeeper item is created AFTER the quest terminated and asking a question must not flip a finished quest
  back to reading as running.

It owns a work item but never an operation item: the follow-up chat spawns outside the operations ledger entirely.

**Stopping it is `FollowupChatStopResponder`, keyed by QUEST, not `ChatStopResponder`, keyed by chatProcessId.** The
browser pressing STOP on the FOLLOW-UP tab may never have seen the id of the process it wants stopped — the turn can
have been spawned before that page load — so the responder resolves the tavernkeeper work item off the quest and kills
whatever `findByQuestWorkItemId` holds for it. It writes NOTHING: no status, no work-item mutation. The item is left as
it stands precisely so the next message resumes the same conversation (`FollowupChatStartResponder` matches on role
alone, whatever state a stop or a crash left it in), and the spawn's own `onComplete` is what closes the item out and
emits the `chat-complete` the browser's running indicator clears on. `stopped: false` — no tavernkeeper item, or nothing
registered for it — is a 200, not an error: that is a STOP pressed either side of a turn.

This exists because that button used to POST the quest PAUSE route, which kills every process on the quest AND flips
status to `paused` — from `complete`/`merged` an illegal transition (so it errored after the kill), and from `blocked` a
legal one that quietly took the whole quest.

| Role           | Dispatched By                                                                                                                    | Operation outcome                        | Ledger writes (modify-quest)                                                                              |
|----------------|----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| ChaosWhisperer | `/dumpster-create` (interactive)                                                                                                 | N/A (spec)                               | full spec surface (flows, observables, contracts, packagesAffected) — never `operations`                  |
| Glyphsmith     | startDesignChat (interactive)                                                                                                    | N/A (design)                             | status                                                                                                    |
| Tavernkeeper   | follow-up chat (interactive, AFTER the quest ends)                                                                               | N/A (chat; no operation item)            | none                                                                                                      |
| riftcarver     | `/dumpster-launch` via `run-riftcarver` MCP tool, or the Node loop in-process (command); ALWAYS the ledger's first item          | exit code (green / repairable / blocked) | none (broker writes `branchName`/`baseBranch`/`worktreePath`/`baseRef` + riftcarverResults + item status) |
| codeweaver     | `/dumpster-launch` via Task() (one per codeweaver op item). ORCHESTRATOR — discipline `implementation`                            | complete (done / partial / blocked)      | `planningNotes.operationPlans` (its planner) + `planningNotes.blightLedger` (its reviewer)                |
| ward           | `/dumpster-launch` via `run-ward` MCP tool (command)                                                                             | exit code (green / red)                  | none (broker writes wardResults + item status)                                                            |
| flowrider      | `/dumpster-launch` via Task() (ONE SESSION PER PACKAGE SLICE). ORCHESTRATOR — discipline `below-browser`                          | complete (done / partial / blocked)      | `flowriderSignoff` per unit — written by its `reviewer-minion`, never by the session that authored the tests — plus `operationPlans` + `blightLedger` |
| groundstomper  | `/dumpster-launch` via Task() (ONE SESSION PER e2e-eligible RUNTIME FLOW). ORCHESTRATOR — discipline `browser-e2e`                | complete (done / partial / blocked)      | `flowriderSignoff` per unit over the browser-reachable package kinds, plus `operationPlans` + `blightLedger` |
| siegemaster    | `/dumpster-launch` via Task() (ONE SESSION PER FLOW). ORCHESTRATOR — discipline `manual-qa`                                       | complete (done / partial / blocked)      | `siegemasterSignoff` per unit, plus `planningNotes.questNotes`, `operationPlans` + `blightLedger`         |
| spiritmender   | `/dumpster-launch` via Task() (inserted on a ward red, or on a REPAIRABLE riftcarver red). Bespoke prompt, no round               | complete (done / partial / blocked)      | none                                                                                                      |
| pesteater      | `/dumpster-launch` via Task() (bug-hunt front). ORCHESTRATOR — discipline `bug-repro`                                             | complete (done / partial / blocked)      | `planningNotes.operationPlans` (its planner) + `planningNotes.blightLedger` (its reviewer)                |
| warpgate       | dispatched like any relay role, but its item is appended at MERGE time (see below). Bespoke prompt, no round                      | complete (done / partial / blocked)      | none                                                                                                      |

### Riftcarver — the head of the relay, and re-entrant by design

`riftcarver` is the first operation item on every quest, of either type. It detects the base branch, runs
`git worktree add`, pins `baseRef` from the new tree's HEAD, mirrors `node_modules` for the repo root and every
workspace root, and runs the preflight build to convergence — all under one `spawnerType: 'command'` work item, with
every line streamed live to the execution row and persisted to `<questFolder>/riftcarver-results/<id>.log`. Putting it
here rather than inside `POST /api/quests/:questId/start` is what keeps that POST at millisecond scale AND what stops
a workspace being forged at spec-approval time for a quest that may sit behind several others.

**⚠️ THIS BROKER IS RE-ENTERED BY DESIGN — every step owns a done-check.** The repairable failure route is
`riftcarver → spiritmender → riftcarver (pt N)`, so a second run against a PARTIALLY BUILT workspace is ROUTINE, not
an edge case. Therefore:

> **Every riftcarver step MUST begin with a done-check that inspects the REAL WORLD and skip itself when already
> satisfied. A step added without one is a bug, not a simplification.**

Two rules qualify it, and both are load-bearing:

1. **A done-check reads DISK or git, never `quest.json` alone.** A recorded `worktreePath` is a claim; a reachable
   directory whose HEAD is still the recorded branch is proof. The spiritmender that ran between the two attempts may
   have deleted, moved, repaired or `npm install`ed things the ledger knows nothing about. Concretely: the base branch
   is re-verified with `gitVerifyRefAdapter` rather than trusted; the worktree is checked with `fsIsAccessibleAdapter`
   AND `gitCurrentBranchAdapter`; a recorded path that is GONE reads as not-done and is RE-CREATED (attaching to the
   surviving branch without `-b`, after a `git worktree prune`) rather than blocking; and the `node_modules` mirror
   done-checks PER ROOT inside `populate-one-root-layer-broker`, because an attempt may have mirrored six roots of
   nine before dying. Every skip emits its own `— skip … —` line, so the streamed output IS the evidence the contract
   held — a `pt 2` row that shows `git worktree add` re-running is the regression, visible without reading a test.
   The **collision check is skipped on re-entry for the mirror-image reason**: it guards the FIRST carve against a name
   some other work owns, but on a `pt N` the recorded branch is the quest's OWN, so re-running it would refuse the
   continuation against attempt 1's work and lock the quest out permanently. That is the step that breaks first if a
   done-check is dropped.
2. **THE BUILD IS THE ONE DELIBERATE EXCEPTION and has no done-check**, because re-running it IS how the
   spiritmender's fix gets verified. The build is the verdict, not a side effect; a marker file "optimising" it away
   would let a `pt N` report green off the previous attempt's result.

**`baseRef` is written exactly once, ever.** Riftcarver is its sole writer, reading it in the same breath as creation
before `node_modules` or the build can touch the tree, and never recomputing it once recorded — not even when the
worktree is re-created and its fresh HEAD reads back a different sha. Moving it after commits have landed folds the
quest's own work into the review base, the exact defect `baseRef` exists to fix. `questBuildRelayGraphBroker` stamps
none: Start runs before any worktree exists, so the only HEAD available there is the server process's own checkout.

**Failure routing is by CLASS**, off `worktreePrepareStepStatics.classifications` (keyed by the step's own VALUE, the
thing `WorktreePrepareError` carries): `create` / `base_branch` are `git-state` and BLOCK the quest, deliberately, so
no agent is ever dispatched into the repo-root checkout; `node_modules` / `build` are `repairable` and splice in a
spiritmender plus a fresh `pt N` carve, bounded by `slotManagerStatics.riftcarver.maxRetries` counted since the last
GREEN carve. `isPermissionDeniedErrorGuard` is checked FIRST and overrides the step's own class — no fresh session of
any role can talk an operator's filesystem out of saying no. Full outcome table in
`docs/quest-role-paths.md` § "The sad paths in detail" (b2), invariants under `RIFT-*`.

The whole outcome — work-item status, the operation completing, the `riftcarverResults` ref, the work item's
`riftcarverResults/<id>` back-link, and any splice — rides ONE `questOperationsUpdateBroker` persist, so a crash is
all-or-nothing. (Ward writes its results ref in a separate, earlier write; riftcarver's rides the same persist as the
ledger mutation.) The git context `{ branchName, baseBranch, worktreePath, baseRef }` is persisted earlier still —
right after the git steps, BEFORE `node_modules` and the build — so a spiritmender dispatched off a later failure has
a real worktree to work in and the `pt N` behind it can see the git steps are done.

`questHydrateBroker` DROPS the riftcarver item by default (unless a blueprint authors one itself): a hydrated quest is
fabricated directly at `in_progress`, never through Start, so it has no workspace to carve and no scripted scenario
expects one. Without that default the first thing every hydrated quest dispatches is a real `git worktree add` +
mirror + build against the developer's own checkout — precisely the work hydrate exists to skip.

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

`flowrider`, `groundstomper` and `siegemaster` are **operators**, NOT fixpoint roles: they signal on remaining scope —
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
the exact reproducing call, slice included. `signal-back` recomputes that
outstanding set and **refuses `done` while any unit in scope carries no sign-off on the signalling role's own track**
(see "Signal System"). Completion is computed, not remembered — a session that reported `done` having walked part of
one flow is the failure that motivated this.

The standards-review surface is measured the same way and by the same tool family, but it is NOT a role's denominator.
A diff decomposes into atomic **review units** (`get-blight-checklist` — every changed impl file, its test/proxy/stub
companions collapsed onto it, crossed with each of FIVE concerns: `craft`, `perf`, `dedup`, `integrity`,
`test-cases`), each getting a disposition in `quest.planningNotes.blightLedger`. The caller that reads it is the
`reviewer-minion` inside a round, and it must pass `scope: 'working-tree'`; the other three scopes exist for callers
auditing history (`commit` — `HEAD~1...HEAD`), the whole branch (`quest` — from the pinned `baseRef`), or a base the
caller names itself (`since-ref` — from its own `sinceRef` param, which is how the signal-back review-coverage gate
measures ONE work item's whole output from that item's recorded `startRef`). `signal-back` recomputes that surface
and **refuses `done` while any unit in the signalling item's own range carries no disposition** — the same shape as
the sign-off gate, over the review ledger instead of the flow graph. Dead-code
detection is deliberately UNOWNED: whether an export still has a consumer is a property of the whole post-fix import
graph, which no per-file crossing can answer, so it waits on a deterministic orphan-export tool rather than being
assigned to a role that would have to guess.

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

Each locked (verify-tail) role's pt chain is bounded by `slotManagerStatics.<role>.maxAttempts`; a spent chain blocks
the quest instead of looping. The two COMMAND roles hold `maxRetries` keys instead (`ward`, `riftcarver`), because
their chain is counted off the ledger's own role-filtered history — the operation items since the last GREEN run —
rather than off one item's pt continuations. Every dispatched role needs a key of its own either way: the budget
ladder's final `else` hands an unnamed role spiritmender's budget, so a missing key mis-budgets silently rather than
erroring. A chain is keyed on role +
base text — so **every one of these budgets is bought by what the item's TEXT names**, and a role whose siblings share
one sentence shares one budget across all of them.
`flowrider` holds one PER PACKAGE it owns
plus one seam item, and because each carries its package (or the seam's package set) in its text, each slice gets its
own budget; `groundstomper` and `siegemaster` each hold one
item PER FLOW, and because each carries the flow id in its text, each flow gets its own budget. **The pt budget of 3
is a different bound from the 3-round loop inside one session** — a session that spends its three rounds and still
has a remainder signals `partial`, which mints one `pt N` continuation and spends one of the THREE pt attempts. The
continuation
copies the item's `flowIds` AND its `packageNames` so the fresh session keeps that scope — a continuation that lost
either would silently work the whole quest instead of the remainder. See "Signal System" + "Failure handling".

### Minions (parent-summoned sub-agents)

**There are exactly THREE generic minions, and all five orchestrator roles summon the same three.**
`planner-minion`, `worker-minion` and `reviewer-minion` are the phases of one round, parameterized at fetch time by
the dispatching role's discipline (`roleToDisciplineStatics` → `disciplineToPackTransformer`) rather than named after
it. `chaoswhisperer-gap-minion` is the one minion outside that trio — spec phase, before any operation item exists,
so it carries no `$DISCIPLINE` placeholder and is REFUSED a discipline. Those four are
`agentPromptClassificationStatics.minionNames`.

There used to be one minion family per parent role. The reason there is not any more is not tidiness: with per-role
families, the thing that varies between `codeweaver` and `siegemaster` is the SUBJECT MATTER, and the thing that
varies between planning and building and grading is the METHOD — so a family-per-role duplicated every method five
times and made "the author never grades its own work" a sentence each family had to keep on its own. A generic trio
crossed with a discipline pack makes the method structural and leaves the packs holding only the subject matter.
**A generic minion therefore cannot be a role**: it has no discipline of its own until a role hands it one, which is
mechanically why `roleNames` and `minionNames` stay DISJOINT.

Minions are NOT work items and NOT operation items: they call `get-agent-prompt({agent, questId, discipline})` with
**no `workItemId`**, are briefed inline by their parent, and never signal back — the round lives inside the parent's
turn, observable under the parent's chain via wire-level toolUseId correlation. Models are fixed per minion, not per
role: `planner-minion` and `reviewer-minion` on **opus**, `worker-minion` on **sonnet**. Downgrading the reviewer is
the expensive mistake — it is the only session on the round that verifies anything.

- **`planner-minion`** — reads the real code, cuts the work into PIECES (one worker each, ordered by `dependsOn`),
  and persists the plan to `quest.planningNotes.operationPlans[]`. Its return is 3-5 lines, never the plan body: the
  orchestrator reads the plan back from the quest, and pasting it into the return burns the context the orchestrator
  needs to finish the loop. `files` is OWNERSHIP — two pieces must never list the same path, or the second worker
  overwrites the first.
- **`worker-minion`** — executes exactly ONE piece, red-first, staying inside its `files`. Dispatched strictly one at
  a time.
- **`reviewer-minion`** — opens every file the round produced, checks it against the plan's `intent`/`unitIds`, fixes
  what it can red-first, writes the discipline's sign-offs or dispositions, and returns a STRUCTURED block
  (`VERDICT`, `PIECES`, `FIXES MADE`, `REMAINDER`, `UNFIXABLE`, `SIGNOFFS WRITTEN`, `WARD`). An **empty `REMAINDER`
  is what ends the loop**, which is why the template spends its last section on the two ways to lie with it: padding
  it burns a round against a budget of three, and hiding a real one ships the hole, because nothing runs after the
  reviewer.

**Only the planner may spawn a sub-agent, and only for a bounded SPIKE** — a pattern nobody in this repo has built
yet, that cannot be planned against without trying it. Worker and reviewer are LEAVES and may not delegate at all.
That split is why `agentOperatingRulesStatics` exports THREE blocks instead of one — `markdown` for a work-item role,
`delegatingMinionMarkdown` for the planner, `leafMinionMarkdown` for the leaves. A single shared block cannot say both
"never delegate" and "delegate for a spike"; a prompt that contradicts itself is resolved by whichever instruction the
agent reads first. The leaf ban is measured, not stylistic: a leaf's grandchild produces conclusions no gate ever reads
— the parent verifies the minion's FILES, not a grandchild's summary — and that shape cost 3m55s of a 10m20s minion
run.

**Fix authority is delegated, not withheld.** A minion that finds a hole in its own work may close it — forbidding that
defers a one-line fix downstream and makes the next session re-derive it. What every minion hands up instead of taking
goes in `UNFIXABLE` with a named owner: architectural fixes, anything crossing pieces, and anything needing a product
decision — the parent holds the whole-quest view. **No minion runs `git` and no minion runs `npm run build`**; the
parent owns the round's single commit and is the only session on the quest allowed to build.

## Signal System

Agents report via the `signal-back` MCP tool. `complete` is the SOLE signal kind — a session-terminal marker. The
operation OUTCOME rides on the same call as `operationStatus` (`signalBackInputContract`: `signal: 'complete'`,
`operationItemId?`, `operationStatus?: 'done' | 'partial' | 'blocked'`, `blockedReason?` — `failed` is explicitly
rejected). The live handler is `quest-handle-signal-back-responder.ts`, which applies the outcome server-side
(authoritative — an agent cannot forget to patch the ledger, because agents never write it):

**Three gates run BEFORE any mutation, in this order**, and each THROWS rather than returning — the error rides the
awaited `signal-back` path back through the MCP tool to the agent, where it is visible and actionable, instead of being
swallowed as a success. Because nothing is persisted on a refusal, the session simply fixes what the message names and
signals again; the work item and its operation item are exactly as they were.

0a. **Commit-before-signal gate — on `done`, `partial` AND `blocked` alike.** For every role that changes code (the
   five orchestrator roles plus `spiritmender` and `warpgate`), the responder resolves the quest's cwd and refuses
   while the worktree still carries uncommitted changes. The measurement is `gitWorkingTreeFilesBroker`, which unions
   `git diff HEAD --name-only` with `git ls-files --others --exclude-standard`: a bare diff reports TRACKED paths
   only, so the net-new files a worker just wrote — the ones most likely to carry the defect — would be invisible and
   a dirty tree would read as clean. The question is **"is the tree clean", never "did you make a commit"**:
   `git commit --allow-empty` satisfies it, so a round that legitimately changed nothing still signals. A quest with
   no worktree of its own (hydrated, or seeded before worktrees) SKIPS the check rather than failing it — that is a
   real state, not a violation. Both COMMAND roles are absent because they are terminal by exit code and never reach
   `signal-back` at all; every chat role is absent because a conversation produces a spec, not a commit.

   This is a computed gate rather than a line in the operating rules because the post-mortem measured what the prose
   version is worth: a session died ONE gate short of its commit holding a fully verified, twice-green artifact, the
   re-carve destroyed it, and the slice cost 101 minutes of wall-clock for 11 minutes of real work with no trace in
   `quest.json` that any of it happened. It binds `blocked` too — a blocked quest hands its work forward through git
   exactly as a finished one does, so the outcome that halts is the one that most needs the work durable first.

0b. **Sign-off completion gate — on `done` only.** For a `flowrider`, `groundstomper` or `siegemaster` operation item,
   `done` is recomputed rather than believed: the responder rebuilds the verification units in scope and THROWS if any
   carries no sign-off on THAT ROLE'S TRACK (`flowriderSignoff` / `siegemasterSignoff`), naming the outstanding units
   so the agent can act. **Both verdicts
   clear a unit** (`confirmed` and `unconfirmable` alike), so the gate is always satisfiable honestly; it refuses
   ABSENCE, not honesty. The two FIELDS are independent: signing one never advances the other, and the three
   DENOMINATORS over them are defined by `signoffTrackEligibilityStatics`, keyed by ROLE rather than by sign-off
   field — Flowrider and Groundstomper both write `flowriderSignoff` over DISJOINT `packageTypes`, so neither settles
   the other's units. Flowrider's denominator excludes the off-map families and anything
   `addedBy: 'siegemaster'`. A siegemaster item declaring no `flowIds` is never gated, which keeps a flow-less quest
   and any pre-gate item completable.

0c. **Review-coverage gate — on `done` only, from any of the five orchestrator roles.** PER UNIT, exactly like 0b:
   the responder rebuilds the standards-review checklist over everything this work item committed and THROWS while
   any unit on it carries no disposition in `planningNotes.blightLedger`, naming the outstanding units so the agent
   can act. Membership is read from `roleToDisciplineStatics` rather than listed, so a role added to that map is
   covered by both this gate and 0a the day it is added — the same reason `isChatWorkItemRoleGuard` reads
   `workItemRoleStatics.chat` instead of growing an `||` chain.

   **THE RANGE IS THE WHOLE DESIGN.** An orchestrator commits once per ROUND, so at signal time the tree is clean by
   construction: a `working-tree` measurement is EMPTY, and a `commit` one sees only the LAST of several round
   commits. Neither can measure a whole item. What can is `<workItem.startRef>..HEAD` —
   `agentPromptGetBroker` stamps `startRef` with the worktree's HEAD sha the FIRST time an item is served its prompt
   and never moves it, so a resumed or re-served session keeps its ORIGINAL start rather than silently shrinking the
   reviewed range to whatever landed after the crash. `questGetBlightChecklistBroker` takes that ref under a fourth
   scope, `since-ref`; the other three scopes never read it. Coverage is keyed on the UNIT
   (`<implPath>:<concern>`), never on the author — a file first reviewed in round 1 and touched again in round 3 is
   still covered by the round-1 disposition.

   **Four states SKIP rather than refuse**, and every one is real: a work item with no recorded `startRef` (hydrated
   quest, or an item predating the field), no worktree resolving, or a quest with no pinned `baseRef` leave nothing
   to measure; an EMPTY range PASSES honestly instead — a round that committed nothing has nothing to review, the
   same reading `git commit --allow-empty` gets from 0a.

   It is a gate rather than a prompt line for the reason the post-mortem measured directly: a computed `scope`
   parameter with a named consequence bolted to it was passed correctly 30 times out of 30, while the prose
   instruction to "record dispositions as you go" was ignored 13 times out of 13. A concern that lives only in a
   prompt is skipped. Every disposition clears — `gap` and `recorded` with a real reason count exactly as `reviewed`
   does; this gate refuses ABSENCE, not honesty.

1. Marks the signaled work item terminal (`completedAt`, `actualSignal`) — `complete`, or `failed` on `blocked`.
2. Resolves the linked operation item (the call's `operationItemId`, else the work item's `operations/<id>` ref).
3. `operationStatus: 'done'` (or absent) → marks that operation item `complete`.
4. `operationStatus: 'partial'` → marks it `complete` AND appends a `"pt N: {text}"` continuation item (same role,
   `locked`/`wardMode` preserved) immediately after it — **duplicate-on-partial**. This keeps the strict 1:1
   operation↔work-item invariant and an immutable pt audit trail (instead of reverting a shared item's status). The pt
   chain is the verify fixpoint; for a locked role it is bounded by `slotManagerStatics.<role>.maxAttempts`, and a
   spent chain blocks via `quest-block-on-failure-broker` instead of appending.
5. `operationStatus: 'blocked'` (requires `blockedReason`) → the **environment wall**: a denied command, a missing
   credential, an unreachable service — something no fresh session of the same role could pass. The item is marked
   `complete` and a `pt N` continuation is appended exactly as for `partial`, so a resume re-dispatches this same scope;
   but the work item is marked `failed` carrying `blockedReason` as its `errorMessage` (the execution row renders it),
   and the quest blocks IMMEDIATELY via `quest-block-on-failure-broker`. The pt budget does NOT gate this append — the
   block is itself the bound, and withholding the continuation would leave the operation with no pending item, so a
   resume would silently skip the scope. Spending the budget on successors that provably cannot succeed is exactly what
   this outcome exists to prevent.

Work-item-terminal + operation-complete + the optional pt N land
in ONE `questOperationsUpdateBroker` persist (all-or-nothing on crash). The handler is **idempotent**: a redelivered
signal for an already-terminal work item is a no-op (no second pt N, no second work item) — and because that check
runs before the three gates above, a redelivery never pays their git cost either. Afterwards
`questAdvanceBroker` creates the next work item — except on the two halt routes (`blocked`, spent pt chain), which block
instead of advancing.

`agentOperatingRulesStatics` (Rule 5), embedded in every file-changing worker prompt, is what teaches each role to pick
`blocked` over `partial` when the wall is environmental.

### Failure handling

The orchestrator has THREE failure concepts, and each is owned by exactly one broker: **a ward exit-code red**
(`quest-run-ward-broker.ts`), **a riftcarver exit-code red** (`quest-run-riftcarver-broker.ts`), and an agent's
**`operationStatus: 'blocked'`** environment wall (see "Signal System" step 5). There is no `failed`/`failed-replan`
agent signal for work an agent could have done, and no PathSeeker replan.

Ward routing lives entirely in `quest-run-ward-broker.ts`:

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

Riftcarver routing lives entirely in `quest-run-riftcarver-broker.ts`, and its `outcome` has THREE values rather than
ward's two (`green | repairable | blocked`), because a carve fails in ways that need different answers:

- **carve green** → mark the riftcarver operation item complete, advance → the first `codeweaver` (feature) or the
  `pesteater` (bug-hunt).
- **carve red, `repairable` (`node_modules` / `build`), budget left** → work item `failed` with
  `errorMessage: riftcarver_<step>_failed`, operation `complete`, then a `spiritmender` operation item PLUS a fresh
  `pt N` riftcarver spliced immediately after it — the fresh carve copying the completed item's `flowIds` and
  `packageNames` — and advance. The spiritmender
  runs next, in the quest's own worktree — which exists because the git context was persisted before the mirror and
  the build ran. Its operation text names the failing STEP and the riftcarver result id, so
  `operationPtChainTransformer` gives that attempt its own pt budget instead of one shared with every repair on the
  quest.
- **carve red, `git-state` (`create` / `base_branch`), or a permission-denied error at ANY step, or a spent
  `slotManagerStatics.riftcarver.maxRetries` chain** → `quest-block-on-failure-broker`. A git-state red blocks
  DELIBERATELY rather than repairing: with no worktree there is nothing to dispatch a spiritmender into, and the only
  checkout left is the repo root — the one place no agent may ever be sent. `isPermissionDeniedErrorGuard` is checked
  FIRST and overrides whatever class the step carries, because no fresh session of any role clears an operator's
  filesystem saying no. On these routes the work item's `errorMessage` is git's own text VERBATIM, because nothing
  downstream can act on it and the failed execution row is where the user reads it.

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

- **Siegemaster starts one by hand and owns it for the whole session**, because hands-on walking cannot lean on a
  `webServer` that is torn down when an e2e run ends. Its workers are forbidden to start, restart or stop it, or to
  bounce the server that owns the reset lever: there is exactly one, and a bounce wipes the canvas under whichever
  worker is mid-walk. Teardown is a scoped kill (port + cwd), never a blanket one, and **a server that will not start
  is Siegemaster's first defect, not a wall.**
- **Flowrider and Groundstomper are given no dev server and need none.** Groundstomper's Playwright run brings its own
  up from the project's config (`webServer`) and tears it down with the run, and its tests navigate `baseURL`-relative
  so no URL reaches the test; Flowrider never touches a browser at all. The one thing the values could have bought —
  authoring a `webServer` block into a config that lacks one — is install-time scaffolding rather than a test, shared
  by every flow on the quest, and the sibling groundstomper items work against the same tree. A missing `webServer`
  makes every unit it blocks `unconfirmable` on the Flowrider track, not something any of these sessions writes.

Operational flows run no server.

**Workers are SERIAL for every discipline, not just the ones that share a resource.** Siegemaster's walks obviously
are — browser, `curl`, CLI, queue and sweep alike share one server's state and one reset lever — but the same
one-worker-at-a-time rule binds `codeweaver` and `flowrider`, whose work needs no exclusive resource, because of the
build: `tsc` writes one shared `dist/` per package, so two workers running at once corrupt it and hand each other
phantom failures that eat the rest of the parent's turn. The orchestrator therefore keeps both of the things that are
not parallel-safe — it is the ONLY session on the quest that runs `npm run build`, and it owns the session's only
`git` write. The prompt states the rule in the form agents actually get wrong: **one `Agent` call per assistant
message, never two in one message**, since two calls in one message run concurrently. A plan marking two pieces
independent means safe to order ANY way, not safe to run AT ONCE.

**A round converges by re-reading, not by self-certifying.** A worker builds its piece and reports; the
`reviewer-minion` — a different session — opens the files and renders the verdict. Where the discipline is a hands-on
walk, that is literally a re-walk: when worker N reports a fix, the reviewer confirms it against `git diff` and the
next worker walks the same slice from the reset state, so the session that made the repair is never the one that
grades it. That is why a worker may fix at all.

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
- `workItems` — server-only, managed by the advance / signal-back / ward / riftcarver brokers.
- `wardResults` — server-only, written by `quest-run-ward-broker`.
- `riftcarverResults` — server-only, written by `quest-run-riftcarver-broker`, one entry appended per carve attempt so
  a pt chain leaves its whole history rather than overwriting the attempt that failed.

**Every timestamp a modify-quest payload writes is REPLACED with the server's clock, and the caller's value is
discarded** — `questInputServerTimestampsTransformer`, running before any branch of `questModifyBroker` reads the
input. It covers both sign-off tracks' `at`, `blightLedger[].createdAt`, `questNotes[].at`, and `operationPlans[].at`.
An LLM has no reliable clock: every one of these fields was agent-authored before this existed, and one audited quest
carried 27 sign-offs sharing a single fabricated timestamp that predated the work, alongside a session whose notes
drifted 50 minutes into a future it never reached. It stamps what is INCOMING rather than the merged quest, which is
the whole point — a write that signs one observable leaves the other forty entries reading the moment they were really
made, instead of re-dating the quest on every unrelated call. Prompts tell agents not to send these fields at all; the
transformer is what makes that true whether or not they listen.

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
  `get-next-step` MCP tool and dispatches via Task() sub-agents, or calls the `run-riftcarver` /
  `run-ward` MCP tool for a COMMAND step. Runs under the user's plan.
- **Node mode (the `/queue` page's play button)** — the server's Node dispatch runner
  (`quest-node-dispatch-runner-broker` + `quest-node-dispatch-loop-broker`, bootstrapped by
  `OrchestrationDispatchBootstrapResponder`) calls the same broker in-process and dispatches by
  spawning headless `claude -p` children (one per SpawnInstruction, same `taskPrompt` stub) via
  `agentSpawnUnifiedBroker`, or by running a COMMAND step synchronously in-process. The spawn-batch
  layer pre-stamps each work item `in_progress`
  before spawning and stamps `sessionId` from the child's init line (which activates the
  quest-driven watcher tail for live chat; `agentId` stays unset for top-level sessions).
  Pause is graceful: `isPlaying()` is checked between steps, in-flight children finish.

**Both dispatchers drive both commands, and both wire the output.** The Node loop takes `onWardLine`
and `onRiftcarverLine` as REQUIRED parameters (brokers cannot import `state/`, so the bootstrap
responder supplies the real `orchestrationEventsState` emit and tests inject a stub); the MCP side has
the mirror pair, `QuestRunWardResponder` and `QuestRunRiftcarverResponder`. All four emit sites route
through ONE construction, `commandChatOutputEmitTransformer`, rather than each keeping its own copy of
the event shape — copies are what let a third command role ship with a subtly different `processId`
and render its rows detached from the row they belong to. **The `processId` is the WORK ITEM id**, not
a session id: a command work item has no sessionId to key on, and the execution panel's
`workItemEntries` lookup groups rows by exactly that value, so live streaming needs no web-side change
at all. Dropping any of the four callbacks means minutes of a dead panel with nothing else able to
fill it.

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
| Server `orchestration-start-responder` | HTTP endpoint that the Web UI "Start Quest" button calls; mutates status and redirects to execute view. Does NOT spawn anything, and does NOT build anything — it is pure `quest.json` bookkeeping (startable gate, package graph, relay seed, status flip, queue entry) and touches no git, so the POST answers in milliseconds and the WebSocket-driven panel swap is immediate. The branch, worktree, `node_modules` mirror and preflight build are the `riftcarver` item it seeds at the head of the ledger. |

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

**`agentPromptGetBroker` stamps a third field, `workItem.startRef`** — the quest worktree's HEAD
sha, read with `gitHeadShaAdapter` off the checkout `questCwdResolveBroker` resolves. Written the
FIRST time an item is served its prompt and NEVER moved: it is the base
`quest-handle-signal-back-responder`'s review-coverage gate measures `<startRef>..HEAD` from, and a
re-served prompt (an orphan-recovery resume, a redelivered fetch) reads a HEAD that already contains
this item's own commits — so re-stamping would shrink the reviewed range towards empty and pass a
round nobody reviewed. Guarded twice: a pre-check that skips the git spawn on every fetch after the
first, and a re-check inside `questOperationsUpdateBroker`'s per-quest lock for two fetches racing.
No worktree, or an unreadable HEAD, records nothing — and the gate SKIPS an item with no `startRef`
rather than refusing it.

| Agent (parent-summoned minion) | Summoned By | Model | Purpose |
|--------------------------------|-------------|-------|---------|
| chaoswhisperer-gap-minion | ChaosWhisperer (inside `/dumpster-create`) | sonnet | Validate spec completeness before approval. The one minion with NO discipline — it runs in the spec phase, before any operation item exists, and `agentPromptGetBroker` REFUSES it a `discipline` because its template has no placeholder for one |
| planner-minion | any of the five orchestrator roles, ONCE per round | opus | Loads the project standards itself, reads the real code, and cuts the round into PIECES ordered by `dependsOn`. Persists the plan to `quest.planningNotes.operationPlans[]` and returns 3-5 lines — never the plan body, which the parent reads back with `get-quest-planning-notes`. The ONLY minion permitted to spawn a sub-agent, and only for a bounded SPIKE of a genuinely net-new pattern; a spike is KEPT on disk and named in the owning piece's `notes` |
| worker-minion | any of the five orchestrator roles, ONE AT A TIME per plan piece | sonnet | Executes exactly ONE piece: red-first, inside its own `files`, following the piece's `mirror`. A LEAF — no `Agent`, no `git`, no `npm run build`, no whole-repo ward. Its only output channel is its distilled return block |
| reviewer-minion | any of the five orchestrator roles, ONCE per round | opus | **The only session on the round that verifies anything.** Reads the plan back, OPENS EVERY FILE the round produced (never the summary alone), fixes what it can red-first, writes the discipline's sign-offs or dispositions BATCHED, and returns the structured block the parent routes on. Also takes the five standards concerns over `get-blight-checklist({ scope: 'working-tree' })`. A LEAF |

**The same three names serve all five disciplines** — `implementation`, `bug-repro`, `below-browser`, `browser-e2e`
and `manual-qa` — because what varies with the role is the SUBJECT MATTER (in the discipline pack) and what varies
with the phase is the METHOD (in the minion template). Each generic minion fetches with
`{ agent, questId, discipline }` and **NO `workItemId`**; the discipline is REQUIRED and the fetch is refused without
it, since a minion holding the literal token `$DISCIPLINE` has no method, no evidence bar, and no prohibition on
`signal-back`.

The relay roles that DO own a work item (`codeweaver`, `flowrider`, `groundstomper`, `siegemaster`, `pesteater`,
`spiritmender`, `warpgate`) fetch their prompt the same way, calling
`get-agent-prompt({agent, questId, workItemId})` — see "Agent Roles". `agentPromptGetBroker` THROWS on a role name that
arrives without a `workItemId`, and on a role name that arrives WITH a `discipline`, so the split is enforced from both
ends: a role cannot fetch as if it were a minion, cannot ask for a sibling discipline's instructions, and a minion that
passed a workItemId would be held by `subagentStopNeedsBlockGuard` until it signalled on its parent's item. The broker
refuses that last case BY NAME rather than letting it fall through to the work-item branch, which would report the
missing discipline as the fault and send the minion to add the one argument that is not its mistake.

`roleNames` and `minionNames` are DISJOINT, and with generic minions that is now structural rather than a naming
convention: a `planner-minion` has no discipline of its OWN until a role hands it one, so there is no operation item
it could ever be dispatched against. Adding one of them to `roleNames` would widen `agentRoleContract` with a role no
operation item can hold.

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
