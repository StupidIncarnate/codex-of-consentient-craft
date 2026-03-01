# Startup Split Plan: packages/mcp

## Overview

Two startup files need splitting:

1. **`start-install.ts`** — ~80 lines, branching (if/else for config state), imports adapters/brokers/transformers
2. **`start-mcp-server.ts`** — ~600 lines, massive if-chain dispatching 17 MCP tools, imports SDK/brokers/state/adapters

Neither `flows/` nor `responders/` directories exist yet in this package.

---

## Prerequisite: Whitelist MCP SDK for Flows

The MCP SDK (`@modelcontextprotocol/sdk`) is a server/routing framework equivalent to hono/express. The lifecycle flow
needs it to create the MCP server and register tool handlers — same pattern as a hono flow creating a Hono app.

`zod-to-json-schema` is also needed in the lifecycle flow to convert Zod input contracts to JSON schemas for tool
registration.

**File to modify:** `packages/shared/src/statics/folder-config/folder-config-statics.ts`

Add to the `flows` `allowedImports` array:

- `'@modelcontextprotocol/sdk'`
- `'zod-to-json-schema'`

Then rebuild shared: `npm run build --workspace=@dungeonmaster/shared`

---

## Part 1: start-install.ts

### Current State

- Imports: adapters (pathJoin, fsReadFile, fsWriteFile), broker (settingsPermissionsAdd), transformer
  (dungeonmasterConfigCreator), contracts
- Logic: read existing .mcp.json → skip if already configured / merge if exists / create if new → write config → add
  permissions
- Test: 4 integration test cases (create, skip, merge, invalid JSON)

### New Files

| File                                                                  | Purpose                                       |
| --------------------------------------------------------------------- | --------------------------------------------- |
| `flows/install/install-flow.ts`                                       | Thin delegate to responder                    |
| `flows/install/install-flow.integration.test.ts`                      | Wiring test                                   |
| `responders/install/config-create/install-config-create-responder.ts`       | All install logic from current startup         |
| `responders/install/config-create/install-config-create-responder.proxy.ts` | Test proxy                                    |
| `responders/install/config-create/install-config-create-responder.test.ts`  | Logic tests (4 cases from integration test)   |

### Modified Files

| File                         | Change                                          |
| ---------------------------- | ----------------------------------------------- |
| `startup/start-install.ts`   | Strip to single-line delegation: → `InstallFlow` |

### Deleted Files

| File                                          | Reason                                            |
| --------------------------------------------- | ------------------------------------------------- |
| `startup/start-install.integration.test.ts`   | Tests redistributed to responder + flow tests     |

### Logic Movement

All branching (try/catch for file read, if-checks for existing config, merge vs create) and all adapter/broker/
transformer imports move to `install-config-create-responder.ts`. Startup becomes a one-liner delegating to flow.

---

## Part 2: start-mcp-server.ts

### Current State

- 600+ lines, 30+ imports from adapters/brokers/state/npm packages
- Creates MCP Server + StdioServerTransport
- Initializes folder constraints state
- Registers 17 tools with ListToolsRequestSchema handler
- Dispatches tool calls via if-chain in CallToolRequestSchema handler

### Architecture: Domain Flows + Lifecycle Flow

Per the startup-split instructions: "an MCP server with architecture, quest, and ward tools" should use domain flows.
The startup collects tool registrations from domain flows, then passes them to a lifecycle flow that creates the server.

```
StartMcpServer()                        [startup - no branching]
  ├── ArchitectureFlow()                [domain flow - returns ToolRegistration[]]
  │     └── handlers → ArchitectureHandleResponder
  ├── QuestFlow()                       [domain flow - returns ToolRegistration[]]
  │     └── handlers → QuestHandleResponder
  ├── WardFlow()                        [domain flow - returns ToolRegistration[]]
  │     └── handlers → WardHandleResponder
  ├── InteractionFlow()                 [domain flow - returns ToolRegistration[]]
  │     └── handlers → InteractionHandleResponder
  └── McpServerFlow({registrations})    [lifecycle flow - creates server, wires tools]
        ├── ServerInitResponder()       → init folder constraints
        ├── zodToJsonSchema()           → convert input contracts to JSON schemas
        ├── new Server()                → create MCP server
        ├── setRequestHandler(ListTools) → register tool list
        ├── setRequestHandler(CallTool)  → dispatch via Map lookup (no if-chain)
        └── server.connect(transport)   → start listening
```

### New Contract

| File                                                                | Purpose                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `contracts/tool-registration/tool-registration-contract.ts`         | `ToolRegistration` type: `{ name, description, inputContract, handler }` and `ToolResponse` type |
| `contracts/tool-registration/tool-registration-contract.test.ts`    | Contract test                                              |

### New Domain Flows (4)

Each returns `ToolRegistration[]` — tool definitions with handler functions that delegate to responders.

| File                                                      | Tools Handled                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| `flows/architecture/architecture-flow.ts`                 | discover, get-architecture, get-folder-detail, get-syntax-rules, get-testing-patterns |
| `flows/architecture/architecture-flow.integration.test.ts`|                                                                    |
| `flows/quest/quest-flow.ts`                               | get-quest, modify-quest, verify-quest, start-quest, get-quest-status, list-quests, list-guilds |
| `flows/quest/quest-flow.integration.test.ts`              |                                                                    |
| `flows/ward/ward-flow.ts`                                 | ward-list, ward-detail, ward-raw                                   |
| `flows/ward/ward-flow.integration.test.ts`                |                                                                    |
| `flows/interaction/interaction-flow.ts`                    | signal-back, ask-user-question                                     |
| `flows/interaction/interaction-flow.integration.test.ts`   |                                                                    |

### New Lifecycle Flow (1)

| File                                                       | Purpose                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| `flows/mcp-server/mcp-server-flow.ts`                      | Creates MCP server, converts schemas, registers tools, dispatches via Map, connects transport |
| `flows/mcp-server/mcp-server-flow.integration.test.ts`     | End-to-end tests (from current startup integration test)   |

### New Responders (6)

| File                                                                        | Handles                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `responders/server/init/server-init-responder.ts`                           | Initializes folder constraints state (broker + state)                    |
| `responders/server/init/server-init-responder.proxy.ts`                     |                                                                          |
| `responders/server/init/server-init-responder.test.ts`                      |                                                                          |
| `responders/architecture/handle/architecture-handle-responder.ts`           | discover, get-architecture, get-folder-detail, get-syntax-rules, get-testing-patterns |
| `responders/architecture/handle/architecture-handle-responder.proxy.ts`     |                                                                          |
| `responders/architecture/handle/architecture-handle-responder.test.ts`      |                                                                          |
| `responders/quest/handle/quest-handle-responder.ts`                         | get-quest, modify-quest, verify-quest, start-quest, get-quest-status, list-quests, list-guilds |
| `responders/quest/handle/quest-handle-responder.proxy.ts`                   |                                                                          |
| `responders/quest/handle/quest-handle-responder.test.ts`                    |                                                                          |
| `responders/ward/handle/ward-handle-responder.ts`                           | ward-list, ward-detail, ward-raw                                         |
| `responders/ward/handle/ward-handle-responder.proxy.ts`                     |                                                                          |
| `responders/ward/handle/ward-handle-responder.test.ts`                      |                                                                          |
| `responders/interaction/handle/interaction-handle-responder.ts`             | signal-back, ask-user-question                                           |
| `responders/interaction/handle/interaction-handle-responder.proxy.ts`       |                                                                          |
| `responders/interaction/handle/interaction-handle-responder.test.ts`        |                                                                          |

### Modified Files

| File                            | Change                                                                   |
| ------------------------------- | ------------------------------------------------------------------------ |
| `startup/start-mcp-server.ts`   | Strip to ~15 lines: collect registrations from domain flows, pass to `McpServerFlow` |

### Deleted Files

| File                                              | Reason                                                        |
| ------------------------------------------------- | ------------------------------------------------------------- |
| `startup/start-mcp-server.integration.test.ts`    | Tests redistributed to flow integration test + responder tests |

### Startup Result (no branching, no disallowed imports)

```typescript
import { ArchitectureFlow } from '../flows/architecture/architecture-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { WardFlow } from '../flows/ward/ward-flow';
import { InteractionFlow } from '../flows/interaction/interaction-flow';
import { McpServerFlow } from '../flows/mcp-server/mcp-server-flow';

export const StartMcpServer = async (): Promise<void> => {
  const registrations = [
    ...ArchitectureFlow(),
    ...QuestFlow(),
    ...WardFlow(),
    ...InteractionFlow(),
  ];
  await McpServerFlow({ registrations });
};
```

No branching. Only imports flows. Signature unchanged.

### Responder Design

Each domain responder receives `{ tool, args }` and returns `ToolResponse`. Internal dispatch uses if/switch (allowed
in responders). Each responder handles arg parsing, broker/adapter calls, try/catch, and response formatting for its
domain's tools.

### Logic Movement

| From (start-mcp-server.ts)                    | To                                  |
| --------------------------------------------- | ----------------------------------- |
| Lines 62-66: folder constraints init          | `server-init-responder.ts`          |
| Lines 76-100: pre-computed JSON schemas       | `mcp-server-flow.ts` (inline)       |
| Lines 104-199: tool list definitions          | Domain flows (tool name + description + inputContract) |
| Lines 203-275: architecture tool handlers     | `architecture-handle-responder.ts`  |
| Lines 277-351: quest get/modify handlers      | `quest-handle-responder.ts`         |
| Lines 353-361: signal-back handler            | `interaction-handle-responder.ts`   |
| Lines 363-523: quest orchestration handlers   | `quest-handle-responder.ts`         |
| Lines 525-587: ward handlers                  | `ward-handle-responder.ts`          |
| Lines 589-595: ask-user-question handler      | `interaction-handle-responder.ts`   |
| Lines 600-603: transport + connect            | `mcp-server-flow.ts`                |

---

## Test Redistribution

### start-install tests

- **4 logic tests** (create, skip, merge, invalid JSON) → `install-config-create-responder.test.ts` using proxy pattern
- **1 wiring test** → `install-flow.integration.test.ts`

### start-mcp-server tests

**Stay as flow integration test** (`mcp-server-flow.integration.test.ts`):

- Server initialization
- tools/list returns all expected tools
- End-to-end tool calls (1-2 per domain to verify full wiring)

**Move to responder tests** (using proxy pattern):

- Architecture tool responses (discover results, overview text, folder detail with constraints, syntax rules, testing
  patterns)
- Quest tool responses (get/modify/start/status/list/verify/guilds with success + error cases)
- Ward tool responses (list/detail/raw with packagePath support)
- Interaction tool responses (signal-back, ask-user-question)
- Error handling (unknown tool, invalid args, isError flags)

---

## File Count Summary

| Category                | New files | Modified | Deleted |
| ----------------------- | --------- | -------- | ------- |
| Contracts (1 × 2)       | 2         | 0        | 0       |
| Domain flows (4 × 2)    | 8         | 0        | 0       |
| Lifecycle flow (1 × 2)  | 2         | 0        | 0       |
| Install flow (1 × 2)    | 2         | 0        | 0       |
| Responders (6 × 3)      | 18        | 0        | 0       |
| Install responder (1×3) | 3         | 0        | 0       |
| Startup                 | 0         | 2        | 2       |
| Shared (whitelist)      | 0         | 1        | 0       |
| **Total**               | **35**    | **3**    | **2**   |

---

## Implementation Order

1. Whitelist MCP SDK + zod-to-json-schema for flows (shared package, rebuild)
2. Create `tool-registration-contract` (shared types)
3. `start-install.ts` split (simpler, validates the pattern)
4. `start-mcp-server.ts` split — responders first, then domain flows, then lifecycle flow, then startup
5. Test redistribution
6. Ward pass on `packages/mcp`

---

## Files Modified Outside packages/mcp

- `packages/shared/src/statics/folder-config/folder-config-statics.ts` — add `@modelcontextprotocol/sdk` and
  `zod-to-json-schema` to flows allowedImports
