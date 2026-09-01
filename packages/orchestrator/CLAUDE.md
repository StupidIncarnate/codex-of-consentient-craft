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

  The served roster is ten names (`agentPromptClassificationStatics.promptNames`):

  | Name | Kind | File | Model |
  |---|---|---|---|
  | `codeweaver` | role | `codeweaver-prompt/` | opus |
  | `flowrider` | role | `flowrider-prompt/` | opus |
  | `siegemaster` | role | `siegemaster-prompt/` | opus |
  | `spiritmender` | role | `spiritmender-prompt/` | sonnet |
  | `warpgate` | role | `warpgate-prompt/` | opus |
  | `codeweaver-reviewer` | minion | `codeweaver-reviewer/` | sonnet |
  | `flowrider-reviewer` | minion | `flowrider-reviewer/` | sonnet |
  | `siegemaster-reviewer` | minion | `siegemaster-reviewer/` | sonnet |
  | `siegemaster-walker` | minion | `siegemaster-walker/` | sonnet |
  | `chaoswhisperer-gap-minion` | minion | `chaoswhisperer-gap-minion/` | sonnet |

  **The three operator roles brief GENERIC sub-agents for the work itself.** A sub-agent that edits a file is a
  `general-purpose` agent its operator briefs in its own words, against a map that operator wrote. Only the sub-agents
  that must fetch a quest and read git on their own carry a served prompt: each operator's own reviewer, and
  `siegemaster-walker`, which drives a live system and needs the measurement discipline every time.

  Two shared blocks are interpolated into those prompts rather than repeated:
  `standardsReviewConcernsStatics.markdown` — the five standing quality concerns, in all three reviewers — and
  `flowEvidenceContractStatics`, whose `authoringMarkdown` half goes into the flowrider PROMPT and whose judging half
  goes into `flowrider-reviewer`.

  The valid names are the `agentPromptNameContract` enum; `agentPromptClassificationStatics` classifies which are
  parent-summoned minions vs orchestrator-dispatched relay roles, and carries `operatorRoleNames` — the three roles
  that own an operation item and brief sub-agents for it, read by the prompt renderer and the signal-back gate rather
  than listed at each call site. `agentNameToPromptTransformer` is an exhaustive TABLE mapping each name to its statics
  + model; **nothing is interpolated there**, because each prompt holds its own text, and a
  `satisfies Record<AgentPromptName, unknown>` is what fails the build when a name is added without a prompt behind it.
  `tavernkeeper-prompt-statics.ts` is deliberately absent from all three lists: the follow-up chat is served by the chat
  prompt path (`chatPromptBuildTransformer`), not by `get-agent-prompt`. There are no `.claude/agents/*.md` files for
  these agents.

  A relay work-item role calls `get-agent-prompt({agent, questId, workItemId})` — the responder resolves the work item's
  linked operation item (its `operations/<id>` ref) and substitutes FOUR IDS into the prompt: the quest, the work item,
  the operation item, and that operation item's TEXT. **No quest CONTENT is served with them.** The flow, the contracts
  and the units are each their own `get-quest` / `get-qa-checklist` call, spelled out in the role's own prompt, and the
  flow id and package name those calls take are inside the operation item's text (`… — package: <name> · flow: <id>`).
  Three role-specific extras ride along, and each is a value no tool call returns: `Dev Server Command` /
  `Dev Server URL` for siegemaster, `Base branch` for warpgate, and
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

Every statics file in this package holding agent-facing markdown — the three `<role>-prompt-statics`, the three
`<role>-reviewer-statics`, `siegemaster-walker-statics`, `chaoswhisperer-gap-minion-statics`,
`standards-review-concerns-statics`, `flow-evidence-contract-statics`, and the bespoke `spiritmender` / `warpgate` /
`dumpster-*` prompts — is **TEXT INJECTED INTO A MODEL'S CONTEXT WINDOW.** It is not documentation, not a README, and
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

`standardsReviewConcernsStatics` lands in all three reviewer prompts and
`flowEvidenceContractStatics` splits across the flowrider prompt and its reviewer. An edit to either
is unfinished until every prompt that reads it still agrees with it. A question only ONE kind of
reviewer asks belongs in that reviewer's own prompt, never in the shared block — a block that hedges
across three readers serves each of them answers it cannot use.

### 4. Check the RENDERER before promising a session what it will be handed

A prompt that enumerates what a session receives is a claim about a transformer. **`workItemToPromptTransformer`
serves FOUR IDS and three conditional extras — nothing else** — so a prompt sentence pointing at anything wider than
that names a block no session will find. What a role fetches for itself is `get-quest` / `get-qa-checklist`, and each of
those gates blocks on non-emptiness too. **Trace the render for the DEGENERATE case** — no flow, no package, no
contract, an empty diff — never the happy one. Two of the extras are conditional: siegemaster gets no dev-server lines
where `.dungeonmaster.json` declares no `devServer`, and spiritmender gets no ward lines where no `wardResult` has a
non-zero `exitCode`.

### 5. Validate by DRY-RUNNING the prompt against a real quest

**Reading a prompt tells you whether it is coherent. Only a dry run tells you whether it works.**
Pick a live quest, take a real `operationItemId` off its ledger, and walk the prompt as that role
against what the tools actually return: `get-quest`, `get-qa-checklist({ questId, operationItemId })`, and the four ids
the transformer substitutes. Do it for EVERY ROLE the change touches — the three
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
  │   The operations ledger drives the order. BOTH quest types run the same sequence:
  ├─ riftcarver ──── mcp__dungeonmaster__run-riftcarver({questId, workItemId}); spawnerType: 'command'.
  │                   Carves the branch + worktree, pins baseRef from the new tree's HEAD, mirrors
  │                   node_modules, runs the preflight build. Streams live; log persisted to
  │                   riftcarver-results/<id>.log. Nothing else can run until it goes green.
  ├─ codeweaver ──── ONE SESSION PER (PACKAGE, FLOW) CELL — one package's half of one flow;
  │                   product code plus the unit tests that prove it
  ├─ ward (changed)─ mcp__dungeonmaster__run-ward({mode: 'changed'}); spawnerType: 'command'
  ├─ flowrider ───── ONE SESSION PER FLOW; the test suites that prove that flow, in the browser and
  │                   below it
  ├─ siegemaster ── ONE SESSION PER FLOW; hand-driven QA of that flow against a running system
  ├─ ward (full) ─── mcp__dungeonmaster__run-ward({mode: 'full'}); spawnerType: 'command'
  │
  │   Each of those three agent roles is an OPERATOR: it reads code, briefs sub-agents to change it,
  │   reads what changed, and summons its own reviewer — which builds, wards, commits and pushes.
  │   There is no standards-review role on the ledger: the five standing concerns are taken by that
  │   reviewer, inside the operator's own turn, before it commits. See "How an operator session
  │   works" and "Minions".
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
  `relayTailFanOutTransformer` per its `fanOutBy`. The ONE `codeweaver` seed (`fanOutBy: 'implementation'`) becomes
  the derived per-CELL codeweaver ledger this way — one item per (package, flow); the `flowrider` and `siegemaster`
  seeds (`fanOutBy: 'flow'`) become one item per quest flow each.
- **Runtime mutation** (`questOperationsUpdateBroker`, the ONLY runtime ledger writer): status transitions,
  duplicate-on-partial, and the ward and riftcarver failure splices. Execution
  agents have no ledger write path at all, ever — they read git + the ledger for context and signal an outcome.

**Nothing is appended to the ledger between two seeded items.** The ledger a quest starts with is the ledger it
finishes with, plus `pt N` continuations, the ward/riftcarver failure splices, and the one warpgate item a merge
appends after it has drained. In particular there is **no standards-review role on it at all** — see below.

### How an operator session works

The three operation-owning roles (`codeweaver`, `flowrider`, `siegemaster`) each own one operation item and run one
script, stated in full in that role's own prompt. **They read code. They never write it.** Sub-agents write it, and a
named reviewer commits it.

- **Codeweaver** (nine steps) reads the quest, explores its package, writes a MAP at
  `.quest-plans/<operationItemId>-map.md` — one line per file, grouped so that a group's files are disjoint — briefs a
  generic sub-agent per change, reads `git diff` against the flow, then runs a `codeweaver-reviewer`. It signs
  `codeweaverSignoff` on the observables its unit tests prove, then signals. Its cell is ONE package, and the two rules
  that keep it there are in step 2 and step 3: it reads `git log` for what the cells before it committed (library
  packages run first, so the helper it is about to brief may already be on the branch), and where a change needs
  behaviour from a sibling it MOVES that code into a package both can call rather than copying it or importing across.
  WHICH package that is is found through `get-project-map`, by KIND rather than by name: every repo picks its own name
  for it (`shared`, `shared-core`, `shared-ui`), so the `library` label the map prints is the only thing a prompt can be
  written against.
- **Flowrider** (ten steps) reads the flow, takes its denominator from
  `get-qa-checklist({ questId, operationItemId })`, reads the implementation to learn the exact value each unit
  claims, chooses a LAYER per unit (in a real browser, or below one), writes the same shape of map, briefs a
  sub-agent per test file, reads the diff, then runs a `flowrider-reviewer`. It signs `flowriderSignoff`.
- **Siegemaster** (ten steps) starts the dev server and owns it for the whole session, then loops: ONE
  `siegemaster-walker` drives one path through the flow and reports what it measured, generic FIXER sub-agents repair
  what it found, and a FRESH walker re-drives the same path from the reset state. A `siegemaster-reviewer` grades the
  repairs at the end. It signs `siegemasterSignoff`, and `reset-flow-signoffs` is its lever when a fix moves behaviour
  an earlier walk already cleared.

Eight things about that shape are load-bearing, and each is a measurement rather than a preference:

- **The operator reads code and dispatches; it never edits a file.** Its prompt carries a YOURS / NOT YOURS tool
  block. `Read`, `discover`, `get-project-map`, `get-project-inventory`, `get-folder-detail`, `get-architecture`,
  `get-syntax-rules`, `get-testing-patterns`, `git diff`/`status`/`log`, `Agent`, `modify-quest` and `signal-back` are
  YOURS. `Edit`/`Write` on any path but its own map, `npm run build`, `npm run ward` in every form, and every git verb
  but reading are NOT. That map is the ONE path Codeweaver and Flowrider may write; Siegemaster writes no file at all — its record
  is what the walkers report and what its reviewer commits — and its Dev Server Command and `reset-flow-signoffs` are
  its alone, added by the sections that name them.
- **It reads the DIFF, never the tree.** A session that reads whole files mid-loop stops dispatching and starts
  hand-coding. Two things hold that off: the scope is one package or one flow rather than a whole repo, and the
  reading step is `git diff` plus the specific files where two pieces meet — bounded by how much changed rather than
  by how much exists.
- **Sub-agents that write code get no prompt of their own.** The operator writes the brief, in its own words, against
  the map it wrote. Every brief is a FILE MAP plus terse instructions — pseudo-code, a type sketch, a "mirror this
  file" line. A paragraph of explanation is a paragraph the sub-agent skims, and long briefs are how adherence dies.
  Each brief quotes the observable **word for word from the quest**, never the operator's paraphrase: a sub-agent that
  builds against a paraphrase and reports against the same paraphrase passes while proving something else.
- **Changes touching different files go out in ONE message**, one `Agent` call each, so they run at the same time; the
  operator waits for all of them before the next group. Two changes touching the same file never go out together.
  Flowrider adds one more rule: never two browser walks against the same package at once, because Playwright writes
  one report path per package and the second run overwrites a report the first is still reading. Siegemaster runs
  exactly ONE walker at a time, always — there is one dev server and one reset lever, and two walks reset the state
  under each other with neither able to tell.
- **A sub-agent's brief carries `npm run ward -- --only lint,test -- <its own paths>`, and `typecheck` is deliberately
  out.** Ward runs typecheck as `tsc -b`, which builds and writes the shared `dist/`, so a wave of sub-agents running
  it at once hands each other type errors on correct code. The reviewer's `--staged` run is the typecheck. The
  `run-ward` MCP tool is a different command — it grades the whole branch and lands the red on the operator's work
  item — so no brief names it.
- **The REVIEWER runs `npm run build` and `npm run ward -- --staged`, and it is the ONLY session on the pass that runs
  either.** `tsc` writes one shared `dist/` per package, and ward's typecheck is `tsc -b`, which is a build under
  another name — so a second builder hands every sibling session type errors on correct code. The reviewer runs the
  pair AFTER it has read every file, so it reads looking for what a compiler cannot name; it runs the pair **twice at
  most**, the second run to check its own fixes; and a red still standing after that is its `NEXT: rework`, carrying
  the failing output word for word.
- **A red is diagnosed before it is fixed, because the cheap answer is invisible.** The reviewer re-runs the failing
  file ALONE with `git diff` still empty; if it passes there, that is a FLAKE, the file that went red is not the
  broken one, and it is **`NEXT: rework`, not a repair** — the cause is in a different file, so finding it is a piece
  of work rather than a step inside this pass. The `rework` line has to carry the isolation result and not just the
  failure, or the next session re-runs the suite, sees green and pays for it again.
- **The REVIEWER commits, ONCE, and then pushes — and nobody else does either.** No code-writing sub-agent commits
  anything: a group of them runs at once, and concurrent commits in one worktree collide on git's index lock —
  measured on twelve at once, three landed and nine died with `Unable to create index.lock`. So the pass reaches the
  reviewer entirely uncommitted, `git diff HEAD` plus the untracked files IS the pass, and the reviewer **enumerates
  before it commits** — commit first and that surface is empty. Then `git add -A`, one commit under
  `<role>: <what this pass made true>` with the whole return block in the body, `--allow-empty` where the pass
  genuinely changed nothing, and a bare `git push`, no `-u`, as the last thing it does. That commit is the pass's only
  durable record, and a later `pt N` session reconstructs the item from those bodies.

**Every decision the operator makes off a sub-agent's return is a LOOKUP.** Every sub-agent ends its return with one
line starting `NEXT:`, and the operator matches the first word: `pass` moves on, `rework` sends exactly what it named
back out, `wall` stops dispatching and sends the operator to its recording step and a `blocked` signal. A return with
no `NEXT:` line is read as `rework`. **Only the reviewer's line decides the pass** — a code-writing sub-agent saying
`rework` about its own change means send that change out again, not that the pass is over.

**The loop is unbounded and `partial` is not on an operator's signal table.** Another pass costs a pass. A `partial`
costs a whole fresh session that has to rebuild the remainder out of git to arrive back where this one already stood —
measured once at 101 minutes of wall clock for 11 minutes of work. The operator's prompt offers `done` and `blocked`
only.

**The reviewer takes the five standing concerns** — `craft`, `perf`, `dedup`, `integrity`, `test-cases`
(`standardsReviewConcernsStatics`, interpolated whole into all three reviewer prompts) — in the SAME reading pass it
takes its own questions in. They are GUIDANCE, not a ledger: nothing counts what a reviewer answers and no gate
refuses a signal over a concern nobody took. Dead code is deliberately absent from the five — whether an export still
has a consumer is a property of the whole import graph after later work lands, and no session can answer it from
inside its own scope.

**A `spiritmender` cannot be summoned by an operator** — it is a relay ROLE that owns a work item and whose terminal
action is `signal-back`, so as a sub-agent it would signal on its parent's operation item and complete that scope
mid-pass; `agentPromptGetBroker` refuses the fetch on the name. It arrives the only way it ever does: the ledger's own
`ward` item runs after the operator signals, and a red one splices it with the full detail blob.

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
  (from `questTypeRegistryStatics`) as pending operation items (locked, except the `codeweaver` seed, which mints
  unlocked so its pt chain stays unbounded — see below), force-completes any leftover chat-role intake items
  (`isChatWorkItemRoleGuard` — chaoswhisperer / glyphsmith / bughunt), and creates the first work item — all in one
  `questOperationsUpdateBroker` persist. **`startImplementationOps` leads with a `riftcarver` seed for BOTH quest
  types**, so the first work item this mints is always the carve, `spawnerType: 'command'`. It carries no `fanOutBy`
  (exactly one item) and no `locked` override (defaults true, which enrols it in `slotManagerStatics.riftcarver`'s
  budget), and it is excluded from the spine-packages fallback the other orchestrator-seeded items get: `packageNames`
  exists to narrow an AGENT's search, and a command has no prompt to narrow — writing the flow-tagged packages onto it
  would claim the carve builds only those, when what it prepares is the whole worktree. This broker also stamps **no
  `baseRef`**: it runs before any worktree exists, so the only HEAD it could read is the server process's own
  checkout, and riftcarver is the sole writer of that field.

  **`codeweaver` fans out BY (PACKAGE, FLOW) CELL** (`relayTailFanOutTransformer`, `fanOutBy: 'implementation'`, on
  `startImplementationOps` rather than `relayTail`): one item per cell, where a cell exists wherever a package tags at
  least one node on that flow, across BOTH flow types. Its text names both — `— package: <name> · flow: <id>` — which
  is what buys each cell its own pt chain and keeps each session's fetched flow slice to one flow. A package that tags
  nodes gets cells and NOTHING else; its contracts reach it through the `packageName`-only `get-quest` call, which
  routes contracts by PATH. The ONE flow-less item that survives belongs to a package that owns a contract (by
  `source`, or by an individual PROPERTY's `source`, since a contract is one-to-many) and tags NO node anywhere:
  `shared` routinely does exactly that, and without the item those contracts have no owner at all. Membership is "this
  package TAGS a node in this flow", so a glue node mints a cell on BOTH sides — a seam has two halves and each side
  builds its own. Cells are ordered by package KIND tier first (`packageBuildOrderStatics.tiers` — library →
  programmatic-service/mcp-server → http-backend → frontend-react/frontend-ink → cli-tool/hook-handlers/eslint-plugin),
  then `packageGraph` depth as a tiebreak WITHIN a tier, then name; a package's own cells follow the quest's flow
  declaration order. The tier ranks ahead of depth deliberately: manifest depth is Kahn's order over
  `package.json` edges, which is inverted across an HTTP seam — this repo's `server` depends on `@dungeonmaster/web`
  because it serves the built bundle, so raw depth would schedule the browser package's session before the backend
  route it calls exists. A package is ranked on its whole KIND SET at its earliest tier, never on the detector's single
  winning label. See `relay-tail-fan-out-transformer.ts` for the full membership/ordering logic.

  **`flowrider` and `siegemaster` each fan out to ONE ITEM PER FLOW THEIR OWN TRACK MEASURES** (`fanOutBy: 'flow'`),
  each carrying a single `flowId` and a text suffixed `— flow: <id>`. Per-flow items give each flow its own pt budget
  (the pt chain keys on role + base text, and the text carries the flow id) and its own scope. WHICH flows a seed is
  cut over is `signoffTrackEligibilityStatics.byTrack[role].flowTypes` — the same statics every denominator reader
  shares, so the ledger cannot mint an item whose work list computes as zero: siegemaster takes both flow types,
  flowrider `runtime` alone, and an all-operational quest seeds one siegemaster item per flow and NO flowrider item.
  With no eligible flow at all, the role keeps ONE whole-quest item only when `off-map` is in its `unitKinds` — the
  probe families are properties of the built system rather than of any drawn flow, so siegemaster keeps this quest's
  only security (`hostile-input`) and performance (`perf`) coverage owned, and flowrider gets nothing rather than a
  session dispatched against an empty denominator. Seeding is idempotent: a re-Start detects the already-seeded verify
  tail (a locked `role: ward` item) and skips straight to the status transition.
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
`pausedAtStatus` on resume. ChaosWhisperer runs the entire spec lifecycle; the orchestrator drives the operations relay
entirely within `in_progress`.

Gate content (`questGateContentRequirementsStatics`, enforced by `has-quest-gate-content-guard`):

- `flows_approved`, `approved`, and `design_approved` each require non-empty `flows` — nothing else. `approved`
  demands no ledger item: the codeweaver ledger is DERIVED at Start (`fanOutBy: 'implementation'`), so coverage is
  definitional rather than checked — a quest that clears `flows_approved` already carries every input the generator
  reads. What IS checkable lives in `questSaveInvariantsTransformer` as "Contract Source Coverage": a contract's
  `source` must resolve to a declared package, or the package item it should have minted at Start never exists. That
  check applies to BOTH quest types, because both derive their implementation ledger the same way.

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
| `flows_approved`      | User approves flows (Gate #1)                   | Can add: observables, contracts, tooling, packagesAffected              |
| `explore_observables` | ChaosWhisperer (Phase 4 entry)                  | Can add: observables, contracts, tooling, packagesAffected              |
| `review_observables`  | ChaosWhisperer (Phase 4 exit)                   | User reviews observables, APPROVE visible                               |
| `approved`            | User approves (Gate #2)                         | Spec locked. `start-quest` or `explore_design` allowed                  |
| `explore_design`      | Glyphsmith starts design work                   | Create prototypes, iterate on designs                                   |
| `review_design`       | Glyphsmith ready for design review              | User reviews designs, APPROVE button visible                            |
| `design_approved`     | User approves designs                           | Design locked. `start-quest` allowed                                    |
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
  phase — it authors no operation items; those are DERIVED later, at Start Quest, from the flow nodes' package tags
  and the contracts' source paths
- **Codeweaver** reads the observables filtered to its own package on its own flow as its acceptance targets, and signs the ones its
  unit tests prove
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

A quest carries a `questType` (`feature` | `bug-hunt`, default `feature`). `questTypeRegistryStatics`
(`@dungeonmaster/shared/statics`) is the single source of truth per type — its intake slash command, create-time seed
role (`initialWorkItemRole`), Start-Quest relay seed (`startImplementationOps` + `relayTail`), and the execution
`roles` it uses. `orchestration-start-responder` seeds every type through the SAME `questBuildRelayGraphBroker`, which
reads the registry entry for `quest.questType`.

**THE TWO TYPES SHARE ONE RELAY.** Both carry:

- `startImplementationOps` = the `riftcarver` seed, then one `codeweaver` seed with
  `fanOutBy: 'implementation'`, `locked: false`
- `relayTail` = `ward(changed)` → `flowrider` (`fanOutBy: 'flow'`) → `siegemaster` (`fanOutBy: 'flow'`) →
  `ward(full)`
- `roles` = `riftcarver, codeweaver, ward, flowrider, siegemaster, spiritmender`

`questTypeRegistryStatics`' colocated test asserts that equality directly, so a change to one type's relay that is not
made to the other fails there.

**`startImplementationOps` leads with `riftcarver` for BOTH types**, and that placement is the whole design: the
branch, the worktree, the `node_modules` mirror and the preflight build are the HEAD of the relay, so the workspace is
forged when the quest is next in line rather than the moment its spec is approved — and Start Quest stays a
millisecond status flip. The seed carries no `fanOutBy` (exactly one item) and no `locked` override (defaults true,
enrolling it in `slotManagerStatics.riftcarver.maxRetries`).

**There is no blight-review role in either list, and none is appended to it either**: the standards concerns are taken
by the reviewer each operator summons, inside that operator's own turn, before it commits. The registry's own comment
says so at the point where such a seed would otherwise sit, so the absence reads as a decision rather than an
omission.

What differs between the two types is the INTAKE, and nothing else:

- **`feature`** (`/dumpster-create`): `initialWorkItemRole` = `chaoswhisperer`.
- **`bug-hunt`** (`/dumpster-hunt`): `initialWorkItemRole` = `bughunt`, so `create-quest` seeds a `bughunt` intake
  operation item + work item exactly as `feature` seeds a `chaoswhisperer` one. That work item is where the intake
  session's `sessionId` lands, which is what gives the browser chat panel a session to hook onto during the hunt.
  `bughunt` is a CHAT role (`workItemRoleStatics.chat`).

  Bug-hunt reuses the flow/observable spec lifecycle, in the shape **ONE FLOW PER BUG**: each flow is the reproduction
  path run once, forking at its last shared node (two outgoing edges labelled `today` / `after fix`) into two terminal
  nodes whose LABELS carry the indicator — `ACTUAL: <symptom today>` and `EXPECTED: <what the fix must make real>`.
  The observables sit on the EXPECTED side, never on ACTUAL — an observable is a positive expectation, so one on the
  broken branch asks for a test that asserts the bug. Each becomes one failing test, written by the CODEWEAVER session
  that owns the package the fix lands in. The prefixes are a LABEL convention, not a contract field: `flowNodeContract`
  carries id/label/type/packages/observables and has nowhere else to put them, so the prompts that write them and the
  prompts that read them must spell them identically; nothing typechecks it and the colocated prompt tests are the
  only thing holding it.

Each type owns its COMPLETE relay via its registry entry. Adding a type = one `questTypeRegistryStatics` entry + the
type added to `questTypeContract`.

## Agent Roles

Every relay role is one operation item → one work item → one agent session. **For the three operator roles that
session does not write the work itself** — it reads code, briefs sub-agents, and summons a reviewer (see "How an
operator session works"). An agent does its work, then signals `complete` with an `operationStatus` (`done`,
`partial`, or `blocked`); the orchestrator applies the outcome to the ledger and advances. Agents have **no failure
signal for work they could have done** — they fix their own problems and move forward; `blocked` is reserved for an
environment wall outside their reach and halts the quest for the user rather than spawning a successor that hits the
same wall. The other failure concept is a **COMMAND role's exit code**: a **ward red** (`quest-run-ward-broker`)
inserts a spiritmender + a fresh ward and blocks once the ward retry budget is spent, and a **riftcarver red**
(`quest-run-riftcarver-broker`) routes by failure class — a repairable red inserts a spiritmender + a fresh `pt N`
carve, while a git-state or permission red blocks on the spot. Quest status is then derived from work-item + operation
state.

The relay role set per quest type is `questTypeRegistryStatics[type].roles`. The `agentRoleContract` enumerates the
Claude-dispatched agent roles (`codeweaver`, `flowrider`, `siegemaster`, `spiritmender`, `warpgate`) — the first three
are `agentPromptClassificationStatics.operatorRoleNames`; `spiritmender` and `warpgate` keep bespoke prompts and brief
nobody. No minion name is ever also a role, since `agentPromptClassificationStatics.roleNames` and `.minionNames` are
DISJOINT (see "Minions" below); the broader `workItemRoleContract` (shared) adds the two COMMAND roles (`ward` and
`riftcarver`) and the four interactive CHAT roles (`chaoswhisperer`, `glyphsmith`, `bughunt`, `tavernkeeper`) a work
item may carry. Those four ARE the `workItemRoleStatics.chat` tuple, and `isChatWorkItemRoleGuard` is the one
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

| Role           | Dispatched By                                                                                                           | Operation outcome                        | Quest writes (modify-quest)                                                                     |
|----------------|-------------------------------------------------------------------------------------------------------------------------|------------------------------------------|--------------------------------------------------------------------------------------------------|
| ChaosWhisperer | `/dumpster-create` (interactive)                                                                                        | N/A (spec)                               | full spec surface (flows, observables, contracts, packagesAffected) — never `operations`         |
| Glyphsmith     | startDesignChat (interactive)                                                                                           | N/A (design)                             | status                                                                                           |
| Tavernkeeper   | follow-up chat (interactive, AFTER the quest ends)                                                                      | N/A (chat; no operation item)            | none                                                                                             |
| riftcarver     | `/dumpster-launch` via `run-riftcarver` MCP tool, or the Node loop in-process (command); ALWAYS the ledger's first item | exit code (green / repairable / blocked) | none (broker writes `branchName`/`baseBranch`/`worktreePath`/`baseRef` + riftcarverResults + item status) |
| codeweaver     | `/dumpster-launch` via Task() (ONE SESSION PER CELL). OPERATOR — product code + its unit tests                          | complete (done / blocked)                | `codeweaverSignoff` per observable it proved, plus additive spec edits                           |
| ward           | `/dumpster-launch` via `run-ward` MCP tool (command)                                                                    | exit code (green / red)                  | none (broker writes wardResults + item status)                                                   |
| flowrider      | `/dumpster-launch` via Task() (ONE SESSION PER FLOW). OPERATOR — the test suites that prove that flow                   | complete (done / blocked)                | `flowriderSignoff` per unit, plus additive spec edits                                            |
| siegemaster    | `/dumpster-launch` via Task() (ONE SESSION PER FLOW). OPERATOR — hands-on QA against a running system                    | complete (done / blocked)                | `siegemasterSignoff` per unit, plus additive spec edits; `reset-flow-signoffs` appends a `walk-reset` note |
| spiritmender   | `/dumpster-launch` via Task() (inserted on a ward red, or on a REPAIRABLE riftcarver red). Bespoke prompt                | complete (done / partial / blocked)      | none                                                                                             |
| warpgate       | dispatched like any relay role, but its item is appended at MERGE time (see below). Bespoke prompt                       | complete (done / partial / blocked)      | none                                                                                             |

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

**Riftcarver also PUSHES, once, right after it records the git context.** `git push -u origin <branchName>`, with its
own done-check (`git rev-parse @{upstream}` succeeding means a prior attempt already did it, and the step emits
`— skip push … —`). Doing it at carve time is what removes the decision from everywhere else: `@{upstream}` resolves
from the moment the quest exists, so every later push is a bare `git push` with no `-u` for any session to get wrong,
and `get-blight-checklist({ scope: 'unpushed' })` always has a range. A failed push classifies **`repairable`**, not
`git-state` — the worktree is fully built and holds every commit, so a spiritmender has somewhere to work and the
`pt N` retries only the publication; blocking there would halt a quest over a network blip. A permission-denied push is
caught first by `isPermissionDeniedErrorGuard` and blocks, because no fresh session talks an operator's credentials into
working.

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

**It lands on base with `git merge --squash`, so base gets ONE commit per quest.** A quest branch carries one commit
per pass of every operator that ran on it; every one of them records how the work was made rather than what the work
IS, and base keeps only the result. The intake merge at its step 2 (base INTO the quest branch) stays a real merge —
other direction, and its history matters while the quest runs. A squash records no merge parent, so git does not
report the branch as merged afterwards; nothing downstream reads that, because warpgate never pushes.

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

The three operators are NOT fixpoint roles. Each loops inside its own session until its reviewer returns `pass`, and
its prompt offers `done` and `blocked` only — writing a test, walking a path or landing a fix does not by itself earn
another session.

**Verification is measured, not asserted.** A flow decomposes into atomic **verification units**
(`get-qa-checklist` — every terminal, labelled branch, observable, and the seven off-map probe families), and each unit
carries THREE independent top-level sign-offs: `codeweaverSignoff` (is it proven by the unit test written beside the
code?), `flowriderSignoff` (is it proven by a test that walks the flow?) and `siegemasterSignoff` (does it hold when a
human drives the real system?). Each is `{ verdict, evidence, question?, workItemId, at }` with `verdict` one of
`confirmed | unconfirmable`. `get-qa-checklist({ questId, operationItemId })` derives the whole scope from the item —
the track, the flows and the packages — through `operationSignoffScopeTransformer`. That ID is the only argument a
caller needs, and it is the only correct way to ask: the derivation behind it is the SAME one the completion scope is
computed from, so the number a session reads and the number that measures it cannot drift.

**`track` is the DENOMINATOR, not the field.** `signoffDenominatorTrackContract` and `signoffTrackContract` are
separate enums that happen to hold the same three names today: a denominator that shares another role's field is
representable, and the day one lands the denominator list grows while the field list does not. Which units each
denominator covers is `signoffTrackEligibilityStatics.byTrack` — flow types, unit kinds, package kinds, the flow slice
rule and the observable provenances that track could ever have signed. Every track reads `flowScope: 'declared'` (an
item is measured on the flows it names) and `packageScope: 'intersection'` (an item owns every unit whose owning NODE
tags ANY of its packages, glue included — no track mints a seam item, so a glue unit a stricter reading dropped would
be owned by nobody). Only siegemaster carries `off-map` in its `unitKinds`, and flowrider alone is measured over
`runtime` flows only.

**EVERY UNIT ON A TRACK'S LIST ENDS ITS PASS CARRYING `confirmed` OR `unconfirmable`.** There is no third verdict, no
blank, and no wording anywhere that lets a session stop short: a unit still owed a test is work remaining under a loop
that has no cap, and a unit the track cannot settle at any layer is `unconfirmable`. **No operator prompt may contain
wording that reads an unsettled unit as a finished outcome** ("leave it unsigned", "you did not get to it", "nothing
refuses your `done`"); the pins in `flow-evidence-contract-statics.test.ts` keep those out.

**Nothing COUNTS sign-offs, and no gate may be added that does.** A check refusing a `done` over an absent sign-off
pressures a session into a verdict it cannot back, which is worse than the gap it closes. The rule above plus "never
sign a unit you did not settle" is what holds the line. What the sign-offs buy is a durable, per-unit record of what was
proved and by what evidence, readable by the next session and by the quest summary — `confirmed` needs a
`file:line` and the wrong value that turns it red, or the value measured off the running system; `unconfirmable` needs
what was tried plus `toSettle`.

**`toSettle` is an INSTRUCTION, never a question.** It is the action that would settle the unit — "drive a real send
through a live quest and read the session JSONL for a Read call on the written path" — and the contract refuses an
`unconfirmable` without one. A question hands the next session something to answer where it needed something to do.

**No track audits another track's tests, and none may be told to.** Flowrider proves every `[ ]` unit on its own
checklist whatever marks the graph carries beside it — a sign-off from another track never shrinks a denominator.
Grading someone else's evidence to decide whether a unit still counts trades certain coverage for a guess, and the guess
fails silently: judging a mocked assertion "real" drops that unit from the last track that would have caught it.

**A measured defect is a NEW observable, not a verdict.** An observable is a positive expectation, so its inverse
("send `bleh` and the server crashes instead of returning 400") is ADDED to the flow through the additive spec
authority every operator holds, and then carries its own sign-offs. Provenance is a separate axis: `addedBy` on the
observable (`spec | chaoswhisperer | codeweaver | flowrider | siegemaster | operator`) answers "was this in the spec at
approval, or added mid-quest, and by whom", and `observableOrigins` is what stops a track being measured on work that
did not exist while it ran.

**`quest.planningNotes.questNotes[]` is the durable side channel** — `{ id, kind: 'open-question' | 'tooling-error' |
'out-of-scope' | 'walk-reset', role, workItemId, flowId?, unitId?, summary, detail, at }`. A note NEVER closes a unit;
only a sign-off does.

**Siegemaster's track has a reset lever.** `reset-flow-signoffs` clears `siegemasterSignoff` across ONE flow and
appends a `walk-reset` note; the other two tracks are untouched. Sign-offs written before a mid-session fix describe a
system that has since changed, so the operator resets and re-walks. Resets are free within a session — they cost no
pt-chain attempt.

**The standards-review surface has its own tool family**, and it is NOT a role's denominator. A diff decomposes into
review units (`get-blight-checklist` — every changed impl file, its test/proxy/stub companions collapsed onto it,
crossed with each of FIVE concerns). Its scopes answer five different questions and are not interchangeable:
`working-tree` (everything since `HEAD` that is not yet committed, untracked additions unioned in — the only scope
that sees an uncommitted pass), `unpushed` (`@{upstream}..HEAD`), `commit` (`HEAD~1...HEAD`), `quest` (from the pinned
`baseRef`, the whole branch), and the server-only `since-ref`, which takes a caller-supplied base and is not exposed
through MCP.

Each locked (verify-tail) role's pt chain is bounded by `slotManagerStatics.<role>.maxAttempts`; a spent chain blocks
the quest instead of looping. The two COMMAND roles hold `maxRetries` keys instead (`ward`, `riftcarver`), because
their chain is counted off the ledger's own role-filtered history — the operation items since the last GREEN run —
rather than off one item's pt continuations. Every dispatched role needs a key of its own either way: the budget
ladder's final `else` hands an unnamed role spiritmender's budget, so a missing key mis-budgets silently rather than
erroring. A chain is keyed on role + base text — so **every one of these budgets is bought by what the item's TEXT
names**, and a role whose siblings share one sentence shares one budget across all of them. `flowrider` and
`siegemaster` each hold one item PER FLOW, and because each carries the flow id in its text, each flow gets its own
budget. A `codeweaver` item is minted UNLOCKED, so its chain is unbounded: the flows are the acceptance target and the
work has to land. A `pt N` continuation copies the item's `flowIds` AND its `packageNames` so the fresh session keeps
that scope — a continuation that lost either would silently work the whole quest instead of the remainder. See "Signal
System" + "Failure handling".

### Minions (parent-summoned sub-agents)

**There are FIVE minion names** (`agentPromptClassificationStatics.minionNames`), and they are the only sub-agents with
a served prompt:

- **`codeweaver-reviewer`**, **`flowrider-reviewer`**, **`siegemaster-reviewer`** — one per operator role. Each reads
  the quest, works out what changed from git, opens every file the pass produced IN FULL (not the diff — the file, which
  is what finds the false green a diff hides), takes the five standing concerns in the same reading pass, fixes what is
  small and clearly its own, runs `npm run build` and `npm run ward -- --staged`, commits the whole pass ONCE and
  pushes. Each grades a different subject and asks a different question of it: codeweaver's grades product code against
  the flow; flowrider's grades whether a test BITES, and takes the judging half of `flowEvidenceContractStatics`;
  siegemaster's grades REPAIRS, where the failure shape is a change that makes the symptom go away without touching what
  produced it — a widened type, a swallowed error, a defaulted value, a loosened assertion.
- **`siegemaster-walker`** — drives ONE path through a flow by hand against the running system and reports what it
  measured. It changes nothing, which is why it has a prompt at all: its parent's rule is that no sub-agent prompt
  writes product code. What it needs that a brief should not carry every time is the measurement discipline — the
  reset, the expected-value-first order, the branch coverage, the `BROKEN WOULD SHOW` record and the browser traps. It
  stops only where it physically cannot go on; anything else it notes and keeps walking, so one pass surfaces the whole
  path.
- **`chaoswhisperer-gap-minion`** — the one minion outside an operator's session. It runs in the SPEC phase, before any
  operation item exists, and validates spec completeness before approval.

**A reviewer is the last agent in its chain.** It calls no `signal-back` and starts no sub-agent of its own — a
grandchild would produce conclusions nobody reads, because the parent checks the minion's own output and not a
grandchild's summary. A walker is a leaf for the same reason.

**Every minion fetches with `{ agent, questId }` and NO `workItemId`.** That fetch hands back its prompt, its Quest ID
and nothing else — no operation item, no ledger, no flows, no packages. Everything narrower reaches it through its
parent's brief: a reviewer gets an `OPERATION:` line naming the operation item id (or a `SWEEP:` line naming the paths
`git status` listed), and a walker gets `FLOW:`, `PATH:`, `SERVER:`, `RESET:` and `UNITS:`.

`roleNames` and `minionNames` stay DISJOINT, and the mechanical stakes are what enforce it: a minion added to
`roleNames` would widen `agentRoleContract` with a role no operation item can ever hold, and a role added to
`minionNames` would let it fetch without a `workItemId` and escape `subagentStopNeedsBlockGuard`, which is what holds a
work-item session open until it signals.

Minions are NOT work items and NOT operation items, and they never signal back — a pass lives inside the parent's turn,
observable under the parent's chain via wire-level toolUseId correlation. **Every named minion runs on `sonnet`**,
fixed in `agentNameToPromptTransformer` rather than inherited from the parent: a minion arrives with its scope already
narrowed by the brief that summoned it, and its parent is the opus session that decided that scope.

**The three OPERATOR roles run on `opus`** (`roleToModelStatics`, which is what the CLI `--model` flag resolves
through — `buildSpawnInstructionLayerBroker` sets no model, so `spawn-one-agent-layer-broker` falls through to it for
every real dispatch). Each of them reads code: it plans what it hands out, judges what comes back against the files it
opened, and decides whether its scope is done — none of which is a lookup. `spiritmender` is sonnet, because it repairs
against a ward blob that names the failures for it; `warpgate` and the four chat roles are opus. The `model` field on
`agentNameToPromptTransformer`'s result is a SEPARATE value that `get-agent-prompt` reports, and it reads the same map
so the reported model cannot drift from the spawned one.

**Fix authority is delegated, not withheld.** A reviewer that finds a small hole in the pass may close it — forbidding
that defers a one-line fix downstream and makes the next session re-derive it. What it hands up instead of taking goes
in `NEXT: rework` with what it is and where: anything structural, anything crossing into work the parent did not
assign, and anything needing a decision. `NEXT: wall` is reserved for an ENVIRONMENT wall no session of any role could
pass, because that one halts the whole quest.

**No minion asks the user anything.** A minion runs inside its parent's turn, so no human sees its questions and nothing
resumes it with an answer — a decision it cannot make itself goes up as `NEXT: rework`, and one it can make it makes.

**Git belongs to the reviewer.** It commits the whole pass and pushes it, and nothing else on the pass touches git as
a writer at all. **Every session on a pass is banned from every destructive verb** — `stash`, `reset`, `checkout --`,
`clean`, `rebase` — on a branch several sessions share, where the parent cannot see what went missing, and the
reviewer's are the more dangerous because the whole pass is still UNCOMMITTED when it arrives. The reviewer's own
commit and its bare `git push` are the one exception to the ban. Prompts are advisory about that last part; a
`PreToolUse` guard in `@dungeonmaster/hooks` is the only thing that would actually prevent it, and that is not built
yet.

## Signal System

Agents report via the `signal-back` MCP tool. `complete` is the SOLE signal kind — a session-terminal marker. The
operation OUTCOME rides on the same call as `operationStatus` (`signalBackInputContract`: `signal: 'complete'`,
`operationItemId?`, `operationStatus?: 'done' | 'partial' | 'blocked'`, `blockedReason?` — `failed` is explicitly
rejected). The live handler is `quest-handle-signal-back-responder.ts`, which applies the outcome server-side
(authoritative — an agent cannot forget to patch the ledger, because agents never write it).

**One gate runs BEFORE any mutation**, and it THROWS rather than returning — the error rides the awaited `signal-back`
path back through the MCP tool to the agent, where it is visible and actionable, instead of being swallowed as a
success. Because nothing is persisted on a refusal, the session simply fixes what the message names and signals again;
the work item and its operation item are exactly as they were.

**Commit-before-signal gate — on `done`, `partial` AND `blocked` alike.** For every role that changes code
(`CODE_CHANGING_ROLES` = `agentPromptClassificationStatics.operatorRoleNames` plus `spiritmender` and `warpgate`), the
responder resolves the quest's cwd and refuses while the worktree still carries uncommitted changes. The measurement is
`gitWorkingTreeFilesBroker`, which unions `git diff HEAD --name-only` with `git ls-files --others --exclude-standard`:
a bare diff reports TRACKED paths only, so the net-new files a sub-agent just wrote — the ones most likely to carry the
defect — would be invisible and a dirty tree would read as clean. The question is **"is the tree clean", never "did you
make a commit"**: `git commit --allow-empty` satisfies it, so a pass that legitimately changed nothing still signals. A
quest with no worktree of its own (hydrated, or seeded before worktrees) SKIPS the check rather than failing it — that
is a real state, not a violation. Both COMMAND roles are absent because they are terminal by exit code and never reach
`signal-back` at all; every chat role is absent because a conversation produces a spec, not a commit. Membership is
READ from `operatorRoleNames` rather than listed, so a fourth operator role is covered the day it is added — the same
reason `isChatWorkItemRoleGuard` reads `workItemRoleStatics.chat` instead of growing an `||` chain.

This is a computed gate rather than a line in the operating rules because the prose version was measured and found
wanting: a session died ONE gate short of its commit holding a fully verified, twice-green artifact, the re-carve
destroyed it, and the slice cost 101 minutes of wall-clock for 11 minutes of real work with no trace in `quest.json`
that any of it happened. It binds `blocked` too — a blocked quest hands its work forward through git exactly as a
finished one does, so the outcome that halts is the one that most needs the work durable first.

**The gate is satisfied by construction rather than by the operator's own commit.** Each operator's reviewer commits
the pass, so a dirty tree at signal time is either scratch a sub-agent left behind or work that reviewer did not
commit. The operator may not clear it by committing — it cannot judge what is sitting there — so its recording step
runs `git status` and hands every listed path to ONE more reviewer on a `SWEEP:` brief, which opens each path, deletes
what is scratch, keeps what is real, and commits under `sweep: <what survived>`. **A sweep goes to a REVIEWER, never to
a code-writing sub-agent**: deciding a path is scratch and leaving it out of the commit are one judgement. Still dirty
after that, a SECOND sweep reviewer is told to commit every remaining path whatever it is, under
`sweep: uncommitted remainder` — a commit always clears the tree, which is what gets the operator to a state it can
signal from.

Then, in order:

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
runs before the gate above, a redelivery never pays its git cost either. Afterwards
`questAdvanceBroker` creates the next work item — except on the two halt routes (`blocked`, spent pt chain), which block
instead of advancing.

The `[WALL]` operating rule, carried inline in every role prompt under `## Operating rules`, is what teaches each role
to pick `blocked` over `partial` when the wall is environmental — and to check first whether the JOB has another route,
since a denied `grep`/`find` in this repo is answered by `Read` with an offset, `discover` or `python3 -c` rather than
by halting a quest. "No session could pass this" is a claim about a FRESH session: anything a re-dispatch clears is not
a wall.

### Failure handling

The orchestrator has THREE failure concepts, and each is owned by exactly one broker: **a ward exit-code red**
(`quest-run-ward-broker.ts`), **a riftcarver exit-code red** (`quest-run-riftcarver-broker.ts`), and an agent's
**`operationStatus: 'blocked'`** environment wall (see "Signal System" step 5). There is no `failed`/`failed-replan`
agent signal for work an agent could have done.

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

- **carve green** → mark the riftcarver operation item complete, advance → the first `codeweaver` item.
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
`sessionId !== undefined && agentId === undefined`, and it does NOT consult the `resume` marker. Any
dispatchable work item carrying a session resumes it, whatever the role. Gating on the marker instead
fresh-spawns an item whose session was recorded but never formally reclaimed (a quest that blocked
before recovery reached it, a hand-repaired quest.json), and the new child's init line then overwrites
`sessionId` — silently orphaning a session that still holds real work. `agentId` is the ONE exception:
`get-agent-prompt` stamps it together with a `sessionId` that is the user's `/dumpster-launch` loop
session, not the agent's own. The `resume` marker is written purely as an audit record of "this item was
reclaimed". The resume prompt itself opens by telling the agent it was
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
  `webServer` that is torn down when an e2e run ends. It starts the server once, keeps it up for the session, and
  stops it only as it is about to signal. Several units measure a difference from a value only that process's lifetime
  provides — an uptime, a monotonic counter, an append-only log — so a restart mid-session destroys them for every
  later walk with nothing to show it happened. Its walkers and fixers are forbidden to start, restart or stop it.
  Teardown is a scoped kill (port + cwd), never a blanket one, and **a server that will not start is Siegemaster's
  first defect, not a wall.**
- **Codeweaver and Flowrider are given no dev server and need none.** A Flowrider browser walk brings its own up from
  the project's Playwright config (`webServer`) and tears it down with the run, and its specs navigate
  `baseURL`-relative so no URL reaches the test. A missing `webServer` block makes every unit it blocks
  `unconfirmable`, not something any of these sessions authors — writing one is install-time scaffolding shared by
  every flow on the quest, and the sibling sessions work against the same tree.

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

- `operations` — off the allowlist entirely, at every status. No agent writes the ledger anywhere: the codeweaver
  ledger is DERIVED at Start (`fanOutBy: 'implementation'`), not authored by ChaosWhisperer, and every runtime
  mutation goes through `questOperationsUpdateBroker`, which bypasses this allowlist.
- `workItems` — server-only, managed by the advance / signal-back / ward / riftcarver brokers.
- `wardResults` — server-only, written by `quest-run-ward-broker`.
- `riftcarverResults` — server-only, written by `quest-run-riftcarver-broker`, one entry appended per carve attempt so
  a pt chain leaves its whole history rather than overwriting the attempt that failed.

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
| Server `orchestration-start-responder` | HTTP endpoint that the Web UI "Start Quest" button calls; mutates status and redirects to execute view. Does NOT spawn anything, and does NOT build anything — it is pure `quest.json` bookkeeping (startable gate, package graph, relay seed, status flip, queue entry) and touches no git, so the POST answers in milliseconds and the WebSocket-driven panel swap is immediate. The branch, worktree, `node_modules` mirror and preflight build are the `riftcarver` item it seeds at the head of the ledger. |

## Agents (MCP-Delivered)

Agents get their prompts dynamically via the `get-agent-prompt` MCP tool. The dispatch
surface (`/dumpster-launch`'s Task() invocations) hands each sub-agent a stub prompt that
says "call `get-agent-prompt({agent, workItemId, questId})` and follow its instructions exactly." The MCP responder
substitutes four ids (quest, work item, operation item, and the operation item's text) into the returned prompt — no
quest content, which each role fetches for itself — and stamps `workItem.sessionId` (parent UUID) +
`workItem.agentId` (sub-agent realAgentId) from MCP request metadata: Claude Code surfaces
`request.params._meta.claudecode/toolUseId` on every MCP call (the toolUseId of the
sub-agent's OWN MCP call, not the parent Task() dispatch id). The responder scans every
session's `subagents/agent-*.jsonl` file for an assistant line whose `tool_use.id`
matches — deterministically identifying the calling sub-agent race-free even when N
sub-agents call in parallel against the same MCP stdio child.

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
| `codeweaver-reviewer` | Codeweaver, once per pass, plus once per sweep | sonnet | Reads the quest and git, opens every file the pass produced IN FULL, asks whether the code does what the flow says, whether the pieces fit, whether each unit test BITES, and what is missing — plus the five standing concerns. Fixes what is small, runs `npm run build` and `npm run ward -- --staged` (twice at most), commits the pass ONCE and pushes bare. A LEAF: no sub-agents, no `signal-back` |
| `flowrider-reviewer` | Flowrider, once per pass, plus once per sweep | sonnet | The same shape, over a TEST SUITE. Its distinctive question is whether an assertion bites — for each one, what wrong value turns it red — and it takes the judging half of `flowEvidenceContractStatics`. A LEAF |
| `siegemaster-reviewer` | Siegemaster, once at the end of the loop, plus once per sweep | sonnet | The same shape, over REPAIRS. Its distinctive failure shape is a change that makes the symptom go away without touching the cause: a widened type, a swallowed error, a defaulted value, a loosened assertion. It re-drives nothing — a fresh walker does that. A LEAF |
| `siegemaster-walker` | Siegemaster, ONE at a time, always | sonnet | Drives one path through the flow by hand against the running system and reports what it measured. Changes nothing. Stops only where it physically cannot go on; everything else it notes and keeps walking. A fresh walker is what proves a fix, because the fixer's own claim is not evidence. A LEAF |

**Every minion fetches with `{ agent, questId }` and NO `workItemId`.** That fetch hands back its prompt, its Quest ID
and nothing else — no operation item, no ledger, no flows, no packages — which is why its parent's brief carries the
`OPERATION:` / `SWEEP:` line (a reviewer) or the `FLOW:` / `PATH:` / `SERVER:` / `RESET:` / `UNITS:` lines (a walker).

The relay roles that DO own a work item (`codeweaver`, `flowrider`, `siegemaster`, `spiritmender`, `warpgate`) fetch
the same way plus a `workItemId` — `get-agent-prompt({agent, questId, workItemId})`, see "Agent Roles".
`agentPromptGetBroker` THROWS on a role name that arrives without one, and on a minion name that arrives WITH one, so
the split is enforced from both ends. It refuses that second case **BY NAME** rather than letting it fall through to
the work-item branch, because a minion carrying a `workItemId` is held by `subagentStopNeedsBlockGuard` until it calls
`signal-back`, and the only item it could signal on is its PARENT's.

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
siegemaster is the role that needs it, since its walkers drive `ui-state` observables in a real
browser.

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
