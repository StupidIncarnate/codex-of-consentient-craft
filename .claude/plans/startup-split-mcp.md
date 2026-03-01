# Startup Split Plan: packages/mcp

## Overview

Two startup files need splitting:
1. **`start-install.ts`** — 90 lines, 3 `if` branches, imports adapters/brokers/transformers (all forbidden in startup)
2. **`start-mcp-server.ts`** — 603 lines, ~17 `if` branches + ternaries, imports adapters/brokers/state/npm packages (all forbidden in startup)

Neither `flows/` nor `responders/` directories exist yet in this package.

---

## Prerequisite: Whitelist MCP SDK for Flows

The MCP SDK (`@modelcontextprotocol/sdk`) is a server framework equivalent to hono/express. Flows need it to create the MCP server and register tool handlers.

**File to modify:** `packages/shared/src/statics/folder-config/folder-config-statics.ts`

Add to the `flows` `allowedImports` array:
- `'@modelcontextprotocol/sdk'`
- `'zod-to-json-schema'`

Then rebuild shared: `npm run build --workspace=@dungeonmaster/shared`

---

## Part 1: start-install.ts

### Current State
- Imports: adapters (pathJoin, fsReadFile, fsWriteFile), broker (settingsPermissionsAdd), transformer (dungeonmasterConfigCreator), contracts
- Logic: read existing .mcp.json → skip if already configured / merge if exists / create if new → write config → add permissions to settings.json
- Test: 4 integration test cases (create, skip, merge, invalid JSON)

### Split

| New File | Purpose |
|----------|---------|
| `flows/install/install-flow.ts` | Thin delegate to responder |
| `flows/install/install-flow.integration.test.ts` | Wiring test (startup → flow → responder) |
| `responders/install/config-create/install-config-create-responder.ts` | All logic from current startup |
| `responders/install/config-create/install-config-create-responder.proxy.ts` | Test proxy |
| `responders/install/config-create/install-config-create-responder.test.ts` | Logic tests (4 cases from integration test) |

**Modified:** `startup/start-install.ts` → thin delegate to `InstallFlow`

**Deleted:** `startup/start-install.integration.test.ts` → tests redistributed to responder test + flow integration test

### Logic Movement
- All branching (try/catch for file read, if-checks for existing config, merge vs create) → responder
- All adapter/broker/transformer imports → responder
- Startup keeps: import flow + contracts, delegate to flow, return result
- Flow keeps: import responder, delegate, return result

### Test Redistribution
- **4 logic tests** (create, skip, merge, invalid JSON) → `install-config-create-responder.test.ts` using proxy pattern
- **1 wiring test** (startup delegates correctly) → `install-flow.integration.test.ts`

---

## Part 2: start-mcp-server.ts

### Current State
- 603 lines, 30+ imports from adapters/brokers/state/npm packages
- Creates MCP Server + StdioServerTransport
- Registers 17 tools with ListToolsRequestSchema handler
- Dispatches tool calls via if-chain in CallToolRequestSchema handler
- Initializes folder constraints state at startup

### Split Strategy

One flow handles MCP server lifecycle. Five domain responders handle tool groups. Tool dispatch uses a lookup map instead of if-chain.

| New File | Purpose |
|----------|---------|
| **Flow** | |
| `flows/mcp-server/mcp-server-flow.ts` | Creates server, registers tools, dispatches to responders via map |
| `flows/mcp-server/mcp-server-flow.integration.test.ts` | End-to-end MCP server tests (from current startup test) |
| **Responders** | |
| `responders/server/init/server-init-responder.ts` | Initializes folder constraints state |
| `responders/server/init/server-init-responder.proxy.ts` | |
| `responders/server/init/server-init-responder.test.ts` | |
| `responders/architecture/handle/architecture-handle-responder.ts` | Handles: discover, get-architecture, get-folder-detail, get-syntax-rules, get-testing-patterns |
| `responders/architecture/handle/architecture-handle-responder.proxy.ts` | |
| `responders/architecture/handle/architecture-handle-responder.test.ts` | |
| `responders/quest/handle/quest-handle-responder.ts` | Handles: get-quest, modify-quest, start-quest, get-quest-status, list-quests, verify-quest, list-guilds |
| `responders/quest/handle/quest-handle-responder.proxy.ts` | |
| `responders/quest/handle/quest-handle-responder.test.ts` | |
| `responders/ward/handle/ward-handle-responder.ts` | Handles: ward-list, ward-detail, ward-raw |
| `responders/ward/handle/ward-handle-responder.proxy.ts` | |
| `responders/ward/handle/ward-handle-responder.test.ts` | |
| `responders/interaction/handle/interaction-handle-responder.ts` | Handles: signal-back, ask-user-question |
| `responders/interaction/handle/interaction-handle-responder.proxy.ts` | |
| `responders/interaction/handle/interaction-handle-responder.test.ts` | |

**Modified:** `startup/start-mcp-server.ts` → thin delegate to `McpServerFlow`

**Deleted:** `startup/start-mcp-server.integration.test.ts` → tests move to flow integration test + responder tests

### Flow Design

```
McpServerFlow():
  1. Call ServerInitResponder() → initializes folder constraints
  2. Create Server('dungeonmaster-mcp')
  3. Register ListToolsRequestSchema handler (tool definitions using zodToJsonSchema + contracts)
  4. Register CallToolRequestSchema handler:
     - Build dispatch map: { toolName → responderFn }
     - Look up tool name in map
     - Call matching responder with parsed args
     - Return MCP response
  5. Connect StdioServerTransport
```

The flow groups tools by domain and routes to the appropriate responder:
```typescript
const handlers = {
  'discover': (args) => architectureHandleResponder({tool: 'discover', args}),
  'get-architecture': (args) => architectureHandleResponder({tool: 'get-architecture', args}),
  'get-folder-detail': (args) => architectureHandleResponder({tool: 'get-folder-detail', args}),
  'get-syntax-rules': (args) => architectureHandleResponder({tool: 'get-syntax-rules', args}),
  'get-testing-patterns': (args) => architectureHandleResponder({tool: 'get-testing-patterns', args}),
  'get-quest': (args) => questHandleResponder({tool: 'get-quest', args}),
  // ... etc
};
```

### Responder Design

Each responder receives `{tool: string, args: unknown}` and returns `{content: [{type: 'text', text: string}], isError?: boolean}`.

Each responder:
- Parses args using the appropriate contract (via safeParse)
- Calls the appropriate broker/adapter
- Formats the MCP response
- Handles try/catch for its domain

### Logic Movement

| From (start-mcp-server.ts) | To |
|---|---|
| Lines 64-73: folder constraints init | `server-init-responder.ts` |
| Lines 75-200: tool list definitions | `mcp-server-flow.ts` (inline with zodToJsonSchema) |
| Lines 203-229: discover + get-architecture | `architecture-handle-responder.ts` |
| Lines 231-275: folder-detail + syntax-rules + testing-patterns | `architecture-handle-responder.ts` |
| Lines 277-350: quest tools (get, modify) | `quest-handle-responder.ts` |
| Lines 353-522: signal-back, start-quest, status, verify, list-quests, list-guilds | `quest-handle-responder.ts` (signal-back → interaction) |
| Lines 525-585: ward tools | `ward-handle-responder.ts` |
| Lines 589-597: ask-user-question | `interaction-handle-responder.ts` |
| Lines 600-603: transport + connect | `mcp-server-flow.ts` |

### Test Redistribution

From `start-mcp-server.integration.test.ts` (24 tests):

**Stay as flow integration test** (end-to-end subprocess tests):
- Server initialization
- tools/list returns expected tools
- End-to-end tool calls (1-2 per domain to verify wiring)

**Move to responder tests** (logic/behavior tests using proxy pattern):
- Architecture tool responses (discover, get-architecture, folder-detail, syntax-rules, testing-patterns)
- Quest tool responses (get-quest, modify-quest, start-quest, get-quest-status, list-quests, verify-quest)
- Ward tool responses (ward-list, ward-detail, ward-raw)
- Interaction tool responses (ask-user-question, signal-back)
- Error handling (unknown tool, invalid args, isError flags)

---

## Implementation Order

1. Whitelist MCP SDK + zod-to-json-schema for flows (shared package)
2. `start-install.ts` split (simpler, validates the pattern)
3. `start-mcp-server.ts` split (complex, follows validated pattern)
4. Test redistribution
5. Test coverage audit
6. Ward pass

---

## Files Modified Outside packages/mcp

- `packages/shared/src/statics/folder-config/folder-config-statics.ts` — add `@modelcontextprotocol/sdk` and `zod-to-json-schema` to flows allowedImports
