# Web Package - Claude Session Guide

## Chat-line translation: this package does NOT own it

The web is a **renderer**, not a translator. Chat entries arrive over WebSocket already
fully structured as `ChatEntry[]` from `@dungeonmaster/shared/contracts`. The web reads
the typed objects and renders them. **Do NOT parse raw stream-json, Claude CLI output,
JSONL lines, XML, or any other format on the web.** That logic lives in the orchestrator.

See `packages/orchestrator/CLAUDE.md` for the full translation funnel.

### What the web IS responsible for

- **Rendering.** React widgets that display a `ChatEntry` flatly, with sub-agent
  activity collapsed under a `SubagentChainWidget` (the one remaining grouping).
- **Grouping/layout.** `collectSubagentChainsTransformer`, `mergeToolEntriesTransformer`
  — these are pure rendering concerns: they take `ChatEntry[]` and decide how to lay them
  out. They don't parse; they restructure already-typed data.
- **User input.** Sending chat messages, clarification answers, etc., via HTTP.
- **Session routing.** URL state, session ID → active chat binding.

### What the web does NOT do

- Parse stream-json lines. (There used to be `parseUserStreamEntryTransformer`,
  `parseAssistantStreamEntryTransformer`, `mapContentItemToChatEntryTransformer`,
  `mapUsageToChatUsageTransformer`, `normalizeAskUserQuestionInputTransformer`, and
  `streamJsonToChatEntryTransformer` in `packages/web/src/transformers/`. They all live
  in the orchestrator now. Don't recreate them here.)
- Decode XML like `<task-notification>`. The orchestrator parses these into structured
  `task_notification` ChatEntries before they ship.
- Filter content. The orchestrator already strips empty-thinking items, redacted blocks,
  etc. If you find yourself writing `if (entry.content === '')` to hide an entry, ask
  whether it should be filtered upstream instead.
- Validate wire format. Entries are already `chatEntryContract`-validated by the orchestrator.
  The web can `safeParse` as a defensive check but shouldn't be transforming shapes.

### WebSocket message contracts

```
chat-output   { chatProcessId, entries: ChatEntry[] }
chat-complete { chatProcessId, exitCode, sessionId }
```

The binding (`useSessionChatBinding`) appends `entries` directly to React state — there's
no transformation layer between WS and the renderer.

**Sub-agent correlation arrives pre-converged.** The orchestrator stamps the Task's
`toolUseId` as the wire-level `agentId` on the Task's ChatEntry AND on every sub-agent
line (streaming via `parent_tool_use_id`, file via a realAgentId → toolUseId translation
map in the processor — see `packages/orchestrator/CLAUDE.md` → "Two-source sub-agent
correlation"). The web just renders: do NOT reconcile agentIds after delivery, do NOT
add special-case logic for "real" internal sub-agent agentIds (the orchestrator would be
leaking a shape the web is not supposed to see), do NOT add a `chat-patch` WS handler.

### Sub-agent chain grouping uses toolUseId as the wire key

`collectSubagentChainsTransformer` and `indexSubagentEntriesTransformer` key on the
Task's `toolUseId`. The Task's `tool_result` entry is pinned to its chain by matching
either `e.agentId === task.agentId` or `e.toolName === task.agentId` — the latter path
covers the completion tool_result line where no parent_tool_use_id exists to stamp
agentId via the convergence.

### If you need a new field or variant

1. Add it to `chatEntryContract` in `@dungeonmaster/shared/contracts/chat-entry/`.
2. Update the orchestrator's `map-content-item-to-chat-entry-transformer.ts` (or add a new
   transformer the orchestrator's `chat-line-process-transformer.ts` calls) to produce the
   new shape.
3. Add a rendering branch in the web's `chat-message-widget.tsx` (or a new widget).
4. Add a stub in `@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub.ts` for tests.

### Critical Rules

- **Web ONLY uses session ID, NEVER quest ID.** Session ID is the sole routing/comms
  identifier for the frontend. Quest correlation happens backend-side via
  `questCreatedSessionBy` on the quest contract. Do NOT add quest ID to web brokers,
  bindings, or widgets.
- **Dungeonmaster is a dev tool / AI orchestrator**, not a SaaS product. The web UI is an
  operational RPG-themed interface, not a product page. Pixel art RPG dungeon raid aesthetic
  is the core visual identity.

## Per-tool context numbers

The Claude API does NOT return a per-tool token count for tool results. The `usage`
object on each assistant message reports `input_tokens + cache_creation + cache_read +
output_tokens` for that one API call — per-message, not per-tool. So when one assistant
turn fires multiple tools (e.g. discover + discover + Bash all in one go), the API
gives us one combined input cost; we cannot split it per-tool without server help.

What this means for the UI:

| Surface                                             | Number shown                       | Why it's accurate                                                                                    |
|-----------------------------------------------------|------------------------------------|------------------------------------------------------------------------------------------------------|
| Tool row (`ToolRowWidget`)                          | `~X est` from result content chars | chars/4 of `tool_result.content` is per-tool and stable for relative comparison                      |
| Cumulative-context divider (`ContextDividerWidget`) | Cumulative + delta                 | Comes straight from `usage` on a single assistant entry (text or tool_use); one entry = one API call |

The chat list is flat — tool rows render inline alongside text and thinking entries,
with a `ContextDividerWidget` after each entry that has `usage` (text or tool_use). No
collapsible "tool group" wrapper. Sub-agent activity is the one exception: it stays
grouped via `SubagentChainWidget` because the Task tool_use lifecycle is a meaningful
unit, not a per-turn collapse.

Tool rows show `~X est` from chars/4 of `tool_result.content` — a per-tool estimate, NOT
a context delta. We do not put a context delta on tool rows because when one assistant
turn fires multiple tools, the API only reports one combined `usage` for that turn — the
delta cannot be split across tools. The cumulative-context divider after each entry with
`usage` carries the cross-API-call delta separately, where it can be attributed
correctly (one entry = one API call).

What we deliberately DO NOT do:

- Do not show the cumulative context as if it were a delta on the first message of a
  conversation. The divider omits the delta when there's no previous cumulative to diff
  against.

If you want a tighter per-tool number than chars/4, the only path is Anthropic's
`messages.countTokens` API — it requires a network round-trip per result, so it's
unsuitable for rendering many tool calls. Anthropic does not ship a public client-side
tokenizer for Claude 3/4. chars/4 is intentional.

Relevant files: `transformers/compute-token-annotations/`,
`transformers/estimate-content-tokens/`, `transformers/merge-tool-entries/`,
`widgets/tool-row/`, `widgets/context-divider/`,
`widgets/chat-entry-list/`, `widgets/subagent-chain/`.
