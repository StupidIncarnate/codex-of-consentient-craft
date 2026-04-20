# Server Package - Claude Session Guide

## Chat-line translation: this package does NOT own it

The server is a **relay**, not a translator. Raw Claude CLI output (stdout stream-json or
JSONL on disk) is translated into `ChatEntry[]` entirely by the orchestrator before it
reaches the server. The server's job is to broadcast those entries via WebSocket.

**If you're tempted to add string parsing, XML extraction, format decoding, or any logic that
turns a raw line into a structured shape — stop. That belongs in the orchestrator's
`chat-line-process-transformer`.** See `packages/orchestrator/CLAUDE.md` for the full funnel.

### What server WS broadcast events look like

```
chat-output   { chatProcessId, entries: ChatEntry[] }
chat-complete { chatProcessId, exitCode, sessionId }
```

The `entries` array is already fully-structured `ChatEntry` objects from
`@dungeonmaster/shared/contracts`. No further parsing is needed or allowed on the wire.

**Do NOT add a `chat-patch` message type** for late sub-agent agentId correlation. The
orchestrator converges streaming and file sources to produce identical ChatEntry shapes
before they ship (see `packages/orchestrator/CLAUDE.md` → "Two-source sub-agent
correlation"). If a new divergence appears, fix convergence at the orchestrator — not by
patching entries after delivery.

### What the server IS responsible for

- Subscribing to `orchestrationEventsState` and forwarding events to WS clients.
- Dual-tier routing: in-memory bus for transient events (chat-output, chat-complete),
  file outbox for persistent mutations (quest-modified).
- Pipeline `chat-output` batching (100ms) for agents with a `slotIndex` — the entries are
  already translated, batching is a throughput concern only.
- Dev-mode logging of WS traffic for debugging (see below).

## Dev-Mode Logging

All runtime observability logging in the server MUST go through the `processDevLogAdapter`. Do NOT use
`process.stdout.write` or `console.log` directly for dev diagnostics.

```typescript
import { processDevLogAdapter } from '../adapters/process/dev-log/process-dev-log-adapter';

processDevLogAdapter({ message: 'Chat started: questId=abc-123' });
// Writes "[dev] Chat started: questId=abc-123\n" when DUNGEONMASTER_ENV=dev
// No-ops otherwise
```

### When to Use

- WebSocket lifecycle events (connect, disconnect)
- Chat process lifecycle (spawn, stream, exit, stop)
- Server shutdown signals (SIGTERM, SIGINT)
- Any new endpoint or background process where runtime visibility matters during development

### When NOT to Use

- Error responses (those are already returned via HTTP status codes)
- Business logic validation (use guards and contracts)
- Production logging (this is dev-only, gated behind `DUNGEONMASTER_ENV=dev`)

### Activating Dev Logs

```bash
DUNGEONMASTER_PORT=4737 DUNGEONMASTER_ENV=dev npm run dev --workspace=@dungeonmaster/server
```

Without `DUNGEONMASTER_ENV=dev`, no log lines appear.

### Log Format

All lines are prefixed with `[dev]` for easy grepping. Orchestration events use structured formatting via
`devLogEventFormatTransformer` which parses inner JSONL and extracts meaningful fields:

```
[dev] 🌐 WebSocket client connected
[dev] ◂  chat-output  proc:e8c8ba78  system/init
[dev] ◂  chat-output  proc:e8c8ba78  system/hook_started  hook:9c526043
[dev] ◂  chat-output  proc:e8c8ba78  assistant/tool_use  Read  .../src/responders/init.ts
[dev] ◂  chat-output  proc:e8c8ba78  assistant/tool_use  Bash  "npm run ward -- --only unit"
[dev] ◂  chat-output  proc:e8c8ba78  assistant/tool_use  Agent  "Implement shared changes"
[dev] ◂  chat-output  proc:e8c8ba78  assistant/text  "Let me read the file."
[dev] ◂  chat-output  proc:e8c8ba78  assistant/thinking
[dev] ◂  chat-output  proc:e8c8ba78  user/tool_result  018HzYTL  ok
[dev] ◂  chat-output  proc:e8c8ba78  user/tool_result  01Hruna  error
[dev] ◂  chat-output  proc:e8c8ba78  rate_limit  allowed
[dev] ◂  chat-output  proc:1925f6f6  slot:0  assistant/tool_use  mcp__dungeonmaster__signal-back  quest:abc12345
[dev] 🔗 quest-session-linked  quest:89362ba3  chat:e8c8ba78
[dev] ✓  chat-history-complete  proc:e8c8ba78  session:e8c8ba78
[dev] ⚡ phase-change  proc:abc12345  phase:running
[dev] ✗  process-failed  proc:abc12345
[dev] Shutting down: killing all chat processes (SIGINT)
```

**Icon legend:** `◂` chat stream, `✓` complete, `✗` failed, `⚡` state change, `🔗` linked, `?` clarification

**UUIDs are shortened** to first 8 hex chars (e.g. `89362ba3-918c-4408-...` → `89362ba3`).

### Adding New Orchestration Event Formatting

To add formatting for a new inner JSONL type (e.g. a new Claude CLI output type):

1. Add handling in `src/transformers/dev-log-inner-jsonl-format/dev-log-inner-jsonl-format-transformer.ts`
2. Add a test case in the corresponding test file

To add formatting for a new orchestration event type:

1. Add the icon in `src/statics/dev-log-event-icons/dev-log-event-icons-statics.ts`
2. If it needs custom field extraction, update `src/transformers/dev-log-generic-event-format/`

### Transformer Chain

```
devLogEventFormatTransformer (main entry)
  ├─ devLogChatOutputFormatTransformer (parses payload.line or payload.entry.raw)
  │    ├─ devLogProcLabelTransformer (extracts proc:XXXXXXXX)
  │    └─ devLogInnerJsonlFormatTransformer (formats by inner type)
  │         └─ devLogToolInputFormatTransformer (tool-specific detail)
  └─ devLogGenericEventFormatTransformer (non-chat events)
       ├─ devLogProcLabelTransformer
       └─ devLogShortIdTransformer (UUID → 8 chars)
```

### Modifying Log Behavior

- **Gating and prefix:** `src/adapters/process/dev-log/process-dev-log-adapter.ts`
- **Event formatting:** `src/transformers/dev-log-event-format/` and its chain (see above)
- **Static messages** (WS connect, shutdown, errors): directly in the responder via `processDevLogAdapter`

## Quest Event Relay

The server has two WS broadcast paths — they handle different event tiers:

| Path | Events | Source |
|------|--------|--------|
| **Outbox watcher** (`orchestratorOutboxWatchAdapter`) | `quest-modified`, `quest-created` | Tails `event-outbox.jsonl`, loads full quest, broadcasts to all WS clients |
| **In-memory relay** (`orchestratorEventsOnAdapter` loop) | `chat-output`, `chat-complete`, `clarification-request`, etc. | Subscribes to `orchestrationEventsState` in-process events |

The relay loop explicitly skips `quest-modified` and `quest-created` — those are handled by the outbox watcher. Pipeline `chat-output` events (those with `slotIndex` in the payload) are batched at 100ms before broadcasting. Chat `chat-output` events (without `slotIndex`) relay immediately.

**Do NOT** add quest mutation events to the in-memory relay. All quest mutations go through the file outbox for cross-process support.

## Dual-Homedir Pattern

The server uses two different homedir adapters for two distinct storage locations:

| Data | Adapter | Resolves to | Why |
|---|---|---|---|
| Session JSONL files | `osUserHomedirAdapter` | Real `~/.claude/` (the OS user homedir) | Claude CLI writes session files here. It has no env var to redirect this path, so we must read from the real homedir. |
| Dungeonmaster data (guilds, quests) | `osHomedirAdapter` | `DUNGEONMASTER_HOME` (falls back to real homedir) | We control this path. In E2E tests and worktrees, `DUNGEONMASTER_HOME` isolates dungeonmaster data per environment. |

In E2E tests, `HOME` is set to the test directory so that `os.homedir()` (used by `osUserHomedirAdapter`) resolves to
the same isolated temp dir. This way the fake Claude CLI writes session files where the server expects to find them.
