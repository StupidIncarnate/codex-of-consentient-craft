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

### Which directory those files are in

**The session's cwd, and only the cwd, decides which `~/.claude/projects/<encoded-cwd>/` directory a
transcript is written to.** A sub-agent is not a session: it gets no session id and no directory of
its own, it inherits its parent's cwd, and a sub-agent spawned by a sub-agent lands flat in the same
`subagents/` folder rather than inside its parent. A project-local `.claude/` directory has no part
in it.

So **a carved quest's transcripts are split across TWO directories** — the intake conversation under
the repo root's encoding, every role dispatched after the carve under the worktree's. A cwd is a
property of the SESSION, not of the quest, and anything resolving one directory per quest reads only
one of the two groups.

This is undocumented harness behaviour that can change in any release. `README.md` in this package
states each finding against the Claude Code version it was measured on, and carries the recipe for
re-measuring after an upgrade.

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

- `packages/web/src/flows/quest-chat/chat-streaming-subagent-grouping.e2e.ts` — streaming path via fake
  Claude CLI stdout, walked in a real browser.
- `packages/web/src/flows/session-view/chat-replay-subagent-grouping.e2e.ts` — file-replay path via
  pre-seeded JSONL on disk. Its own header names the one difference from its streaming sibling: the
  SOURCE of the correlation. Both e2e specs carry a `PARITY` comment pointing at each other so the two
  chain-header assertions cannot drift apart unnoticed.
- `chat-history-replay-broker.test.ts` (this package) — unit-level coverage of all three reverse-map
  population paths under its `describe('two-pass sub-agent correlation', ...)` block, including the
  prompt-text pairing (pass-1b) for an in-flight Task with no completion `tool_result`.

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
still backs the interactive chat callers (ChaosWhisperer / BugHunt) of
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
at `created` / `explore_flows` / `review_flows` has an intake work item (chaoswhisperer
or bughunt) carrying the chat session's id, and its tail runs — which is what
streams an intake conversation into the browser chat panel while the user is still having it
in their terminal. Narrowing the pre-filter to `approved`/`in_progress`
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
4. Do NOT add parsing on the server or the web.

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

## Callouts

- **Agent prompts are served dynamically via the `get-agent-prompt` MCP tool.** Source of truth is in
  `packages/orchestrator/src/statics/`, and the shape of that source is the design: **every prompt is ONE FILE, and its
  name says whose it is.** There is no shared template and no per-role pack.

  The served roster is `agentPromptClassificationStatics.promptNames` filtered to the names
  `agentNameToPromptTransformer`'s `AGENT_PROMPTS` table actually carries — `promptNames` also keeps three retired
  role names (`codeweaver`, `flowrider`, `siegemaster`) so a quest that ran under one still loads, but each of those
  throws `Unknown agent prompt name` if dispatched today; the transformer's own test names them
  `UNSERVED_PROMPT_NAMES` and asserts the throw. `siegemaster-verifier` and `siegemaster-stress` are not retired
  names on this list at all — they were removed from it outright when the siege walkers replaced them (see
  "Siegemaster: the inverse step graph" below).

  | Name | Kind | File | Model |
  |---|---|---|---|
  | `chaoswhisperer-gap-minion` | minion | `chaoswhisperer-gap-minion/` | sonnet |
  | `codeweaver-planner` | step | `codeweaver-planner/` | opus |
  | `codeweaver-worker` | step | `codeweaver-worker/` | opus |
  | `codeweaver-reviewer` | step | `codeweaver-reviewer/` | sonnet |
  | `flowrider-planner` | step | `flowrider-planner/` | opus |
  | `flowrider-worker` | step | `flowrider-worker/` | opus |
  | `flowrider-reviewer` | step | `flowrider-reviewer/` | sonnet |
  | `siege-planner` | step | `siege-planner/` | opus |
  | `siege-happy-walker` | step | `siege-happy-walker/` | sonnet |
  | `siege-adversarial-walker` | step | `siege-adversarial-walker/` | sonnet |
  | `siege-happy-fixer` | step | `siege-happy-fixer/` | sonnet |
  | `siege-adversarial-fixer` | step | `siege-adversarial-fixer/` | sonnet |
  | `siegemaster-reader` | step | `siegemaster-reader/` | sonnet |
  | `recipe-maker` | step | `recipe-maker/` | opus |
  | `spiritmender` | role | `spiritmender-prompt/` | sonnet |
  | `warpgate` | role | `warpgate-prompt/` | opus |

  "Step" is this roster's own vocabulary (`agent-prompt-classification-statics.test.ts`'s own describe block:
  "step prompts are in promptNames but neither role nor minion") — each is one step a family's own step graph
  dispatches as its own session, not a sub-agent a role briefs. `roleNames` (`codeweaver`, `flowrider`, `siegemaster`,
  `spiritmender`, `warpgate`) and `minionNames` (`chaoswhisperer-gap-minion` alone) are the two OTHER lists
  `agentPromptClassificationStatics` carries; `codeweaver`/`flowrider`/`siegemaster` sit in `roleNames` for
  classification purposes (a work item's scope reads its OWNING family's role) even though none of the three has a
  prompt of its own any more — dispatch always reaches one of that family's named steps instead.

  Two shared blocks are interpolated into those prompts rather than repeated:
  `standardsReviewConcernsStatics.markdown` — the five standing quality concerns, in all three reviewers — and
  `flowEvidenceContractStatics`, whose judging half (`judgingMarkdown`) goes into `flowrider-reviewer`. Its authoring
  half (`authoringMarkdown`) reaches no served prompt today — `flowrider-planner-statics.ts` names exactly the two
  shared blocks it interpolates (`spilledToolResultStatics`, `sadPathRoutingStatics`) and `authoringMarkdown` is not
  one of them.

  The valid names are `agentPromptClassificationStatics.promptNames` — `agentPromptNameContract` brands an OPEN
  string rather than a closed enum, so a quest that ran under a renamed prompt name still loads.
  `agentPromptClassificationStatics` also classifies which names are parent-summoned minions vs
  orchestrator-dispatched relay roles, and carries `operatorRoleNames` — the three roles that own an operation item
  and run its `plan → work → review` steps, each dispatched as its own session with no session briefing another —
  `operatorRoleNames`'s own file comment calls this "briefing sub-agents", but nothing in that path briefs one —
  read by the prompt renderer and the signal-back gate rather than listed at each call site.
  `agentNameToPromptTransformer` is a TABLE mapping each name to its statics + model, with no `satisfies`
  clause left to check it — a branded, non-literal string gives TypeScript no finite key set to check an object
  literal's keys against; **nothing is interpolated there**, because each prompt holds its own text, and a name
  added without a prompt behind it is caught at DISPATCH instead, by a runtime
  `if (!(agent in AGENT_PROMPTS))` throw naming it.
  `tavernkeeper-prompt-statics.ts` is deliberately absent from all three lists: the follow-up chat is served by the chat
  prompt path (`chatPromptBuildTransformer`), not by `get-agent-prompt`. There are no `.claude/agents/*.md` files for
  these agents.

  A relay work-item role calls `get-agent-prompt({agent, questId, workItemId})` — the responder resolves the work item's
  linked operation item (its `operations/<id>` ref) and substitutes FOUR IDS into the prompt: the quest, the work item,
  the operation item, and that operation item's TEXT. **No quest CONTENT is served with them.** The flow and the
  contracts are a `get-quest` call and the in-scope units are a `get-quest-work({ questId, workItemId })` call, each
  spelled out in the role's own prompt, and the flow id and package name `get-quest` takes are inside the operation
  item's text (`… — package: <name> · flow: <id>`).
  Two role-specific extras ride along, and each is a value no tool call returns: `Base branch` for warpgate, and
  `Failed ward result` / `Ward detail blob` for spiritmender.

  A parent-summoned minion calls `get-agent-prompt({agent, questId})` (no workItemId — it has no work item) and gets
  back its prompt plus the Quest ID and nothing else; everything narrower reaches it through its parent's brief.

  **`agentPromptGetBroker` throws twice**: on a ROLE that omits its `workItemId`, and on a MINION that supplies one —
  not even its parent's. It refuses that second case **BY NAME**, so the message names the `workItemId` as the mistake
  rather than falling through to the work-item branch and reporting some other fault. `chaoswhisperer-gap-minion` is
  the one exemption: it runs in the SPEC phase where there is no operation item and no relay to advance, so a caller
  that supplies a workItemId is served the work-item context block rather than refused.

  **A minion must NEVER pass a workItemId, not even its parent's.** `subagentStopNeedsBlockGuard` treats a
  `get-agent-prompt` call carrying a workItemId as proof the caller is a work-item agent and blocks it from ending its
  turn until it calls `signal-back`. A minion held to that rule could only escape by signalling on its PARENT's
  operation item — completing the parent's scope and advancing the relay while the parent is still working. The
  no-workItemId fetch is what keeps minions outside that guard.

## Editing or Creating a Prompt in `statics/`

Every statics file in this package holding agent-facing markdown — each family's `<role>-planner-statics` /
`<role>-worker-statics` pair, the three `<role>-reviewer-statics`, siegemaster's named walk/fix/read steps
(`siege-planner`, `siege-happy-walker`, `siege-adversarial-walker`, `siege-happy-fixer`, `siege-adversarial-fixer`,
`siegemaster-reader`, `recipe-maker`), `chaoswhisperer-gap-minion-statics`, `standards-review-concerns-statics`,
`flow-evidence-contract-statics`, and the bespoke `spiritmender` / `warpgate` / `tavernkeeper` / `dumpster-*`
prompts — is **TEXT INJECTED INTO A MODEL'S CONTEXT WINDOW.** It is not documentation, not a README, and
not a page anyone opens. Five rules follow from that. Each one cost a real defect.

### 1. No reader-interface verbs

The whole prompt arrives as one blob of text. **Nothing scrolls, nothing is clicked, no tab is
opened, and nobody skims.** Write "the section under `## What you never do` further down this page",
never "scroll to it". `below`, `above` and `further down` are fine — they describe position in the
text, which is real. The one legitimate `click` in this tree belongs to a session that genuinely is
driving a browser.

### 2. A section does ONE job, and its heading names that job

A heading is a claim about everything beneath it, and a session reads it that way. One measured
instance: a heading reading "Your denominator is the `## Context` section" had both the
acceptance-target list AND the seam markers under it — repair authority and scope routing, which are
not a denominator and cannot be graded against. Welded together, the seam observables read as part of
the measured set. Two headings fixed it. **When a section grows a second job, split the heading, do
not widen its wording.**

### 3. A shared block is a contract on every prompt that interpolates it

`standardsReviewConcernsStatics` lands in all three reviewer prompts and `flowEvidenceContractStatics`'s judging
half lands in `flowrider-reviewer` alone — its authoring half reaches no served prompt today. An edit to either
is unfinished until every prompt that reads it still agrees with it. A question only ONE kind of
reviewer asks belongs in that reviewer's own prompt, never in the shared block — a block that hedges
across three readers serves each of them answers it cannot use.

### 4. Check the RENDERER before promising a session what it will be handed

A prompt that enumerates what a session receives is a claim about a transformer. **`workItemToPromptTransformer`
serves FOUR IDS and two conditional extras — nothing else** — so a prompt sentence pointing at anything wider than
that names a block no session will find. What a role fetches for itself is `get-quest` / `get-quest-work`, and each of
those gates blocks on non-emptiness too. **Trace the render for the DEGENERATE case** — no flow, no package, no
contract, an empty diff — never the happy one. Both extras are conditional: warpgate gets no `Base branch` line where
`quest.baseBranch` is unset, and spiritmender gets no ward lines where no `wardResult` has a non-zero `exitCode`.

### 5. Validate by DRY-RUNNING the prompt against a real quest

**Reading a prompt tells you whether it is coherent. Only a dry run tells you whether it works.**
Pick a live quest, take a real `workItemId` off its ledger, and walk the prompt as that step
against what the tools actually return: `get-quest`, `get-quest-work({ questId, workItemId })`, and the four ids
the transformer substitutes. Do it for EVERY STEP the change touches — the
prompt families diverge exactly where it matters, and a fix that reads well on one is often wrong on
the next.

That pass finds what a read cannot. It has surfaced a session told to chunk 101 units when 26 were
outstanding, off-map probe families rendered as already settled on a track whose `unitKinds` cannot
sign them, and a prompt demanding a reset lever for `process.uptime()`, which nothing but a server
restart rewinds.

**Length budgets are load-bearing.** `mcpToolResultStatics.maxVerbatimChars` (50,000) is a ceiling
each served text has to clear ON ITS OWN, and each prompt's colocated test measures it. Over the
ceiling the MCP layer spills that result to a FILE and hands the agent an error stub — the session
then holds a path instead of its instructions, and nothing reports a failure. The shared blocks are
where an edit costs the most: a character in `standardsReviewConcernsStatics` is three characters
served. `flowrider-reviewer` is the largest of the three reviewer prompts, so measure that one first
after any edit to either shared block.

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
  │     │  `explore_flows` and `review_flows` both carry `flowsRule: 'full'`, so an observable the
  │     │  USER names while reading the flow draft lands on its node here rather than waiting for
  │     │  Phase 4. Nothing in a payload separates a user-named observable from an agent-invented
  │     │  one, so the phase is held by `dumpsterCreatePromptStatics` (which authors none of its own
  │     │  before Gate #1), never by the allowlist.
  ├─ Phase 4: Observables ─────── embedded in flow nodes → status: explore_observables → review_observables
  │     │  ChaosWhisperer authors NO ledger at all — `operations` is off the modify-quest allowlist
  │     │  entirely, for every role at every status. The codeweaver ledger is DERIVED at Start Quest
  │     │  from the flow nodes' `packages` tags and the contracts' `source` paths instead — see
  │     │  "Operations Ledger & Work Items" below.
  ├─ Phase 5: Gate #2 ─────────── user approves observables + packagesAffected[] → status: approved
  │
  ▼
Web UI "Start Quest" button ──► server orchestration-start-responder
  │   approved → in_progress. Seeds the relay (questBuildRelayGraphBroker): mints the ENTRY family's
  │   scopes and NOTHING ELSE — one riftcarver scope — and creates its FIRST work item at that
  │   family's entry step (carve), spawnerType: 'command'. Every later family's scopes are minted
  │   when the family graph routes to it.
  │   PURE quest.json bookkeeping: no spawn, no git, no build, so the POST answers in milliseconds.
  │   Redirects to execute view; banner: "Run /dumpster-launch in your Claude session."
  │
  ▼
User runs /dumpster-launch (long-lived dispatch loop in their session)
  │   Loop: get-next-step() → Task() / run-step() → await → repeat. `run-step` covers every
  │   deterministic step of a normal quest, including the carve and the wardFull gate; the legacy
  │   run-riftcarver() / run-ward() MCP tools answer only a work item with no step node (a hydrated
  │   or legacy-blueprint quest).
  │   Each response dispatches ONE work item (= one agent session, or one command run) for the
  │   operation item the relay marked in_progress; on signal-back / command exit the relay advances
  │   to the next pending item.
  │
  │   The FAMILY GRAPH drives the order, and both quest types run the same one. Each family's scopes
  │   are minted the moment the relay routes to it:
  ├─ riftcarver ──── run-step (carve); spawnerType: 'command'. Carves the branch + worktree, pins
  │                   baseRef from the new tree's HEAD, mirrors node_modules, runs the preflight
  │                   typecheck. Streams live; log persisted to riftcarver-results/<id>.log. Nothing
  │                   else can run until it goes green.
  ├─ codeweaver ──── ONE SCOPE PER (PACKAGE, FLOW) CELL — one package's half of one flow;
  │                   product code plus the unit tests that prove it
  ├─ ward (committed) run-step (ward), args: ['--committed', '--uncommitted']; spawnerType: 'command'
  ├─ flowrider ───── ONE SCOPE PER FLOW; the test suites that prove that flow, in the browser and
  │                   below it
  ├─ siegemaster ── ONE SCOPE PER FLOW; hand-driven QA of that flow against a running system
  ├─ ward (full) ─── run-step (gate), args: []; spawnerType: 'command'
  │
  │   Each of those three families runs its OWN STEP GRAPH inside its scope — `codeweaver` and
  │   `flowrider` run `plan → work → review → commit → ward`; `siegemaster` runs the inverse
  │   shape. See "Agent Flow: the step graph inside a family" and "Siegemaster: the inverse step
  │   graph" below. Every step is its own dispatched session; none of them briefs a sub-agent to
  │   do its work. There is no standards-review role on the ledger: the five standing concerns are
  │   taken by each family's own `review` step, before the family's `commit` step runs.
  │
  │   (a red ward routes `unmet` to its family's own `repair` step, which returns to that ward and
  │    re-runs it; a repairable carve red does the same inside the riftcarver family. A spent
  │    `maxVisits` on either blocks the quest, as does any `wall` — see "Failure handling".)
  ▼
Complete ──► /dumpster-launch's next get-next-step() picks up the next FIFO quest in the queue
```

## Operations Ledger & Work Items

Execution runs on **TWO GRAPHS**. The **family graph** (`questFlowStatics`, in `@dungeonmaster/shared`)
says which family runs after which — `riftcarver → codeweaver → flowrider → siegemaster → wardFull →
@complete`, with `warpgate` appended at merge rather than routed to. The **step graph**
(`agentFlowStatics`, this package's own statics) says what happens INSIDE one family: `plan → work →
review → commit → ward`, with `unmet` marks looping back to the step that can settle them. Every step
declares a `role` (`planner`/`worker`/`reviewer`), a `kind` (`prompt`/`deterministic`), a `maxVisits`
ceiling and a route per outcome word.

`quest.operations` is one **SCOPE** per entry — a family's slice of the quest, `{ id, role, text, status,
locked, flowIds, packageNames }` (`operationItemContract`).

**The ledger has exactly ONE writer: the orchestrator**, and it is minted **LAZILY**. `operations` is off
the modify-quest allowlist entirely — ChaosWhisperer never authors it and no execution agent ever writes
it. Its content comes from three orchestrator-owned mechanisms:

- **Start seeds the ENTRY family and nothing else** (`questBuildRelayGraphBroker` →
  `familyScopesMintTransformer({ quest, family: questFlowStatics[questType].entry })`) — one
  `riftcarver` scope, plus the intake items force-completed.
- **A family route mints the next family's scopes** (`questRouteScopeBroker` →
  `mintNextFamilyLayerBroker`), the moment every scope of the current family is complete. A family that
  fans out to ZERO scopes is routed PAST rather than stalled, by walking its `empty` edge.
- **Runtime mutation** (`questOperationsUpdateBroker`, the ONLY runtime ledger writer): status
  transitions, and the work items the router mints.

**Lazy is the point.** A fan-out reads the flows AS THEY STAND when its family is routed to, which is
what gives an observable an operator adds mid-quest a flowrider session at all — a scope cut at approval
could never have covered it.

### The three brokers that move a quest

| Broker | Job |
|---|---|
| `questAdvanceBroker` | **ENTERS** a scope: the first `pending` operation item gets ONE work item, at its family's `entry` step, and the item flips `in_progress`. Its resume guard skips a `pending` item that already has a linked work item — still correct under many-work-items-per-scope, because the router only mints inside an item that is already `in_progress`. |
| `questRouteScopeBroker` | **MOVES** a scope: the first `in_progress` one whose work items have ALL gone terminal. Reads the plan file ABOVE the lock, calls the pure `nextActionTransformer` inside `questOperationsUpdateBroker`'s callback, and persists the answer — the next step's batch, the scope completing (and the next family's scopes minted), or a HALT performed AFTER the persist returns. |
| `questRunStepBroker` | **RUNS** a deterministic step through `stepHandlerRunBroker` and records the classified word on the work item as `declaredWord`. It routes nothing; the router reads that word on the next scan. |

### The router — `nextActionTransformer`

Pure, synchronous, takes no lock, performs nothing. Four questions in ONE order, and the order IS the
engine: **a request beats an `unmet`; an `unmet` beats an unstarted batch; an unstarted batch beats
`routes.done`.** Get it wrong and the symptoms are subtle — work that should have been re-cut is skipped,
or a phase advances with pieces still unstarted.

1. **Did this step REQUEST another step?** `quest-work`'s `request` payload names a `mintableOnRequest`
   step; the mint returns to the asker.
2. **Does this step have `unmet` units?** Grouped by the ORIGINATING PIECE, never the mark set, and
   minted against `routes.unmet`. `contextUnitIds` are context, never claims.
3. **Are there unstarted plan batches AT THE CURRENT STEP?** A step nothing has entered has no outcome
   to fold — it has to RUN before question 4 can ask anything of it.
4. **Otherwise, follow the step's own route for the outcome it folded to.**

**THE CURRENT STEP IS THE STEP OF THE LAST WORK ITEM ON THIS SCOPE, by ARRAY order** — never
`createdAt`, since a parallel batch is minted inside one persist and shares a timestamp.

**THE PHASE RULE IS QUESTION 3 DOING ITS JOB.** A step's `done` fires only once every piece at that step
has DRAINED, so a `pending` or `in_progress` item at the current step holds question 4 back and the
answer is `cause: 'capped'` — neither done nor blocked, come back. For siege that is what makes
`happyWalk → adversarial` mean something.

**`routes.done` IS THE FORWARD EDGE ONLY; THE RETURN EDGE IS AUTOMATIC.** A step that is only ever
mark-minted declares no `done` route at all, and an undeclared outcome returns to the work item
`mintedBy` names — as a FRESH work item at that minter's step, never a resume of the minter's own.

### The four outcome words and the three marks

`wall` > `unmet` > `done` > `empty`, worst first, which is how a parallel batch folds to one outcome per
step. A session writes `met` / `cant-meet` / `unmet` on each assigned unit through `quest-work`; `met`
and `cant-meet` are settled, `unmet` is what mints a successor. `empty` means nothing was in scope to act
on, never "there was work and I chose to cut none".

### Work item = one dispatched session

`quest.workItems[]` are generic session containers (`role`, `status`, `step`, `dependsOn`,
`relatedDataItems`, `assignedUnitIds`, `observations`, `pieceId`, `payload`, `mintedBy`, `sessionId`,
`agentId`). **Every work item carries exactly ONE `operations/<id>` ref, and ONE operation item carries
MANY work items** — one per step the router mints on that scope, one per piece inside a parallel step.
`step` is what separates them.

### Dispatch — the STEP decides before the ROLE

`compute-next-step-from-quest-layer-broker` resolves the head ready item's step node first
(`workItemStepNodeTransformer`):

- a `kind: 'deterministic'` step returns `{ type: 'run-step', handler, args }` **alone** — it runs a
  handler, never a session, and it owns the whole tree for the length of its run. Its work item carries
  the ROLE of its SCOPE (a `commit` step inside a codeweaver scope reads `role: 'codeweaver'`), so keying
  on the role alone would spawn a Claude session for it;
- a work item running NO step graph falls through to the role-keyed command split — `run-riftcarver` for
  a carve, `run-ward` for a gate — which is what keeps a riftcarver item out of
  `buildSpawnInstructionLayerBroker`, whose `agentRoleContract` parse throws for any role Claude cannot
  be dispatched as;
- otherwise the batch is every ready item sharing the head's ROLE **and** its STEP, which is a router
  mint read back off the ledger. Several sessions of ONE step run in parallel by design; two different
  steps never do.

`args` ride the STEP: a family's own `ward` declares `['--committed', '--uncommitted']` and `wardFull`'s
`gate` declares `[]`, passed verbatim, which is what keeps a ward-mode ternary out of every call site.

### Agent Flow: the step graph inside a family

Codeweaver and flowrider each run the SAME step graph inside their own scope — `agentFlowStatics.codeweaver` /
`.flowrider` (this package's own statics, distinct from the family graph `questFlowStatics` in
`@dungeonmaster/shared`, which says which FAMILY runs after which): `plan → work → review → commit → ward`.
**Every step is its own dispatched session** (or, for `commit` and `ward`, a deterministic handler) — no session
briefs another, and no step dispatches a sub-agent to do its work.

- **`plan`** (`codeweaver-planner` / `flowrider-planner`, role `planner`, opus) reads the scope's flow off `get-quest`
  and its in-scope units off `get-quest-work({ questId, workItemId })`, then cuts the work into PIECES — one per file
  group (codeweaver) or spec file (flowrider), each carrying `facts`/`fences`/`traps`/`doNotTouch` and the units it
  assigns. **It writes no file, runs no git and no ward** — its whole output is ONE `quest-work` plan call, batched so
  a later batch can depend on an earlier one landing. Its only mark authority is `plannerMarks`, for a unit no piece
  claims. Where a change needs behaviour from a sibling package, it moves that code into a package both can call
  rather than copying it or importing across — found by KIND through `get-project-map` (`library`), never by name.
- **`work`** (`codeweaver-worker` / `flowrider-worker`, role `worker`) fetches its own piece with
  `get-quest-work({ questId, workItemId })` and writes the implementation (or spec) **and** the tests that prove it,
  itself: "there is no operator above you deciding what to brief and no sub-agent below you doing the typing — the
  two are the same session now" (`codeweaver-worker-statics.ts`'s own words). It marks each assigned unit `met` /
  `cant-meet` through `quest-work`, wards only its own piece's paths (`npm run ward -- -- <its own paths>` — never
  `--uncommitted`, never bare, never the `run-ward` MCP tool), and **never commits**.
- **`review`** (`codeweaver-reviewer` / `flowrider-reviewer`) reads the quest and the flow, finds what the pass
  produced via `git status` + `git diff HEAD`, opens every changed file IN FULL — not the diff, which is what finds
  the false green a diff hides — judges it against the flow and **the five standing concerns** (`craft`, `perf`,
  `dedup`, `integrity`, `test-cases` — `standardsReviewConcernsStatics`, interpolated into both reviewer prompts and
  taken in the SAME reading pass as everything else; they are GUIDANCE, not a ledger, and dead code is deliberately
  absent from the five, since whether an export still has a consumer is a property of the whole import graph after
  later work lands). It fixes what is small directly and marks the units it settles. **A red is diagnosed before it
  is fixed:** it re-runs a failing file ALONE with the tree unchanged; passing there means that file is not the
  broken one, and the cause belongs to a later pass rather than a repair attempted here.
- **`commit`** — `kind: 'deterministic'`, handler `commit` (`stepHandlerCommitBroker`). Runs after `review`'s `done`:
  `git add -A`, `git commit --allow-empty` with a message the HANDLER derives from the work items covered since this
  scope's last commit at this step (never prose a session wrote), then a bare `git push`. **No session decides
  whether or how to commit** — the pass reaches this step uncommitted, and the handler's own per-quest lock
  (`questWithModifyLockBroker`) serializes two scopes landing on the same worktree at once. A clean tree classifies
  `empty`; either way the route is `ward`.
- **`ward`** — `kind: 'deterministic'`, handler `ward`, args `['--committed', '--uncommitted']`. `unmet` routes to
  that family's own `repair` step, a `spiritmender` worker, which returns to `ward` once it settles. Spiritmender is
  never dispatched as a sub-agent — `agentPromptGetBroker` refuses a minion fetch on the name, because as a sub-agent
  it would signal on its parent's operation item and complete that scope mid-pass — it is always minted directly by
  the router on a ward or riftcarver red.

Every step's work item carries its SCOPE's role (`workItem.role`, e.g. `codeweaver` for every step inside a
codeweaver scope — see "Dispatch — the STEP decides before the ROLE" above), but the CLI `--model` flag comes off
the STEP, not the role. Every `kind: 'prompt'` step in `agentFlowStatics` declares its own `model` — `codeweaver.plan`
is `opus`, `codeweaver.work` is `sonnet`, both inside the same `codeweaver` scope — and `buildSpawnInstructionLayerBroker`
reads that declared value (via `stepDispatchRoleTransformer`, the same helper it already uses for the step's prompt
name) onto the `SpawnInstruction` it builds. A work item running NO step graph — a role-keyed spiritmender or
warpgate dispatch, or a hydrated/legacy quest with no step recorded — has no node to read, and falls back to
`roleToModelTransformer({ role })` off `roleToModelStatics`, keyed on the resolved AgentRole.

**Both dispatchers read this ONE `SpawnInstruction.model` field, and neither computes its own.** Node dispatch
(`spawnOneAgentLayerBroker`) passes `instruction.model ?? roleToModelTransformer({ role: instruction.role })`
straight to the CLI `--model` flag — the transformer fallback there is now defensive rather than the everyday path,
since `buildSpawnInstructionLayerBroker` already resolved it. The MCP/Task dispatcher (`/dumpster-launch`) reads the
identical `NextStep` payload `get-next-step()` returns and is instructed to pass `model: agent.model` to each Task()
call, so a headless Node child and a Task-dispatched sub-agent run the SAME step on the SAME model.

**`get-agent-prompt`'s REPORTED model agrees with the spawned one, because both read the same step node.**
`workItemToPromptTransformer` resolves the model it reports the SAME way `buildSpawnInstructionLayerBroker` resolves
the one it spawns on — the work item's own step node, with the identical scope-role fallback for a stepless item —
never off `agentNameToPromptTransformer`'s per-PROMPT-NAME table. That table's `model` field is read only when
SERVING A PARENT-SUMMONED MINION (which has no work item and no step to read); reporting it for a role or step
prompt instead is exactly how `codeweaver-worker` used to be reported as `opus` (`roleToModelStatics.codeweaver`)
while its step declares `sonnet` and the session was dispatched on `sonnet` all along.

### Siegemaster: the inverse step graph

Siegemaster runs `sweepIn → plan → happyWalk ⇄ fixHappy → adversarial ⇄ fixAdversarial → commit → ward → sweepOut` —
its reviewers run FIRST and find the work; its workers repair what they found.

- **`sweepIn` / `sweepOut`** — `kind: 'deterministic'`, handler `cleanup` (`dungeonmaster siegelense cleanup`),
  bracketing the pass. Router-owned, not a session's judgment: the first makes the pass's own capacity reading
  honest, the last catches whatever this pass leaked.
- **`plan`** (`siege-planner`) cuts the scope into pieces — one per path to walk, one per off-map probe family to
  attack — as a single `quest-work` plan call. It fetches no scope docs and drives nothing itself.
- **`happyWalk`** (`siege-happy-walker`, role `reviewer`, `needsLane: true`) drives ONE whole path start to end
  against a lane the ROUTER already started for it. **It opens no source file, for any reason** — a value only
  source holds is requested from `siegemaster-reader` (a `mintableOnRequest` step) rather than read directly, since
  reading the file first means the walk already knows its answer before it drives anything. It marks what it
  measures and dispatches nothing; `done`/`empty` route to `adversarial`, `unmet` mints a `fixHappy`.
- **`fixHappy`** (`siege-happy-fixer`, role `worker`) fixes the CAUSE of what one happy-walk piece measured, seeding
  its regression test from the same named recipe the walk used. It declares no `done` route — settling its units
  returns to the walker that minted it, which re-walks the same path fresh to prove the fix, rather than this
  session opening a lane of its own to check its own work.
- **`adversarial`** / **`fixAdversarial`** repeat that shape against the round's allocated off-map family, in the
  SAME lane, and only start once every `happyWalk` piece has drained — a step's `done` fires once every piece at
  that step has drained, which is what gives an antagonist's baseline (the happy run it is attacking) time to exist.
- **`commit`** and **`ward`** are the same deterministic handlers as the other families, but siege OVERRIDES
  `ward`'s own routes to send `done`/`empty` to `sweepOut` rather than `@done` — the pass is not over until the lane
  is swept.
- **`recipe`** (`recipe-maker`, shared with flowrider's own `recipe` step — a recipe is flow-scoped, not
  family-scoped) and **`read`** (`siegemaster-reader`) are both `mintableOnRequest`: a planner or a walker requests
  one mid-pass, and it returns to whoever asked rather than routing anywhere of its own.

Reopening a unit an earlier siegemaster pass already marked is a `quest-work` `invalidation` payload — a `flowId`
and a reason, refused to any work item but a siegemaster one.

**Work item = one dispatched session.** `quest.workItems[]` are generic session containers (`role`,
`status`, `step`, `dependsOn`, `relatedDataItems`, `assignedUnitIds`, `observations`, `pieceId`,
`payload`, `mintedBy`, `sessionId`, `agentId`). Every work item links to exactly ONE operation item via
`relatedDataItems: ['operations/<id>']`, and **ONE operation item carries MANY work items** — one per
step the router mints on that scope, one per piece inside a parallel step. `step` is what separates them.

- **Enter a scope** (`questAdvanceBroker`): the FIRST `pending` operation item gets ONE work item, at its
  family's `entry` step, and the item flips `in_progress` — in the same atomic persist. `spawnerType` is
  `command` when `isCommandWorkItemRoleGuard` matches, else `agent`; that guard, backed by
  `workItemRoleStatics.command` (`['ward', 'riftcarver']`), is data rather than a `role === 'ward'`
  ternary, because a ternary has to be found and edited at every dispatch site and a missed site hands
  the role to `agentRoleContract`, which throws on a name it does not enumerate. The family is resolved
  through `questFlowStatics`, and `wardFull` is the only family whose role is `ward`, so a ward scope
  needs nothing to disambiguate it. A role no family carries (`spiritmender`, a chat role) is stamped
  with NO step. Advance is called from BOTH the signal-back handler AND the dispatch scan's self-heal,
  and its **resume guard** makes it act only on a `pending` item with NO linked work item.
- **Move a scope** (`questRouteScopeBroker`): the first `in_progress` scope whose work items have ALL
  gone terminal. It reads that scope's plan file ABOVE the lock, calls the pure `nextActionTransformer`
  inside `questOperationsUpdateBroker`'s synchronous callback, and persists the answer — the next step's
  batch, the scope completing (and, on the family's last scope, the next family's scopes minted), or a
  HALT performed AFTER the persist returns, because `questBlockOnFailureBroker` takes the same lock.
- **Seed** (`questBuildRelayGraphBroker`, at Start): force-completes any leftover chat-role intake items
  (`isChatWorkItemRoleGuard` — chaoswhisperer / bughunt), mints the **ENTRY family's scopes
  and nothing else** through `familyScopesMintTransformer`, and creates the first work item — all in one
  `questOperationsUpdateBroker` persist. The entry family is `riftcarver` for BOTH quest types, so that
  first work item is always the carve, `spawnerType: 'command'`, `step: 'carve'`. It is excluded from the
  spine-packages fallback the other scopes get: `packageNames` exists to narrow an AGENT's search, and a
  command has no prompt to narrow. This broker stamps **no `baseRef`**: it runs before any worktree
  exists, so the only HEAD it could read is the server process's own checkout. Seeding is idempotent —
  the re-Start check asks whether the ENTRY family already has scopes on the ledger, matched through
  `familyLedgerKeyTransformer` because two of the six family keys are not role names.

  **`codeweaver` fans out BY (PACKAGE, FLOW) CELL** (`relayTailFanOutTransformer`,
  `fanOutBy: 'implementation'`): one scope per cell, where a cell exists wherever a package tags at least
  one node on that flow, across BOTH flow types. Its text names both — `— package: <name> · flow: <id>` —
  which is what buys each cell its own budget and keeps each session's fetched flow slice to one flow. A
  package that tags nodes gets cells and NOTHING else; its contracts reach it through the
  `packageName`-only `get-quest` call, which routes contracts by PATH. The ONE flow-less scope that
  survives belongs to a package that owns a contract (by `source`, or by an individual PROPERTY's
  `source`) and tags NO node anywhere: `shared` routinely does exactly that. Membership is "this package
  TAGS a node in this flow", so a glue node mints a cell on BOTH sides — and the SEAM's units are
  assigned to the LATER-ordered cell alone, so both cells exist and neither marks a unit twice. Cells are
  ordered by package KIND tier first (`packageBuildOrderStatics.tiers` — library →
  programmatic-service/mcp-server → http-backend → frontend-react/frontend-ink →
  cli-tool/hook-handlers/eslint-plugin), then `packageGraph` depth as a tiebreak WITHIN a tier, then
  name; a package's own cells follow the quest's flow declaration order. The tier ranks ahead of depth
  deliberately: manifest depth is Kahn's order over `package.json` edges, which is inverted across an
  HTTP seam — this repo's `server` depends on `@dungeonmaster/web` because it serves the built bundle, so
  raw depth would schedule the browser package's session before the backend route it calls exists.

  **`flowrider` and `siegemaster` each fan out to ONE SCOPE PER FLOW THEIR OWN STEPS MEASURE**
  (`fanOutBy: 'flow'`), each carrying a single `flowId` and a text suffixed `— flow: <id>`. WHICH flows a
  family is cut over is `stepScopeStatics.byFamilyStep[role][step].flowTypes` — the same table every
  denominator reader shares, so the ledger cannot mint a scope whose work list computes as zero:
  siegemaster's steps take `runtime` alone (an operational flow's units settle in codeweaver's reviewer
  instead), flowrider's `review` step takes `runtime` alone too. With no eligible flow at all, the family
  keeps ONE whole-quest scope only when `off-map` is in its `unitKinds` — the probe families are
  properties of the built system rather than of any drawn flow — and flowrider gets nothing rather than a
  session dispatched against an empty denominator. A family that mints zero scopes is routed PAST by
  walking its `empty` edge.
- **Dispatch** (`quest-get-next-step-broker`): FIFO-scans active quests, picks the oldest with incomplete
  work, and returns a `NextStep` (`spawn-agents` / `run-step` / `run-riftcarver` / `run-ward` / `idle`).
  **The STEP decides before the ROLE:** a `kind: 'deterministic'` step returns `run-step` carrying its
  handler and the step's own `args`, ALONE; a work item running no step graph falls through to the
  role-keyed command split; otherwise the batch is every ready item sharing the head's ROLE and its STEP.
  `scan-once-layer-broker`'s missing-worktree halt exempts the carve and only the carve — matched on the
  `run-step` handler as well as on the legacy `run-riftcarver` type, because matching one of the two
  would block on the other.
- **Session tracking**: each work item carries `sessionId` (parent /dumpster-launch session UUID) AND
  `agentId` (the sub-agent's realAgentId, used to scope chat replay to one `subagents/agent-<id>.jsonl`
  file). For chat roles — ChaosWhisperer, BugHunt, matched by the shared
  `isChatWorkItemRoleGuard` — `sessionId` is captured from the spawned Claude's first stream-json init
  line via `chat-spawn-broker`'s `onSessionId` callback. For every Task-dispatched sub-agent under
  `/dumpster-launch`, both fields are stamped MCP-side: when the sub-agent calls `get-agent-prompt`, the
  responder reads `request.params._meta.claudecode/toolUseId` — the toolUseId of the SUB-AGENT'S OWN MCP
  call (NOT the parent Task() dispatch id) — and scans every
  `~/.claude/projects/<encoded-cwd>/<sessionId>/subagents/agent-*.jsonl` file for an assistant line whose
  `tool_use.id` matches. It retries on miss (~3 s budget) to absorb the
  Claude-Code-dispatches-MCP-call-before-flushing-JSONL race.
- **Deterministic steps** run through `questRunStepBroker` → `stepHandlerRunBroker`, whose dispatch TABLE
  carries `satisfies Record<StepHandlerName, StepHandler>` — a handler named in `agentFlowStatics` with no
  implementation behind it fails the BUILD rather than throwing on the one quest that reaches that step.
  A deterministic step's work item has no `sessionId`, so no JSONL watcher can tail it: the broker takes a
  **required `onLine`**, the sole route its output has to a UI for minutes at a time. Ward and riftcarver
  each persist a per-run history file under the quest folder and back-link it onto the work item —
  `ward-results/<id>.json` via a `wardResults/<id>` ref, the streamed carve text at
  `riftcarver-results/<id>.log` via a `riftcarverResults/<id>` ref. That ref is the ONLY route the
  execution panel has to the detail. **The handler ROUTES NOTHING**: it classifies, the broker writes that
  word as `declaredWord`, and the router decides on the next scan.

## Quest Status Lifecycle

```
created ──► explore_flows ──► review_flows ──► flows_approved ──► explore_observables ──► review_observables ──► approved ──► in_progress ──► complete
                                    │                                                          │                                              │
                                    └──► explore_flows (back)                                   └──► explore_observables (back)                 ├──► blocked ──► in_progress
                                                                                                                                                  └──► abandoned
```

The valid transitions are `questStatusTransitionsStatics`; `paused` is reachable from every live status and restores
`pausedAtStatus` on resume. ChaosWhisperer runs the entire spec lifecycle; the orchestrator drives the operations relay
entirely within `in_progress`.

Gate content (`questGateContentRequirementsStatics`, enforced by `has-quest-gate-content-guard`):

- `flows_approved` and `approved` each require non-empty `flows` — nothing else. `approved`
  demands no ledger item: the codeweaver ledger is DERIVED at Start (`fanOutBy: 'implementation'`), so coverage is
  definitional rather than checked — a quest that clears `flows_approved` already carries every input the generator
  reads. What IS checkable lives in `questSaveInvariantsTransformer` as "Contract Source Coverage": a contract's
  `source` must resolve to a declared package, or the package item it should have minted at Start never exists. That
  check applies to BOTH quest types, because both derive their implementation ledger the same way.

`Start Quest` transitions `approved → in_progress` directly (`orchestration-start-responder`), seeding the relay —
and that is ALL it does: pure `quest.json` bookkeeping, no spawn and no git, so the POST answers in milliseconds and
the `quest-modified` event that swaps the browser from the spec panel to the execution panel fires at once. The branch,
worktree, `node_modules` mirror and preflight typecheck are the `riftcarver` item it seeds at the head of the ledger, run
by the dispatcher when the quest is next in line. Once execution starts, quest status is DERIVED from work-item +
operation state by `work-items-to-quest-status-transformer` (see "Completion").

| Status                | Set By                                          | Gate                                                                    |
|-----------------------|-------------------------------------------------|-------------------------------------------------------------------------|
| `created`             | `add-quest`                                     | ChaosWhisperer starting up                                              |
| `explore_flows`       | ChaosWhisperer (Phase 1 exit)                   | Can add: flows, designDecisions                                         |
| `review_flows`        | ChaosWhisperer (Phase 2 exit)                   | User reviews flows, APPROVE button visible                              |
| `flows_approved`      | User approves flows (Gate #1)                   | Can add: observables, contracts, tooling, packagesAffected              |
| `explore_observables` | ChaosWhisperer (Phase 4 entry)                  | Can add: observables, contracts, tooling, packagesAffected              |
| `review_observables`  | ChaosWhisperer (Phase 4 exit)                   | User reviews observables, APPROVE visible                               |
| `approved`            | User approves (Gate #2)                         | Spec locked. `start-quest` allowed                                       |
| `in_progress`         | `start-quest` (Web UI "Start Quest")            | Relay dispatches operation items; agents may write `contracts`/`tooling`/`packagesAffected`/`designDecisions`/`flows` — `flowsRule: 'full'`, so add, edit and delete alike. The one refusal left is a sign-off naming a unit id the graph does not hold, which the upsert would append as a phantom unit |
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

## Observables

Observables are embedded directly in flow nodes at `flows[].nodes[].observables[]`. Each is FLAT — one
independently verifiable outcome, with no `given`/`when`/`then` block. The flow carries the precondition (the nodes
before it) and the node it sits on carries the trigger, so `flowObservableContract` has nowhere to put those keys and
the save drops them:

```
{
  id: "check-login-api-called",
  type: "api-call",
  description: "POST /api/auth/login called with credentials",
  package: "auth-service"
}
```

**`verifyByReading: true` is the one field that says "no test settles this".** It marks a criterion about the SHAPE of
a source file — an import that must be there, a literal that must not be inlined, a symbol that must be gone, or a
DECLARED STYLE VALUE that must be the one named. It renders as `(read-check)`, is settled by codeweaver's reviewer
opening the file, and drops out of flowrider's and siegemaster's denominators entirely
(`stepScopeStatics.byFamilyStep` — no step lists `reading` outside codeweaver's `review`). A style value earns it
because the assertion reaches the value and reads back the
literal the source declares — green the day it is written, red on the next restyle, blind to every defect in between.
A PAINTED OUTCOME carries no flag and stays a test: clipping, overlap and unreadable contrast are things the source
never states. **Only ChaosWhisperer and BugHunt can set this**, and no downstream track holds a verdict meaning "this
should not have a test", so an unflagged styling observable commits all three tracks to writing a change-detector.

Consumers read different parts:

- **User** reads the flow plus each node's observables as a human-readable acceptance checklist
- **ChaosWhisperer** reads observables while authoring flows, contracts, and `packagesAffected` during the spec
  phase — it authors no operation items; those are DERIVED later, at Start Quest, from the flow nodes' package tags
  and the contracts' source paths
- **Codeweaver** reads every observable on the nodes its package tags, on its own flow, as its acceptance targets — a
  sibling package's included, since a seam node's other half is the contract its own half must meet — and signs the
  ones its unit tests prove that carry its own package
- **Flowrider** uses the full observable to author the test suite that proves it, choosing the browser or below it
  per unit
- **Siegemaster** uses the full observable to hand-drive the flow against a running system and get what breaks fixed

## Quest Stages

| Stage            | Sections Included                                                             |
|------------------|-------------------------------------------------------------------------------|
| `spec`           | flows (with observables), designDecisions, contracts, tooling, operations, workItems |
| `planning`       | planningNotes, operations, contracts                                                 |
| `implementation` | every section — flows, designDecisions, contracts, tooling, operations, workItems, planningNotes |

`spec` carries the ledger alongside the flows so one read can reconcile the ledger against the spine; `implementation`
withholds nothing, because a plan handed over without the flows it targets is not diagnosable. The text renderer OMITS
a section a stage excludes rather than printing it as `(none)` — an empty header reads to an agent as "this quest has
none of these".

## Quest Types

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). **`questFlowStatics` is the
family graph** — the `entry` family and every family's routes — and it is SHARED byte for byte between
the two types, which `questFlowStatics`' own colocated test asserts. That same statics carries what
differs — the intake slash command and the create-time seed role (`initialWorkItemRole`) — alongside
the `role`, `text` and `fanOutBy` each family's scopes are cut from.

**THE TWO TYPES SHARE ONE GRAPH.** A bug-hunt's intake writes flows and observables exactly as a
feature's does, so the same families verify them:

```
riftcarver → codeweaver → flowrider → siegemaster → wardFull → @complete
```

with `warpgate` appended at MERGE rather than routed to, and every family routing `wall` to `@blocked`.

**Only the ENTRY family's scopes exist at Start.** `questBuildRelayGraphBroker` mints the one
`riftcarver` scope; each later family's are cut the moment the relay routes to it. A family that fans
out to ZERO scopes — flowrider on an all-operational quest — is routed PAST by walking its `empty` edge,
never stalled.

**There is no blight-review family and none is appended**: the standards concerns are taken by each
family's own `review` step, before the family's `commit` step runs.

What differs between the two types is the INTAKE, and nothing else:

- **`feature`** (`/dumpster-create`): `initialWorkItemRole` = `chaoswhisperer`.
- **`bug-hunt`** (`/dumpster-hunt`): `initialWorkItemRole` = `bughunt`, so `create-quest` seeds a
  `bughunt` intake operation item + work item exactly as `feature` seeds a `chaoswhisperer` one. That
  work item is where the intake session's `sessionId` lands, which is what gives the browser chat panel a
  session to hook onto during the hunt. `bughunt` is a CHAT role (`workItemRoleStatics.chat`).

  Bug-hunt reuses the flow/observable spec lifecycle, in the shape **ONE FLOW PER BUG**: each flow is the
  reproduction path run once, forking at its last shared node (two outgoing edges labelled `today` /
  `after fix`) into two terminal nodes whose LABELS carry the indicator — `ACTUAL: <symptom today>` and
  `EXPECTED: <what the fix must make real>`. The observables sit on the EXPECTED side, never on ACTUAL —
  an observable is a positive expectation, so one on the broken branch asks for a test that asserts the
  bug. Each becomes one failing test, written by the CODEWEAVER scope that owns the package the fix lands
  in. The prefixes are a LABEL convention, not a contract field: `flowNodeContract` carries
  id/label/type/packages/observables and has nowhere else to put them, so the prompts that write them and
  the prompts that read them must spell them identically.

Adding a type = one `questFlowStatics` entry, and the type added to `questTypeContract`.

## Agent Roles

Every relay family is one operation item per scope → MANY work items, one per step the router mints on that scope.
**Each step of a family's own step graph is its own dispatched session** — a planner cuts the scope into pieces and
a worker builds one piece itself, with no sub-agent briefed in between (see "Agent Flow: the step graph inside a
family"). A session records its marks and, optionally, an
`outcome` word through `quest-work`, then signals `complete` — a session-terminal marker and nothing more. The
ROUTER reads that record and takes the step's own route for it. Sessions have **no failure signal for work they
could have done**: `unmet` is not a failure, it is what mints a successor scoped to exactly the units that are still
open. `wall` is reserved for an environment wall outside any session's reach and routes to `@blocked` in every step
of every family, halting the quest for the user rather than spawning a successor that hits the same wall. Quest
status is then derived from the family graph's position.

The relay role set per quest type is the `role` on each family in `questFlowStatics[type].families`. The `agentRoleContract` enumerates the
Claude-dispatched agent roles (`codeweaver`, `flowrider`, `siegemaster`, `spiritmender`, `warpgate`) — the first three
are `agentPromptClassificationStatics.operatorRoleNames`; `spiritmender` and `warpgate` keep bespoke prompts and brief
nobody. No minion name is ever also a role, since `agentPromptClassificationStatics.roleNames` and `.minionNames` are
DISJOINT (see "Minions" below); the broader `workItemRoleContract` (shared) adds the two COMMAND roles (`ward` and
`riftcarver`) and the three interactive CHAT roles (`chaoswhisperer`, `bughunt`, `tavernkeeper`) a work
item may carry. Those three ARE the `workItemRoleStatics.chat` tuple, and `isChatWorkItemRoleGuard` is the one
predicate every call site uses to match them — adding a chat role means adding it to that tuple, not to another `||`
chain. The command pair is `workItemRoleStatics.command`, matched the same way by `isCommandWorkItemRoleGuard`;
`riftcarver` is deliberately absent from `agentRoleContract`, so a dispatch site that mistook it for an agent throws
rather than spawning a Claude session for a git sequence.

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

It is keyed by quest rather than by process because the quest PAUSE route kills every process on the quest AND flips
status to `paused` — from `complete`/`merged` an illegal transition, and from `blocked` a legal one that would quietly
take the whole quest.

| Role           | Dispatched By                                                                                                           | Operation outcome                        | Quest writes                                                                     |
|----------------|-------------------------------------------------------------------------------------------------------------------------|------------------------------------------|--------------------------------------------------------------------------------------------------|
| ChaosWhisperer | `/dumpster-create` (interactive)                                                                                        | N/A (spec)                               | `modify-quest`: full spec surface (flows, observables, contracts, packagesAffected) — never `operations`         |
| Tavernkeeper   | follow-up chat (interactive, AFTER the quest ends)                                                                      | N/A (chat; no operation item)            | none                                                                                             |
| riftcarver     | its `carve` step is `kind: 'deterministic'`, so a normal quest reaches it via `run-step` → `stepHandlerRiftcarverBroker`; the `run-riftcarver` MCP tool / Node-loop branch (command) only fires for a work item with no step node (a hydrated or legacy-blueprint quest) — ALWAYS the ledger's first item | exit code (green / repairable / blocked) | none (broker writes `branchName`/`baseBranch`/`worktreePath`/`baseRef` + riftcarverResults + item status) |
| codeweaver     | `/dumpster-launch` via Task(), ONE SCOPE PER (PACKAGE, FLOW) CELL running its own `plan → work → review → commit → ward` step graph — product code + its unit tests | family done / blocked | `quest-work`: a plan (planner), an `observations[]` mark per unit plus an outcome word (worker, reviewer); `modify-quest` narrowly (`packagesAffected` from the planner, `verifyByHuman` from the worker) |
| ward           | `wardFull`'s `gate` step is `kind: 'deterministic'`, so a normal quest reaches it via `run-step` → `stepHandlerWardBroker`; the `run-ward` MCP tool / Node-loop branch (command) only fires for the same no-step-node fallback                                                                     | exit code (green / red)                  | none (broker writes wardResults + item status)                                                   |
| flowrider      | `/dumpster-launch` via Task(), ONE SCOPE PER FLOW running the same step graph as codeweaver — the test suites that prove that flow                   | family done / blocked | same shape as codeweaver's row above                                            |
| siegemaster    | `/dumpster-launch` via Task(), ONE SCOPE PER FLOW running its own `sweepIn → plan → happyWalk ⇄ fixHappy → adversarial ⇄ fixAdversarial → commit → ward → sweepOut` graph — hands-on QA against a running system | family done / blocked | `quest-work`: a plan (planner), an `observations[]` mark per unit the walkers settle plus an outcome word (every step); an `invalidation` payload appends a `walk-reset` note |
| spiritmender   | `/dumpster-launch` via Task() (inserted on a ward red, or on a REPAIRABLE riftcarver red). Bespoke prompt                | complete (done / partial / blocked)      | none                                                                                             |
| warpgate       | dispatched like any relay role, but its item is appended at MERGE time (see below). Bespoke prompt                       | complete (done / partial / blocked)      | none                                                                                             |

### Riftcarver — the head of the relay, and re-entrant by design

`riftcarver` is the first operation item on every quest, of either type. It detects the base branch, runs
`git worktree add`, pins `baseRef` from the new tree's HEAD, mirrors `node_modules` for the repo root and every
workspace root, and runs the preflight typecheck to convergence — all under one `spawnerType: 'command'` work item, with
every line streamed live to the execution row and persisted to `<questFolder>/riftcarver-results/<id>.log`. Putting it
here rather than inside `POST /api/quests/:questId/start` is what keeps that POST at millisecond scale AND what stops
a workspace being forged at spec-approval time for a quest that may sit behind several others.

**⚠️ THIS HANDLER IS RE-ENTERED BY DESIGN — every step owns a done-check.** The repairable failure route is
`carve → repair → carve`, so a second run against a PARTIALLY BUILT workspace is ROUTINE, not an edge case.
Therefore:

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
   some other work owns, but on a re-entry the recorded branch is the quest's OWN, so re-running it would refuse the
   continuation against attempt 1's work and lock the quest out permanently. That is the step that breaks first if a
   done-check is dropped.
2. **THE TYPECHECK IS THE ONE DELIBERATE EXCEPTION and has no done-check**, because re-running it IS how the
   spiritmender's fix gets verified. The typecheck is the verdict, not a side effect; a marker file "optimising" it
   away would let a re-carve report green off the previous attempt's result.

**Riftcarver also PUSHES, once, right after it records the git context.** `git push -u origin <branchName>`, with its
own done-check (`git rev-parse @{upstream}` succeeding means a prior attempt already did it, and the step emits
`— skip push … —`). Doing it at carve time is what removes the decision from everywhere else: `@{upstream}` resolves
from the moment the quest exists, so every later push is a bare `git push` with no `-u` for any session to get wrong,
and `get-blight-checklist({ scope: 'unpushed' })` always has a range. A failed push classifies **`repairable`**, not
`git-state` — the worktree is fully built and holds every commit, so a spiritmender has somewhere to work and the
re-carve retries only the publication; blocking there would halt a quest over a network blip. A permission-denied push is
caught first by `isPermissionDeniedErrorGuard` and blocks, because no fresh session talks an operator's credentials into
working.

**`baseRef` is written exactly once, ever.** Riftcarver is its sole writer, reading it in the same breath as creation
before `node_modules` or the typecheck can touch the tree, and never recomputing it once recorded — not even when the
worktree is re-created and its fresh HEAD reads back a different sha. Moving it after commits have landed folds the
quest's own work into the review base, the exact defect `baseRef` exists to fix. `questBuildRelayGraphBroker` stamps
none: Start runs before any worktree exists, so the only HEAD available there is the server process's own checkout.

**Failure CLASSIFICATION is by step**, off `worktreePrepareStepStatics.classifications` (keyed by the step's own
VALUE, the thing `WorktreePrepareError` carries): `create` / `base_branch` classify as `wall`, deliberately, so no
agent is ever dispatched into the repo-root checkout; `push` / `node_modules` / `typecheck` classify as `unmet`.
`isPermissionDeniedErrorGuard` is checked FIRST and overrides the step's own class — no fresh session of any role can
talk an operator's filesystem out of saying no. The handler reports that word and the `carve` step's own routes do
the rest: `unmet` to `repair`, which returns to `carve`; `wall` to `@blocked`. The bound is `carve`'s and `repair`'s
own `maxVisits`. Full outcome table in `docs/quest-role-paths.md`, invariants under `RIFT-*`.

The whole outcome — work-item status, the operation completing, the `riftcarverResults` ref, the work item's
`riftcarverResults/<id>` back-link, and any splice — rides ONE `questOperationsUpdateBroker` persist, so a crash is
all-or-nothing. (Ward writes its results ref in a separate, earlier write; riftcarver's rides the same persist as the
ledger mutation.) The git context `{ branchName, baseBranch, worktreePath, baseRef }` is persisted earlier still —
right after the git steps, BEFORE `node_modules` and the typecheck — so a spiritmender dispatched off a later failure has
a real worktree to work in and the re-carve behind it can see the git steps are done.

`questHydrateBroker` DROPS the riftcarver item by default (unless a blueprint authors one itself): a hydrated quest is
fabricated directly at `in_progress`, never through Start, so it has no workspace to carve and no scripted scenario
expects one. Without that default the first thing every hydrated quest dispatches is a real `git worktree add` +
mirror + typecheck against the developer's own checkout — precisely the work hydrate exists to skip.

### Warpgate — the one ledger item appended after the relay has drained

Every other operation item is minted when the family graph routes to its family (`familyScopesMintTransformer`
reading `questFlowStatics` — including the codeweaver items themselves, via `fanOutBy: 'implementation'`). Warpgate
is neither: `OrchestrationMergeResponder`
appends it when the user presses "Teleport with Booty (Merge)" on a quest that is already `complete` or `blocked`
(`isMergeableQuestStatusGuard`). Because its family carries no `text`, its text lives in `warpgateOperationStatics`.
Once appended it dispatches exactly like any other relay role — `get-next-step` → Task ()/headless child →
`get-agent-prompt` → `signal-back`.

**It lands on base with `git merge --squash`, so base gets ONE commit per quest.** A quest branch carries one commit
per pass of every scope that ran on it — the deterministic `commit` step's own message, built by
`commitMessageBuildTransformer` from the marks the pass's work items recorded (`met`/`cant-meet`/`unmet` lines, no
session prose) — and base keeps only the result. The intake merge at its step 2 (base INTO the quest branch) stays a real merge —
other direction, and its history matters while the quest runs. A squash records no merge parent, so git does not
report the branch as merged afterwards; nothing downstream reads that, because warpgate never pushes.

Four things about that append are load-bearing, and all four live inside `questOperationsUpdateBroker`'s per-quest lock:

- **Status flips to `merging` BEFORE the append.** The ops-update broker re-derives quest status on every write from
  whatever it reads off disk; from `complete`, a pending warpgate item would derive `in_progress` — neither a legal
  transition out of `complete` nor what a merge means.
- **The operation is minted WITH its work item**, carrying `step: 'merge'` — the warpgate family's entry step — so
  `questAdvanceBroker`'s resume guard (which skips a pending operation that already has a linked work item) can never
  open the scope a second time, and the router reads a scope that has been entered rather than one nothing has
  touched.
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

### The gate/repair fixpoint

A **gate** is a deterministic step whose `unmet` routes to a `repair`: `ward` in every code-changing
family, `carve` in `riftcarver`, `gate` in `wardFull`. The repair is a `spiritmender`-prompted worker
step in the SAME family, and the two shapes it takes diverge on purpose: `ward`'s own `repair`
(`CLOSE_OUT.repair`, shared by codeweaver, flowrider and siegemaster) declares no `done` route at
all, so a finished repair RETURNS to the gate that minted it and that gate re-runs; riftcarver's and
wardFull's own `repair` steps instead declare `done: 'commit'` and take that FORWARD edge onward,
because each of those graphs has no shared `CLOSE_OUT` to fall back into and needs its own commit.
Either way the gate is what re-runs: convergence IS the verdict, and a gate that comes back `done`
takes its own `done` edge onward.

**A gate's `unmet` route is a plain route mint, and it carries the return edge's fuel whenever its
target needs one.** `ward` and `carve` are `kind: 'deterministic'` and mint with `assignedUnitIds:
[]`, so their `unmet` route never takes question 2's mark-mint branch — there is no per-unit mark to
group by. The router stamps `mintedBy` on the plain route mint itself instead, naming the gate's own
current work item, whenever the target step (`repair`, or siege's `fixHappy` / `fixAdversarial`)
declares no `done` route of its own. A target that DOES declare `done` (riftcarver's and wardFull's
`repair`, `review`, `work`, …) is left untouched, so a genuine gap in ITS OWN route table still
surfaces as `no-minter` instead of silently returning somewhere nobody routed it.

**The bound is `maxVisits`, and it is a ceiling on a count nothing stores.** The router derives it where
it is about to mint — the work items on this scope whose `step` equals that step — so no visit counter
field exists on the work item and none is to be added. Exceeding one is
`{ kind: 'block', reason: 'max-visits' }`.

**Verification is measured, not asserted.** A flow decomposes into atomic **verification units** (the off-map
probe families, every terminal, labelled branch and observable — `qaUnitEnumerateTransformer` is the single
enumerator every reader shares). Each unit's state is ONE `UnitObservation` — `{ unitId, mark, evidence, toSettle?,
at }` (`unitObservationContract`, `@dungeonmaster/shared`) — recorded onto whichever work item was assigned the
unit, in that work item's own `observations[]` array, never a per-track field carried on the unit itself.
`unitCurrentMarkTransformer` reads a unit's state right now as the observation on the LATEST work item (by array
order) that was ever assigned it: an unmarked assignment on that latest item beats a `met` an earlier item already
recorded, so a session that crashed before marking its units is visible instead of silently overridden by stale
evidence. `stepInScopeUnitsTransformer` is what derives one step's own denominator from the operation item.

**`stepScopeStatics.byFamilyStep`, keyed on (family, step), is the DENOMINATOR — never a track field.** Which
units a STEP is measured over — flow types, unit kinds, package kinds and the observable provenances that step
could ever settle — lives there, restated per step rather than shared, so an edit meant for one step cannot
silently reach another. Every step reads its flows by the operation item's own `flowIds` and its packages by
intersection against `packageNames`, with ONE refinement for a SEAM: a node carrying more than one package gives
its units to the LATER-ordered cell alone — the side that can see both halves — so no unit is owned twice and the
earlier cell reaches the far half through its piece's `contextUnitIds`. Only siegemaster's `happyWalk` and
`adversarial` steps carry `off-map` in their `unitKinds`, and every step outside codeweaver's `review` is measured
over `runtime` flows alone.

**Nothing COUNTS observations, and no gate may be added that does.** A check refusing a `done` over an absent
mark pressures a session into a verdict it cannot back. What an observation buys is a durable, per-unit record of
what was proved and by what evidence — `met` needs a `file:line` and the wrong value that turns it red, or the
value measured off the running system; `cant-meet` needs what was tried plus a `toSettle`; `unmet` needs what is
left and what this session already learned, so its successor reads that note rather than starting cold.

**`toSettle` is an INSTRUCTION, never a question.** It is the action that would settle the unit, and
`unitObservationContract` refuses a `cant-meet` mark without one (and refuses a `toSettle` on any other mark —
`met` has already settled the unit, and `unmet` means work remains rather than that this layer gave up).

**A measured defect is a NEW observable, not a mark.** An observable is a positive expectation, so its inverse is
ADDED to the flow through the additive spec authority every operator holds, and then carries its own observations.
`addedBy` answers "was this in the spec at approval, or added mid-quest, and by whom"; `observableOrigins` is what
stops a step being measured on work that did not exist while it ran.

**`quest.planningNotes.questNotes[]` is the durable side channel** — `{ id, kind: 'open-question' |
'tooling-error' | 'out-of-scope' | 'walk-reset', role, workItemId, flowId?, unitId?, summary, detail, at }`.
A note NEVER closes a unit; only an observation does. Reopening every observation on a flow is the `invalidation`
payload on `quest-work`: a `flowId` plus a reason, refused to any work item but a siegemaster one, which appends a
`walk-reset` note here and leaves every existing observation on disk untouched — the reopening is a consequence of
a later work item's own assignment outranking the earlier `met`, not an edit or an erasure.

**The standards-review surface has its own tool family**, and it is NOT a role's denominator. A diff
decomposes into review units (`get-blight-checklist` — every changed impl file, its test/proxy/stub
companions collapsed onto it, crossed with each of FIVE concerns), over five scopes: `working-tree`,
`unpushed`, `commit`, `quest` (from the pinned `baseRef`) and the server-only `since-ref`.

### Minions (parent-summoned sub-agents)

**There is ONE minion name** (`agentPromptClassificationStatics.minionNames`): `chaoswhisperer-gap-minion`. Every
other named reviewer or walker — `codeweaver-reviewer`, `flowrider-reviewer`, the siege walkers and fixers — is a
STEP in its family's own step graph, dispatched directly by the router as its own work item, never briefed by a
parent session. See "Agent Flow: the step graph inside a family" and "Siegemaster: the inverse step graph" above for
what each step does, and the roster table under "Callouts" for the full list of served step prompts.

`chaoswhisperer-gap-minion` runs in the SPEC phase, before any operation item exists, summoned by ChaosWhisperer
inside `/dumpster-create` to validate spec completeness before approval. **It fetches with `{ agent, questId }` and
NO `workItemId`** — that is what keeps it outside `subagentStopNeedsBlockGuard`, which holds a work-item session
open until it calls `signal-back`. It is NOT a work item and NOT an operation item, and it never signals back — its
pass lives inside ChaosWhisperer's own turn, observable under that chain via wire-level toolUseId correlation. It
runs on `sonnet`, fixed in `agentNameToPromptTransformer` rather than inherited from its parent.

`roleNames` and `minionNames` stay DISJOINT, and the mechanical stakes are what enforce it: a minion added to
`roleNames` would widen `agentRoleContract` with a role no operation item can ever hold, and a role added to
`minionNames` would let it fetch without a `workItemId` and escape `subagentStopNeedsBlockGuard`.

**No minion asks the user anything.** It runs inside its parent's turn, so no human sees its questions and nothing
resumes it with an answer.

## Signal System

Agents report via the `signal-back` MCP tool. `complete` is the SOLE signal kind — a session-terminal
marker and nothing more. `signalBackInputContract` validates `signal: 'complete'` plus an optional
`operationItemId` and `blockedReason`, and `.strict()` refuses any other key. The live handler is
`quest-handle-signal-back-responder.ts`.

**A SESSION REPORTS; IT NEVER ROUTES.** What a session DID is already on the record before it signals —
its marks on each assigned unit, and optionally an `outcome` word, a `request` for another step, or an
`invalidation`, all written through the `quest-work` tool. `signal-back` marks the work item terminal;
the ROUTER reads the record on the next scan and takes the step's own route for it.

**One gate runs BEFORE any mutation, and it THROWS rather than returning** — the error rides the awaited
`signal-back` path back through the MCP tool to the agent, where it is visible and actionable, instead of
being swallowed as a success. Because nothing is persisted on a refusal, the session fixes what the
message names and signals again; the work item and its scope are exactly as they were.

**Unmarked-unit gate — on every outcome, for every role.** `signalGateTransformer` compares the
signalling work item's `assignedUnitIds` against `observations[].unitId` and refuses the call while any
assigned id carries no observation. A mark's VALUE is irrelevant — `met`, `cant-meet` and `unmet` all
count as marked, only the absence of an entry counts — so a unit the layer cannot settle (`cant-meet`) or
cannot make pass (`unmet`) clears the gate exactly as `met` does. The refusal message is the deliverable:
it names every unmarked unit alongside its text, so the session can act on it in the same turn instead of
spending a round trip re-fetching what it means, and it closes by telling the session that `unmet` is free
and mints its successor — the answer to a session padding marks to get past the gate. A session marks a
unit through `quest-work` and re-fetches the full outstanding set through `get-quest-work`.

Nothing at signal time reads the worktree. Every session reaches its signal with a dirty tree by
construction — no session commits its own changes; the family's `commit` STEP does — and
`gitWorkingTreeFilesBroker` stays in service of the reviewer's pass, the worker's live DO-NOT-TOUCH set,
and the fixer's view of what a walk left behind, none of which is this gate.

The handler is **idempotent**: a redelivered signal for an already-terminal work item is a no-op, and
because that check runs before the gate above, a redelivery never pays the gate's cost either.

### Failure handling

The orchestrator has THREE failure shapes, and the STEP GRAPH owns all three.

- **`unmet` — the ordinary one, and not a failure.** A step that left units unsettled routes them to its own
  `routes.unmet`: `review → work`, `ward → repair`, `happyWalk → fixHappy`, `carve → repair`. Where the routing item
  holds real per-unit marks (`review`, `happyWalk`), the router mints ONE work item per originating piece carrying
  exactly those units, plus one per unit no piece claimed, and that mint's own `mintedBy` names the item that held the
  unit. Where it holds none (`ward` and `carve` are `kind: 'deterministic'` and mint with `assignedUnitIds: []`), it is
  a plain route mint instead, and the router stamps `mintedBy` there naming the gate's own current item — but only
  when the target declares no `done` route of its own: `ward`'s own `repair` and siege's `fixHappy` / `fixAdversarial`
  need it and RETURN to the gate that minted them once they drain, where riftcarver's and wardFull's own `repair`
  declare `done: 'commit'` and never need it.
- **A spent `maxVisits` — the bound.** Each step declares its own ceiling, derived where the router is about to mint
  from the work items on this scope at that step. Exceeding one is `{ kind: 'block', reason: 'max-visits' }`, which
  halts the quest rather than looping.
- **`wall` — the halt.** An environment wall a session declares through `quest-work`, or a deterministic handler's
  classification: ward's CRASH (ward never reported on the code, so a repair has nothing to fix), riftcarver's
  `git-state` red or a permission denial (there is no worktree to dispatch a repair into, and the only checkout left
  is the repo root — the one place no session may ever be sent). Every step routes it to `@blocked`.

`stepHandlerRunBroker` is also THE HANDLER BOUNDARY a thrown error becomes `wall` at: a handler that hits an
exceptional condition it does not itself classify throws, and the boundary turns that throw into a
`StepHandlerResult` instead of an unhandled rejection with nothing to route it.

**Resume, don't restart.** An `in_progress` work item observed during a get-next-step scan is necessarily orphaned
(the loop holds no dispatch in flight), so `recover-orphaned-work-items-layer-broker` flips it back to `pending`
KEEPING `sessionId`/`agentId` and adds a `resume` marker; Node/UI dispatch resumes the retained Claude session
(`claude --resume`) so partial work survives. A resumed orphan keeps its `step` and its `observations` — the
observation set freezes at signal, so a resumed session re-marks its assigned units from scratch rather than amending
a predecessor's set. An early crash with no captured session falls back to a fresh spawn; the MCP-Task path
re-dispatches fresh. Budget: each recovery bumps `retryCount`; at `slotManagerStatics.orphanRecovery.maxResets` the
crash loop is terminal and the quest blocks. The broker returns `{ quest, blocked }`, and `scan-once-layer-broker`
STOPS on `blocked: true` — it does not fall through to the router or the advance self-heal, because minting and
dispatching work against a quest that just halted is exactly the bug that flag exists to prevent.

**Never clobber a retained session.** `buildSpawnInstructionLayerBroker` decides resume-vs-fresh on
`sessionId !== undefined && agentId === undefined`, and it does NOT consult the `resume` marker. Any dispatchable
work item carrying a session resumes it, whatever the role. Gating on the marker instead fresh-spawns an item whose
session was recorded but never formally reclaimed (a quest that blocked before recovery reached it, a hand-repaired
quest.json), and the new child's init line then overwrites `sessionId` — silently orphaning a session that still
holds real work. `agentId` is the ONE exception: `get-agent-prompt` stamps it together with a `sessionId` that is the
user's `/dumpster-launch` loop session, not the agent's own. The resume prompt opens by telling the agent it was CUT
OFF (killed, not paused) and requires re-establishing real state before any new work, since its last action may never
have landed. Covered end-to-end by `packages/web/src/flows/quest-chat/dispatch-resumes-retained-session.e2e.ts`.

**An API overload is not a crash.** A dispatched child that exits non-zero after emitting a 529 / `overloaded_error`
marker lost the upstream API, not its own work. `spawn-one-agent-layer-broker` owns that case BELOW orphan recovery:
it re-dispatches the same work item in place on `apiOverloadRetryStatics`' schedule (10 retries a minute apart, then
20 five minutes apart) WITHOUT touching `retryCount`, resuming the captured session when the dead attempt reached its
init line. Detection needs BOTH the marker and the non-zero exit — a marker alone is just an agent printing a string.
The retry yields to a paused dispatcher (rechecked after each backoff, which can sleep minutes) and to a work item
that went terminal mid-wait.

**Resuming a blocked quest rearms it.** `OrchestrationResumeResponder` accepts `blocked` as well as `paused` (a block
leaves no `pausedAtStatus`, so it restores `in_progress`) and runs `quest-resume-rearm-work-items-transformer` first:
every work item whose linked operation item is still unfinished goes back to `pending` with `retryCount` cleared,
keeping `sessionId` + the `resume` marker. Without it the blocking item is still `failed` at the budget, so the next
recovery pass re-escalates and re-blocks — a resume that does nothing. The rearm persists BEFORE the status flip.

**Siegemaster's rounds each own their own LANE.** `dungeonmaster siegelense start` (`packages/siegelense`'s
`laneBootBroker`) stands up an API server, a Vite server and a headless Chromium against an OS-assigned port pair and
a throwaway `DUNGEONMASTER_HOME` — one call per minion per round. A lane that will not start is a defect the round surfaces,
never a wall. **Codeweaver and Flowrider are given no dev server and need none:** a Flowrider browser walk brings its
own up from the project's Playwright config (`webServer`) and tears it down with the run. Operational flows run no
server at all.

### Completion

`work-items-to-quest-status-transformer` derives quest status on every ledger write, and **`complete`
means THE FAMILY GRAPH REACHED `@complete`, never that the ledger drained.** Under a graph that can
cycle, a drained ledger is an ordinary mid-run state — `work ⇄ review` is legitimately empty between two
passes — so `familyGraphCompleteDetectTransformer` owns that question.

**It asks from the TERMINAL end, and walking forward is the trap.** A family that fanned out to zero
scopes leaves no trace on the ledger, so a forward walk cannot tell "flowrider was skipped as `empty`"
from "flowrider has not been routed to yet", and walks straight past every un-minted family to
`@complete`. Asking instead whether a family that ROUTES to `@complete` holds scopes of its own makes
their presence the proof the run got there: a `wardFull` scope exists only because siegemaster's `done`
routed to it.

Pre-execution, user-paused, abandoned, blocked and `merged` statuses are never derived over. An
unrecovered sink failure with nothing left to advance to returns `blocked`; otherwise `in_progress`.
That sink roll-up reads `insertedBy`, NOT `mintedBy` — `insertedBy` means "a retry was spliced for this
failed item", where `mintedBy` is the router's RETURN EDGE, and reading it here would make a mark-minted
worker read as superseding the reviewer that minted it. `skipped` is terminal and non-failure but does
NOT satisfy `dependsOn`, so a `skipped` dep permanently dead-ends its dependents.

### MCP Sanitization

The MCP `modify-quest` tool gates writes by the per-status allowlist (`quest-status-input-allowlist-statics`):

- `operations` — off the allowlist entirely, at every status. No agent writes the ledger anywhere: the codeweaver
  ledger is DERIVED at Start (`fanOutBy: 'implementation'`), not authored by ChaosWhisperer, and every runtime
  mutation goes through `questOperationsUpdateBroker`, which bypasses this allowlist.
- `workItems` — server-only, managed by the advance / signal-back / ward / riftcarver brokers.
- `wardResults` — server-only, written by `quest-run-ward-broker` (the no-step-node fallback) or `stepHandlerWardBroker`
  (a normal quest's deterministic `ward` / `gate` step), which reuses the former's non-routing result-append.
- `riftcarverResults` — server-only, written by `quest-run-riftcarver-broker` (the fallback) or
  `stepHandlerRiftcarverBroker` (a normal quest's deterministic `carve` step), one entry appended per carve attempt so
  a re-carve chain leaves its whole history rather than overwriting the attempt that failed.

**Every timestamp a modify-quest payload writes is REPLACED with the server's clock, and the caller's value is
discarded** — `questInputServerTimestampsTransformer`, running before any branch of `questModifyBroker` reads the
input. It covers every sign-off track's `at`, `questNotes[].at`, and `operationPlans[].at`.
An LLM has no reliable clock: one audited quest carried 27 sign-offs sharing a single fabricated timestamp that
predated the work, alongside a session whose notes drifted 50 minutes into a future it never reached. It stamps what is
INCOMING rather than the merged quest, which is the whole point — a write that signs one observable leaves the other
forty entries reading the moment they were really made, instead of re-dating the quest on every unrelated call. Prompts
tell agents not to send these fields at all; the transformer is what makes that true whether or not they listen.

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
| Server `orchestration-start-responder` | HTTP endpoint that the Web UI "Start Quest" button calls; mutates status and redirects to execute view. Does NOT spawn anything, and does NOT build anything — it is pure `quest.json` bookkeeping (startable gate, package graph, relay seed, status flip, queue entry) and touches no git, so the POST answers in milliseconds and the WebSocket-driven panel swap is immediate. The branch, worktree, `node_modules` mirror and preflight typecheck are the `riftcarver` item it seeds at the head of the ledger. |

## Agents (MCP-Delivered)

Agents get their prompts dynamically via the `get-agent-prompt` MCP tool. The dispatch
surface (`/dumpster-launch`'s Task() invocations) hands each dispatched session a stub prompt that
says "call `get-agent-prompt({agent, workItemId, questId})` and follow its instructions exactly." For a step work
item, `workItemToPromptTransformer` substitutes FOUR IDS into the returned prompt (quest, work item, operation item,
and the operation item's own text) — no quest content, which each step fetches for itself through `get-quest-work` /
`get-quest` — and `agentPromptGetBroker` stamps `workItem.sessionId` (parent UUID) + `workItem.agentId` (sub-agent
realAgentId) from MCP request metadata: Claude Code surfaces `request.params._meta.claudecode/toolUseId` on every MCP
call (the toolUseId of the sub-agent's OWN MCP call, not the parent Task() dispatch id). The responder scans every
session's `subagents/agent-*.jsonl` file for an assistant line whose `tool_use.id` matches — deterministically
identifying the calling sub-agent race-free even when N sub-agents call in parallel against the same MCP stdio child.

**`agentPromptGetBroker` stamps a third field, `workItem.startRef`** — the quest worktree's HEAD
sha, read with `gitHeadShaAdapter` off the checkout `questCwdResolveBroker` resolves. It is written
the FIRST time an item is served its prompt and NEVER moved, so a re-served prompt (an
orphan-recovery resume, a redelivered fetch) does not shrink the range it marks: a later HEAD
already contains that item's own commits. Guarded twice — a pre-check that skips the git spawn on
every fetch after the first, and a re-check inside `questOperationsUpdateBroker`'s per-quest lock
for two fetches racing. No worktree, or an unreadable HEAD, records nothing. It is the base
`questGetBlightChecklistBroker` measures from under its server-only `since-ref` scope.

| Minion | Summoned By | Model | Purpose |
|---|---|---|---|
| `chaoswhisperer-gap-minion` | ChaosWhisperer (inside `/dumpster-create`) | sonnet | Validate spec completeness before approval. It runs in the spec phase, before any operation item exists, and is the ONE minion name `agentPromptGetBroker` still serves when a `workItemId` arrives with it |

**The one minion fetches with `{ agent, questId }` and NO `workItemId`.** That fetch hands back its prompt, its
Quest ID and nothing else — everything narrower reaches it through ChaosWhisperer's own brief, inline. See "Minions
(parent-summoned sub-agents)" above.

Every step work item — every family's own `plan`/`work`/`review`/`repair`/`merge` step, plus `spiritmender` and
`warpgate` — fetches with a `workItemId` — `get-agent-prompt({agent, questId, workItemId})`, see "Agent Roles".
`agentPromptGetBroker` THROWS on a role name that arrives without one, and on the minion name that arrives WITH one,
so the split is enforced from both ends. It refuses that second case **BY NAME** rather than letting it fall through
to the work-item branch, because a minion carrying a `workItemId` is held by `subagentStopNeedsBlockGuard` until it
calls `signal-back`, and the only item it could signal on is its PARENT's operation item — completing the parent's
scope while the parent is still working.

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

`index.test.ts` imports `./index.proxy` FIRST and the barrel second, and that ORDER is the whole
mechanism. `index.proxy.ts` spies `globalThis.setInterval`/`clearInterval` at MODULE SCOPE, so the
spies are already installed by the time a CJS require reaches the barrel and its bootstraps run.
Verified rather than assumed: make that implementation throw, and the barrel import dies with the
thrown message. **Any new unit test that imports the orchestrator barrel must import that proxy above
it.**

The barrel import is STATIC for a second reason. `./index` pulls the whole package, so a dynamic
`await import('./index')` transforms 1,467 files INSIDE the test body, and ward's slow-test gate then
reads a compile as a slow test — measured at 13.1s on a cold cache against 5ms warm, the same work
either way. A static import is transformed when jest requires the test file, before any test starts.

**There is no leak-guard test here, and that is a finding rather than a gap.** A
`process.getActiveResourcesInfo()` Timeout count taken either side of the import comes back unchanged
whether the spies are installed or not — measured both ways — so it passed for every tree and proved
nothing about the mock it was written to protect. Guarding this for real means first finding what the
bootstraps actually register.

`start-orchestrator.integration.test.ts` imports `StartOrchestrator` without neutralizing and carries
the same latent leak.

## Headless spawns get no browser tools

Claude Code attaches the Claude-in-Chrome MCP only when a session passes `--chrome` (or ran the
interactive `/chrome` flow). `child-process-spawn-stream-json-adapter.ts` passes neither, so every
headless `claude -p` child this package spawns starts with ZERO `mcp__claude-in-chrome__*` tools,
regardless of whether the extension is installed or the user's own interactive session has the
tools — those are irrelevant to the child.

Siegemaster's `ui-state` observables are driven by a Playwright lane
(`packages/siegelense`'s `playwrightSessionAdapter`), each round's verifier/stress pair holding its own headless
Chromium — no session dispatched from this package needs `mcp__claude-in-chrome__*`.

**`--chrome` is the only way to attach those tools to a headless child**, should a future role need
them: Claude Code grants Claude-in-Chrome via that one CLI flag and nothing else, and the flag
carries its own permission grant (no `settings.json` entry required) — verified against an isolated
`CLAUDE_CONFIG_DIR` holding no chrome grant and with the project's allow-list ignored,
`mcp__claude-in-chrome__tabs_context_mcp` was PERMITTED while `mcp__webstorm__*` was DENIED under the
same `defaultMode`. Two things to check before relying on it again: bypass-permissions mode disables
it (`--dangerously-skip-permissions` + `--chrome` = no browser tools — verify the flag actually took
effect, do not assume), and a sub-agent may not inherit it — the CLI reports the tool set "was fixed
before the browser connection completed", relevant to the `/dumpster-launch` Task() dispatch path.

The general rule holds for every OTHER MCP server: an ungranted MCP tool in a headless `-p` child is
denied outright, never prompted — which is why `agentGitPermissionsStatics` exists. Chrome would be
the exception, because its CLI flag is itself the grant.

## One step of one family at a time

The orchestration does not handle two different families running at once: `signal-back` does not gate on
readiness and `get-agent-prompt` stamps identity without a dependency check, so dispatching across two
families concurrently would force-complete them out of order and INVALIDATE the run.

**The dispatch layer now enforces it.** `compute-next-step-from-quest-layer-broker` selects the batch on
the HEAD ready item's ROLE **and** its STEP, so a batch is one step of one family by construction — which
is what a router mint is. `select-batch-layer-broker` still throws on a batch that mixes either, but that
throw is a backstop rather than something ordinary traffic reaches.

**Several sessions of ONE step run in parallel by design** — nine codeweaver cells, or a step's pieces.
A deterministic step and a command work item each dispatch ALONE, because each owns the whole tree for
the length of its run.

When driving the loop by hand: one `get-next-step` → dispatch only the `workItemId`(s) it returned →
wait → assert `quest.json` on disk → `get-next-step` again. Only ever use ids the tool echoes back, never
one recalled from a seed array or an earlier turn.
