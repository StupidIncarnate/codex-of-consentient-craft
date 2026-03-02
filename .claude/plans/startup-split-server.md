# Startup Split Plan: `packages/server`

## Problem

`packages/server/src/startup/start-server.ts` (~330 lines) violates:
1. **No branching in startup** — Contains `if` statements for WebSocket message routing, event subscription filtering, and auto-start guard
2. **Restricted imports** — Directly imports responders, adapters, brokers, state, and npm packages (hono, @dungeonmaster/orchestrator)

## Architecture Pattern (from MCP package)

Follows the MCP server pattern:
- **Startup** collects sub-apps from domain flows, passes to a server flow
- **Domain flows** create Hono sub-routers with routes wired to existing responders
- **Server flow** mounts sub-routers, delegates non-routing setup to a responder
- **Server init responder** handles WebSocket setup, serving, event subscriptions, signal handlers

## New Files

### Domain Route Flows (6)

Each creates a `new Hono()`, registers routes that delegate to existing responders, and returns the Hono instance.

| Flow | Routes | Responders Used |
|------|--------|----------------|
| `flows/guild/guild-flow.ts` | GET/POST/PATCH/DELETE /api/guilds | GuildList, GuildAdd, GuildGet, GuildUpdate, GuildRemove |
| `flows/quest/quest-flow.ts` | GET/POST/PATCH /api/quests | QuestList, QuestGet, QuestAdd, QuestModify, QuestVerify, QuestStart |
| `flows/process/process-flow.ts` | GET /api/processes/:id, GET .../output | ProcessStatus, ProcessOutput |
| `flows/session/session-flow.ts` | POST/GET /api/sessions | SessionNew, SessionList, SessionChat, SessionChatStop |
| `flows/directory/directory-flow.ts` | POST /api/directories/browse | DirectoryBrowse |
| `flows/health/health-flow.ts` | GET /api/health, GET / (redirect) | None (inline handlers) |

Each flow gets a companion `.integration.test.ts`.

**Total: 12 files** (6 flows + 6 integration tests)

### Server Flow

**`flows/server/server-flow.ts`** + `.integration.test.ts`

- Receives array of Hono sub-apps from startup
- Creates main `new Hono()` app
- Mounts all sub-apps via `app.route('/', sub)`
- Calls `ServerInitResponder({ app })` for non-routing setup
- **Can import hono** (whitelisted for flows)
- **Can import responders** (allowed for flows)

**Total: 2 files**

### Server Init Responder

**`responders/server/init/server-init-responder.ts`** + `.proxy.ts` + `.test.ts`

Handles ALL non-routing server setup (things that need adapters/brokers/state):

1. **WebSocket setup** — Calls `honoCreateNodeWebSocketAdapter`, registers `/api/ws` upgrade route with message handling
2. **HTTP serving** — Calls `honoServeAdapter` to start listening
3. **Event relay** — Subscribes to orchestration events, broadcasts to WS clients via `wsEventRelayBroadcastBroker`
4. **Agent output buffering** — Sets up interval to flush buffered agent output to WS clients
5. **Signal handlers** — SIGTERM/SIGINT handlers that stop chats and close server
6. **Dev logging** — Calls `processDevLogAdapter` for startup message

This responder contains the branching logic currently in startup:
- WebSocket `onMessage`: `if (type === 'replay-history')`, `if (type === 'quest-data-request')`
- Event loop: `if (type === 'agent-output') continue`

If it exceeds 300 lines, decompose using layer files:
- `ws-handler-layer-responder.ts` — WebSocket message handling
- `event-relay-layer-responder.ts` — Event subscriptions + buffering

**Total: 3 files minimum** (impl + proxy + test), up to 9 with layers

### Bin Entry

**`bin/server-entry.ts`**

Thin entry point replacing the `if (NODE_ENV !== 'test')` auto-start guard:
```typescript
import { StartServer } from '../src/startup/start-server';
StartServer().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
```

**Total: 1 file**

## Modified Files

### `startup/start-server.ts`

**Before:** 330 lines with routing, WebSocket handling, event subscriptions, branching
**After:** ~15 lines — imports domain flows and ServerFlow, delegates everything

```typescript
import { GuildFlow } from '../flows/guild/guild-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { ProcessFlow } from '../flows/process/process-flow';
import { SessionFlow } from '../flows/session/session-flow';
import { DirectoryFlow } from '../flows/directory/directory-flow';
import { HealthFlow } from '../flows/health/health-flow';
import { ServerFlow } from '../flows/server/server-flow';

export const StartServer = async (): Promise<void> => {
  await ServerFlow({
    subApps: [
      GuildFlow(),
      QuestFlow(),
      ProcessFlow(),
      SessionFlow(),
      DirectoryFlow(),
      HealthFlow(),
    ],
  });
};
```

- No branching
- Only imports flows (allowed)
- Auto-start guard removed (moved to bin entry)

### `startup/start-server.proxy.ts`

Simplified to only mock the domain flows and ServerFlow (no longer needs to mock 18 responders, adapters, brokers directly).

### `startup/start-server.integration.test.ts`

Most test assertions redistribute to:
- **Responder `.test.ts` files** — Already exist for guild/quest/process/session/directory responders (logic tests stay there)
- **Flow `.integration.test.ts` files** — Route wiring tests (correct HTTP method + path → correct responder called)
- **Server init responder `.test.ts`** — WebSocket message handling, event subscription, signal handler tests

The startup integration test simplifies to testing that StartServer calls ServerFlow with the correct sub-apps.

### `package.json`

Update dev script:
```json
"dev": "tsx watch --clear-screen=false bin/server-entry.ts"
```

### `tsconfig.json`

Add bin directory to include:
```json
"include": ["src/**/*", "*.ts", "bin/**/*"]
```

## Test Redistribution

| Original Test (startup integration) | New Home |
|------|----------|
| Health check (GET /api/health → 200) | `flows/health/health-flow.integration.test.ts` |
| Guild CRUD endpoints | `flows/guild/guild-flow.integration.test.ts` (wiring) — logic already in responder tests |
| Quest endpoints | `flows/quest/quest-flow.integration.test.ts` (wiring) |
| Process endpoints | `flows/process/process-flow.integration.test.ts` (wiring) |
| Session endpoints | `flows/session/session-flow.integration.test.ts` (wiring) |
| Directory browse | `flows/directory/directory-flow.integration.test.ts` (wiring) |
| Root redirect | `flows/health/health-flow.integration.test.ts` |
| WebSocket replay-history | `responders/server/init/server-init-responder.test.ts` |
| WebSocket quest-data-request | `responders/server/init/server-init-responder.test.ts` |
| Event broadcasting | `responders/server/init/server-init-responder.test.ts` |

## Constraint Conflicts

**None identified.** All imports respect the hierarchy:
- Startup → flows only ✓
- Flows → hono (whitelisted) + responders + contracts/statics ✓
- Responders → adapters, brokers, state, contracts ✓
- Server init responder handles all npm/adapter/broker interactions ✓

## Implementation Order

1. Create domain route flows (guild, quest, process, session, directory, health)
2. Create server init responder (WebSocket, serving, events, lifecycle)
3. Create server flow (mounting + delegation)
4. Create bin entry
5. Modify startup to delegate
6. Update proxy and tests
7. Update package.json and tsconfig.json
8. Run ward, fix failures
