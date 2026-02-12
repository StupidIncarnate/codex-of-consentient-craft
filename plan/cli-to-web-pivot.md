# Plan: CLI to Local Web SPA Pivot

**Status: IN PROGRESS**

## Progress Tracker

| Phase                                 | Status      | Notes                                                |
|---------------------------------------|-------------|------------------------------------------------------|
| Phase 1: Foundation (MVP)             | COMPLETE    |                                                      |
| Phase 2: Agent Output Streaming       | COMPLETE    | All 5 tasks done                                     |
| Phase 3: Agent Migration (MCP → HTTP) | IN PROGRESS | Tasks 3.1-3.5 complete, 3.6 verification in progress |
| Phase 4: Verification + Cleanup       | NOT STARTED | Requires manual verification before deletions        |
| Phase 5: Pixel Art Game Foundation    | NOT STARTED |                                                      |

### Phase 1 Detailed Progress

| Task                                                    | Status | Notes                                                                                                                                               |
|---------------------------------------------------------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| 1.1 Event bus in orchestrator                           | DONE   | EventEmitter-like singleton using Map-based pub/sub (compliant with import rules), wired into start-orchestrator.ts                                 |
| 1.2 `packages/server` setup (package.json, tsconfig)    | DONE   | package.json, tsconfig, jest.config, builds clean                                                                                                   |
| 1.3 Server startup + Hono wiring                        | DONE   | All REST endpoints in start-server.ts                                                                                                               |
| 1.4 REST endpoints (quest CRUD + start + status)        | DONE   | 13 endpoints (9 fully implemented, 4 placeholder 501s for discover/docs that need MCP broker migration)                                             |
| 1.5 WebSocket support                                   | DONE   | @hono/node-ws, event bus subscription, broadcast to connected clients                                                                               |
| 1.6 `packages/web` setup (package.json, Vite, Mantine)  | DONE   | Vite + Mantine v8 + React 19, builds clean                                                                                                          |
| 1.7 Web SPA: quest list, quest detail                   | DONE   | Full Mantine UI with AppShell, Table, Tabs, Badge, navigation                                                                                       |
| 1.8 Web SPA: start quest, real-time status              | DONE   | Execution dashboard, phase stepper, slot grid, WebSocket client                                                                                     |
| 1.9 `dungeonmaster` command → launches server + browser | DONE   | CLI routes init vs serve, dynamic import, cross-platform browser open                                                                               |
| 1.10 Shared contracts (ws-message, event types)         | DONE   | orchestration-event-type + ws-message contracts with stubs and tests                                                                                |
| 1.11 Phase 1 verification: ward:all + manual test       | DONE   | ward:all passes - 406 suites, 2724 tests. One pre-existing lint fail in web package (eslint module resolution). 0 errors, 13 pre-existing warnings. |

### Phase 2 Detailed Progress

| Task                                                  | Status | Notes                                                                                                                                                                                                                                                          |
|-------------------------------------------------------|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 2.1 Forward raw stream lines through event bus        | DONE   | onLine callback threaded through full chain: agentStreamMonitorBroker → agentSpawnByRoleBroker → spawnAgentLayerBroker → orchestrationLoop → slotManager → codeweaverPhase → questPipeline → startOrchestrator. PathSeeker stdout also monitored.              |
| 2.2 Terminal-like agent output panels                 | DONE   | Dark terminal styling (#0d1117 bg), ANSI color rendering (ansi-to-react), auto-follow toggle, expand/collapse, copy-to-clipboard, line count badge with buffer warning at 400+. Server-side ring buffer + client-side ring buffer both enforce 500 lines/slot. |
| 2.3 Ring buffer (500 lines/slot) + batched WS (100ms) | DONE   | Server: agentOutputBufferState with FIFO ring buffer (500 max), pendingFlush cursor tracking, 100ms setInterval batch broadcast. Client: useAgentOutput hook with 500-line FIFO per slot. Late-joiner REST endpoint at /api/process/:id/output.                |
| 2.4 Sub-agent response trimming in orchestrator       | DONE   | capturedOutput added to AgentSpawnStreamingResult, new streamTextContract + buildContinuationContextTransformer, last 50 lines of output included in continuation context for respawns                                                                         |
| 2.5 Phase 2 verification                              | DONE   | ward:all: 273/274 suites pass (1 pre-existing orchestrator index.test.ts failure), typecheck clean across 12 workspaces, lint clean except pre-existing web ESLint module resolution issue, 14 pre-existing complexity warnings.                               |

### Phase 3 Detailed Progress

| Task                                             | Status      | Notes                                                                                                                                                                                                                      |
|--------------------------------------------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 3.1 Agent-facing HTTP endpoints (discover, docs) | DONE        | All 501 placeholders replaced with real broker calls (architectureOverviewBroker, architectureFolderDetailBroker, architectureSyntaxRulesBroker, architectureTestingPatternsBroker, mcpDiscoverBroker)                     |
| 3.2 Move agent prompts into orchestrator         | DONE        | All 9 prompts in packages/orchestrator/src/statics/ (chaoswhisperer, pathseeker, codeweaver, lawbringer, siegemaster, spiritmender, quest-start, finalizer, gap-reviewer). roleToPromptTemplateTransformer routes by role. |
| 3.3 Update prompts: MCP → HTTP (curl/Bash)       | DONE        | All prompts use curl http://localhost:3737/api/* calls. Zero references to mcp__dungeonmaster__* in orchestrator prompts.                                                                                                  |
| 3.4 Quest creation form in web UI                | DONE        | TextInput + Textarea in quest-list-widget, calls POST /api/quests                                                                                                                                                          |
| 3.5 Quest modification + verification UI         | DONE        | Quest detail tabs with verification support                                                                                                                                                                                |
| 3.6 Phase 3 verification                         | IN PROGRESS |                                                                                                                                                                                                                            |

### Phase 4 Detailed Progress

| Task                                                 | Status      | Notes                              |
|------------------------------------------------------|-------------|------------------------------------|
| 4.1 Full end-to-end pipeline test (HTTP-only agents) | NOT STARTED |                                    |
| 4.2 **MANUAL VERIFICATION CHECKPOINT**               | NOT STARTED | User must approve before deletions |
| 4.3 Delete `packages/mcp`                            | NOT STARTED | Only after manual approval         |
| 4.4 Remove `.claude/commands/` install from init     | NOT STARTED | Only after manual approval         |
| 4.5 Remove CLI quest screens                         | NOT STARTED | Only after manual approval         |

### Phase 5 Detailed Progress

| Task                                     | Status      | Notes |
|------------------------------------------|-------------|-------|
| 5.1 Canvas widget (`<QuestSceneWidget>`) | NOT STARTED |       |
| 5.2 Sprite sheet system                  | NOT STARTED |       |
| 5.3 Agent role avatars                   | NOT STARTED |       |
| 5.4 Phase-reactive scene composition     | NOT STARTED |       |

---

## Context

The current CLI (Ink/React for terminal) needs to be replaced with a local web SPA. The CLI has screens for menu, list,
run, init, and help — but **quest execution display was never implemented**. The web UI will be the primary interface
for managing and monitoring quests, with real-time agent output streaming and an eventual pixel art game aesthetic.

This is an npm package installed in other repos — agents running in those repos won't have local doc files, so
architecture docs must remain accessible via tooling (MCP now, HTTP/CLI later).

## Decisions Made

| Decision                | Choice                                  | Rationale                                                                                                                           |
|-------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| HTTP framework          | **Hono**                                | Lightweight, built-in WS, TypeScript-first                                                                                          |
| Design library          | **Mantine v8**                          | 155 components + 87 hooks, best Jest/RTL support, built-in charts, form errors baked in, llms.txt, active                           |
| `dungeonmaster` command | **Launches server + opens browser**     | Replaces CLI as primary entry point                                                                                                 |
| `dungeonmaster init`    | **Stays as terminal command**           | Still needed for installing deps, project setup                                                                                     |
| MCP removal             | **Last step, after verification**       | Nothing removed until web UI fully proven                                                                                           |
| Sub-agent prompts       | **Internal to orchestrator**            | No `.claude/commands/` or `.claude/agents/` installed in user repos. Orchestrator holds prompts and spawns headless agents directly |
| Sub-agent responses     | **Orchestrator-mediated with trimming** | Orchestrator captures sub-agent output, trims/filters, feeds back to parent agent on resume                                         |

## Architecture Overview

```
Browser (React SPA - Mantine)
  |
  |-- REST (quest CRUD, start, status)
  |-- WebSocket (real-time: agent output, phase changes, slot updates)
  |
packages/server (Hono)
  |
  |-- imports StartOrchestrator API directly (same process)
  |-- subscribes to orchestrator events, relays via WebSocket
  |-- serves static SPA build in production
  |
packages/orchestrator (augmented with EventEmitter + sub-agent trimming)
  |
  |-- spawns headless Claude subprocesses (prompts held internally)
  |-- monitors stdout streams
  |-- emits events on state changes (NEW)
  |-- captures sub-agent output, trims, feeds back on resume (NEW)
  |
packages/mcp (STAYS until final verification, then removed)
  |
  |-- agents continue using MCP tools during transition
```

## Explicit Pivot: Agent Tool Access

**Current state:** Agents use MCP tools for everything:

- `mcp__dungeonmaster__add-quest` → create quests
- `mcp__dungeonmaster__modify-quest` → modify quests
- `mcp__dungeonmaster__get-quest` → read quests
- `mcp__dungeonmaster__discover` → find code
- `mcp__dungeonmaster__get-architecture` → architecture docs
- `mcp__dungeonmaster__get-folder-detail` → folder patterns
- `mcp__dungeonmaster__get-syntax-rules` → syntax conventions
- `mcp__dungeonmaster__get-testing-patterns` → testing patterns
- `mcp__dungeonmaster__signal-back` → signal completion

**During transition (Phases 1-3):** MCP stays. Agents work exactly as they do now.

**After verification (Phase 4):** MCP removed. Agents switch to HTTP API calls:

- Quest CRUD → `POST/GET/PATCH /api/quests/...` (agents use curl/fetch via Bash)
- Discover → `GET /api/discover?fileType=...&search=...`
- Architecture docs → `GET /api/docs/architecture`, `/api/docs/folder-detail/:type`, etc.
- Signal-back → already extracted from stdout via `signalFromStreamTransformer`, no replacement needed

## Sub-Agent Orchestration Model

1. Orchestrator spawns sub-agent with prompt held internally
2. Sub-agent runs headlessly, calls MCP tools (during transition) or HTTP (after)
3. Orchestrator captures sub-agent's full output from stdout
4. Orchestrator trims/filters the output
5. Orchestrator resumes parent agent with filtered output as continuation context

## What Changes

### 1. Orchestrator: Add Event Bus + Sub-Agent Trimming

**New files:**

- `state/orchestration-events/orchestration-events-state.ts` — EventEmitter singleton
- `contracts/orchestration-event/orchestration-event-contract.ts` — Event type union
- `contracts/orchestration-event-type/orchestration-event-type-contract.ts` — Event name enum

**Modified files:**

- `orchestration-processes-state.ts` — emit events after `updatePhase()`, `updateSlot()`, `updateProgress()`
- `agent-stream-monitor-broker.ts` — accept optional `onLine` callback to forward raw stream lines
- `index.ts` — export event subscription API

**Event types:** `phase-change`, `slot-update`, `progress-update`, `agent-output`, `process-complete`, `process-failed`

### 2. `dungeonmaster` Entry Point Change

**Current:** `dungeonmaster` → launches Ink CLI
**New:** `dungeonmaster` → starts Hono server + opens browser to `localhost:PORT`
**Kept:** `dungeonmaster init` → stays as terminal command for project setup

### 3. New Package: `packages/server`

HTTP + WebSocket server wrapping the orchestrator.

**Tech:** Hono + @hono/node-server + @hono/node-ws

**Structure:**

- `startup/start-server.ts` — Entry point
- `responders/quest/{list,get,add,modify,verify,start,status}/` — REST endpoints
- `responders/health/` — Health check
- `responders/discover/` — File discovery endpoint
- `responders/docs/{architecture,folder-detail,syntax-rules,testing-patterns}/` — Architecture docs
- `adapters/hono/`, `adapters/ws/`, `adapters/orchestrator/` — Thin wrappers
- `brokers/ws/connection-manager/`, `brokers/ws/broadcast/` — WS management
- `brokers/orchestrator/event-relay/` — Subscribe to events, relay via WS
- `state/ws-connections/` — Connected clients set
- `middleware/cors/`, `middleware/error-handler/` — Request pipeline
- `flows/api/` — Route wiring
- `statics/server-config/`, `statics/api-routes/` — Constants
- `contracts/ws-message/` — WS message envelope

**REST API:**

| Method | Path                            | Purpose               |
|--------|---------------------------------|-----------------------|
| GET    | `/api/health`                   | Health check          |
| GET    | `/api/quests`                   | List quests           |
| GET    | `/api/quests/:questId`          | Quest detail          |
| POST   | `/api/quests`                   | Create quest          |
| PATCH  | `/api/quests/:questId`          | Modify quest          |
| POST   | `/api/quests/:questId/verify`   | Verify quest          |
| POST   | `/api/quests/:questId/start`    | Start execution       |
| GET    | `/api/process/:processId`       | Execution status      |
| GET    | `/api/discover`                 | File discovery        |
| GET    | `/api/docs/architecture`        | Architecture overview |
| GET    | `/api/docs/folder-detail/:type` | Folder patterns       |
| GET    | `/api/docs/syntax-rules`        | Syntax conventions    |
| GET    | `/api/docs/testing-patterns`    | Testing patterns      |

### 4. New Package: `packages/web`

React SPA with Mantine.

**Tech:** React 18 + react-dom + Mantine v8 + Vite

**Structure:**

- `startup/start-app.tsx` — ReactDOM entry, MantineProvider
- `widgets/` — app, quest-list, quest-detail, execution-dashboard, agent-panel, phase-indicator, slot-grid
- `bindings/` — use-quests-list, use-quest-detail, use-quest-execution, use-ws-connection, use-agent-output
- `brokers/` — API call orchestration, WS message handling
- `adapters/` — fetch wrapper, WebSocket wrapper
- `flows/main/` — Top-level navigation/routing
- `state/orchestration/` — React context + useReducer
- `statics/` — API config, agent colors, phase labels
- `contracts/` — WS message, agent output line, quest view model
- `guards/`, `transformers/` — WS connection checks, data transforms

### 5. Shared Package: Additions Only

- `ws-message-contract.ts` — WebSocket message envelope
- `orchestration-event-type-contract.ts` — Event name enum

## What Stays (Nothing Removed Until Verified)

- **`packages/mcp`** — Stays through Phases 1-3
- **`packages/cli`** — Entry point changes, `init` stays
- **`.claude/commands/` and `.claude/agents/`** — Stay during transition
- **All existing packages** — `eslint-plugin`, `testing`, `config`, `hooks`, `standards`, `tooling` untouched

## New Dependencies

| Package                       | Where     | Purpose                |
|-------------------------------|-----------|------------------------|
| `hono` ^4.x                   | server    | HTTP framework         |
| `@hono/node-server` ^1.x      | server    | Node.js adapter        |
| `@hono/node-ws` ^1.x          | server    | WebSocket support      |
| `react-dom` ^18.2.0           | web       | DOM rendering          |
| `@mantine/core` ^8.x          | web       | Component library      |
| `@mantine/hooks` ^8.x         | web       | React hooks            |
| `@mantine/charts` ^8.x        | web       | Charts                 |
| `@mantine/notifications` ^8.x | web       | Toast notifications    |
| `postcss`                     | web (dev) | Required by Mantine    |
| `postcss-preset-mantine`      | web (dev) | Mantine PostCSS plugin |
| `vite` ^6.x                   | web (dev) | Build tool             |
| `@vitejs/plugin-react` ^4.x   | web (dev) | React HMR              |

## Key Risks

1. **Agent output volume**: Server-side batching (100ms) + client ring buffers (500 lines/slot)
2. **WebSocket lifecycle**: Heartbeat ping/pong + auto-reconnect with exponential backoff
3. **MCP ↔ HTTP coexistence**: During transition, both consume orchestrator in same process
4. **Agent prompt migration**: Prompts need careful updating when switching MCP → HTTP

## Verification Gates

1. **Phase 1**: `npm run ward:all` passes. Server starts. Browser shows quest list. WebSocket connects. Phase changes
   display in real-time.
2. **Phase 2**: Agent output streams to browser. Trimmed sub-agent responses work. No token bloat.
3. **Phase 3**: All agent prompts updated. Every MCP tool call replaced with HTTP. Agents work with HTTP API.
4. **Phase 4**: Full end-to-end quest pipeline verified. **MANUAL USER VERIFICATION REQUIRED** before any deletions.
5. **Phase 5**: Pixel art rendering. Game aesthetic applied.
