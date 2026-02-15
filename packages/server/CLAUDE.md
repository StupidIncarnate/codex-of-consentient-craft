# Server Package - Claude Session Guide

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

All lines are prefixed with `[dev]` for easy grepping:

```
[dev] WebSocket client connected
[dev] Chat started: questId=abc-123, messageLength=42
[dev] Claude CLI spawned: processId=def-456, args=["-p","Help me..."]
[dev] Chat stream: processId=def-456, type=assistant
[dev] Chat completed: processId=def-456, exitCode=0
[dev] Shutting down: killing all chat processes (SIGINT)
```

### Modifying Log Behavior

All formatting and gating lives in one place:
`src/adapters/process/dev-log/process-dev-log-adapter.ts`

To change the prefix, add timestamps, or route logs elsewhere, modify that single file.
