# Pivot: Quest System via Slash Commands

## Summary

Move quest creation and execution from the CLI app into Claude Code slash commands, with MCP becoming the orchestrator
for headless agent execution.

**All work performed by sub-agents.** User performs final end-to-end verification.

---

## Testing Requirements

- **All net new or modified logic requires unit tests**
- Tests follow proxy pattern per testing standards
- Run `npm test` in each package after changes

---

## Current Architecture (What Exists)

### Agent Spawning (in CLI)

- `childProcessSpawnStreamJsonAdapter` - Spawns `claude -p <prompt> --output-format stream-json --verbose`
- `agentSpawnByRoleBroker` - Routes to role-specific spawners (pathseeker, codeweaver, etc.)
- `agentStreamMonitorBroker` - Monitors stdout for sessionId and signals

### Parallel Execution (in CLI)

- `agentSlotsState` - Tracks N concurrent slots
- `slotManagerOrchestrateBroker` - Uses `Promise.race()` to manage concurrent agents
- `orchestrationLoopLayerBroker` - Recursive loop until all steps complete

### Quest Pipeline (in CLI)

- `questExecuteBroker` - 5-phase pipeline: PathSeeker → Codeweaver → Siegemaster → Lawbringer → Spiritmender

### Signal System (in MCP)

- `signal-back` tool - Agents call to report: complete, needs-user-input, needs-role-followup, partially-complete

---

## New Architecture

### Quest Creation Flow (`/quest`)

```
User in Claude session
    ↓
/quest slash command
    ↓
ChaosWhisperer prompt loaded (uses AskUserQuestion directly)
    ↓
Creates/modifies quest via MCP tools (add-quest, modify-quest)
    ↓
Completes naturally (no signal-back)
```

### Quest Execution Flow (`/quest:start`)

```
User in separate Claude session
    ↓
/quest:start [optional: quest ID or description]
    ↓
Claude calls MCP `list-quests` if no args (or fuzzy match if description)
    ↓
Calls MCP `start-quest` tool (kicks off background orchestration, returns processId)
    ↓
MCP spawns headless agents using existing patterns:
  - claude -p <prompt> --output-format stream-json --verbose
  - Parallel slots via Promise.race()
  - Pipeline: PathSeeker → Codeweaver → Siegemaster → Lawbringer → Spiritmender
    ↓
Claude polls MCP `get-quest-status` periodically
    ↓
Reports progress to user
    ↓
Reports completion when done
```

### Status Polling Pattern

MCP provides:

1. `start-quest` - Spawns background orchestration process, returns processId
2. `get-quest-status` - Reads status from quest state, returns current progress

Status structure:

```json
{
  "processId": "abc123",
  "questId": "add-user-auth",
  "phase": "codeweaver",
  "completed": 3,
  "total": 8,
  "currentStep": "implement-auth-middleware",
  "slots": [
    {
      "slotId": 0,
      "step": "auth-guard",
      "status": "completed"
    },
    {
      "slotId": 1,
      "step": "auth-middleware",
      "status": "running"
    },
    {
      "slotId": 2,
      "step": "auth-tests",
      "status": "pending"
    }
  ]
}
```

---

## New Package: `@dungeonmaster/orchestrator`

**The single source of truth** for all agent spawning, quest management, and execution logic. MCP and CLI are thin
wrappers that import from orchestrator.

### What Goes in Orchestrator (ALL agent/quest logic)

| Category               | What Moves Here                                                                                                 |
|------------------------|-----------------------------------------------------------------------------------------------------------------|
| **Agent Spawning**     | childProcessSpawnStreamJsonAdapter, agentSpawnStreamingBroker, agentSpawnByRoleBroker, agentStreamMonitorBroker |
| **Slot Management**    | agentSlotsState, slotManagerOrchestrateBroker, orchestrationLoopLayerBroker                                     |
| **Quest Operations**   | questExecuteBroker, questListBroker, questLoadBroker, questStartBroker, questStatusBroker                       |
| **Prompts**            | All role prompts (pathseeker, codeweaver, siegemaster, lawbringer, spiritmender, chaoswhisperer)                |
| **Stream Processing**  | signalFromStreamTransformer, sessionIdExtractorTransformer, streamJsonToTextTransformer                         |
| **Internal Contracts** | AgentSlot, StreamSignal, WorkUnit (internal to orchestrator)                                                    |

### What Goes in Shared (for MCP/CLI to import)

| Category      | What Moves Here                                         |
|---------------|---------------------------------------------------------|
| **Contracts** | OrchestrationStatus (used by MCP tools and CLI screens) |

### Package Structure

```
packages/orchestrator/
├── package.json
├── tsconfig.json
├── jest.config.js
├── index.ts                    # Barrel export for startup (EXPORTED)
└── src/
    │
    │ ══════════════════════════════════════════════════
    │ EXPORTED (public API via index.ts)
    │ ══════════════════════════════════════════════════
    ├── startup/
    │   ├── start-orchestrator.ts     # Public commands: startQuest, getQuestStatus, listQuests
    │   └── start-install.ts          # Reads statics → writes .md slash commands
    │
    │ ══════════════════════════════════════════════════
    │ INTERNAL ("sausage" - not exported)
    │ ══════════════════════════════════════════════════
    ├── adapters/
    │   └── child-process/
    │       └── spawn-stream-json/
    ├── brokers/
    │   ├── quest/
    │   │   ├── list/
    │   │   ├── load/
    │   │   ├── start/
    │   │   ├── status/
    │   │   └── execute/
    │   ├── agent/
    │   │   ├── spawn-streaming/
    │   │   ├── spawn-by-role/
    │   │   └── stream-monitor/
    │   └── slot-manager/
    │       └── orchestrate/
    ├── contracts/                    # Internal contracts only
    │   ├── agent-slot/
    │   ├── stream-signal/
    │   └── work-unit/
    ├── state/
    │   └── agent-slots/
    ├── statics/
    │   ├── chaoswhisperer-prompt/    # For /quest command
    │   ├── quest-start-prompt/       # For /quest:start command (NEW)
    │   ├── pathseeker-prompt/
    │   ├── codeweaver-prompt/
    │   ├── siegemaster-prompt/
    │   ├── lawbringer-prompt/
    │   └── spiritmender-prompt/
    └── transformers/
        ├── signal-from-stream/
        ├── session-id-extractor/
        └── stream-json-to-text/

packages/shared/src/contracts/
└── orchestration-status/             # Shared contract (NEW - for MCP/CLI)
```

### Encapsulation Model

**Only export `startup/`** via `index.ts` - everything else is internal "sausage".
Any contracts needed by MCP/CLI go in `@dungeonmaster/shared`.

```
@dungeonmaster/orchestrator
├── EXPORTED (public API via index.ts)
│   └── startup/
│       ├── start-orchestrator.ts   # Commands: startQuest, getQuestStatus, listQuests, etc.
│       └── start-install.ts        # Reads prompt statics → writes .md slash commands
│
└── INTERNAL (not exported - "sausage")
    ├── adapters/              # child-process spawning
    ├── brokers/               # agent spawning, slot management, quest execution
    ├── contracts/             # internal contracts only
    ├── statics/               # all role prompts
    ├── state/                 # agent slots state
    └── transformers/          # signal extraction, stream processing

@dungeonmaster/shared
└── contracts/
    └── orchestration-status/  # Shared contract for MCP/CLI to use
```

### package.json

```json
{
  "name": "@dungeonmaster/orchestrator",
  "version": "0.1.0",
  "description": "Agent orchestration for Dungeonmaster quest execution",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "postbuild": "chmod +x dist/startup/*.js 2>/dev/null || true",
    "build:clean": "rm -rf dist && npm run build",
    "test": "jest",
    "test:unit": "jest --testPathIgnorePatterns='\\.integration\\.'",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dungeonmaster/shared": "*",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@dungeonmaster/testing": "*"
  }
}
```

### tsconfig.json and jest.config.js

**Copy from `packages/hooks/`** as templates:

- `packages/hooks/tsconfig.json` → `packages/orchestrator/tsconfig.json`
- `packages/hooks/jest.config.js` → `packages/orchestrator/jest.config.js`

### startup/start-orchestrator.ts (Public API)

Exposes commands that MCP and CLI need:

```typescript
export const startOrchestrator = {
    // Quest operations
    startQuest: ({questId}: { questId: QuestId }) => Promise<ProcessId>,
    getQuestStatus: ({processId}: { processId: ProcessId }) => Promise<OrchestrationStatus>,
    listQuests: () => Promise<QuestListItem[]>,
    loadQuest: ({questId}: { questId: QuestId }) => Promise<Quest>,

    // Internally orchestrates: agent spawning, slot management, pipeline execution
};
```

### startup/start-install.ts (Slash Command Generator)

Reads prompt statics (TypeScript) and writes markdown slash commands:

```typescript
export const StartInstall = async ({context}: { context: InstallContext }) => {
    // Read chaoswhisperer prompt from statics
    const questPrompt = chaoswhispererPromptStatics.prompt.template;

    // Read quest:start prompt from statics
    const questStartPrompt = questStartPromptStatics.prompt.template;

    // Write to target repo's .claude/commands/
    await writeQuestMd({targetPath: context.projectRoot, content: questPrompt});
    await writeQuestStartMd({targetPath: context.projectRoot, content: questStartPrompt});
};
```

---

## MCP Package (Thin Wrapper)

**MCP becomes a thin wrapper** - no agent/prompt logic, just calls orchestrator.

### Tools (all delegate to orchestrator)

| Tool               | Purpose                | Orchestrator Call                      |
|--------------------|------------------------|----------------------------------------|
| `start-quest`      | Kicks off execution    | `questStartBroker`                     |
| `get-quest-status` | Returns current status | `questStatusBroker`                    |
| `list-quests`      | Lists all quests       | `questListBroker`                      |
| `add-quest`        | Creates new quest      | Keep existing (quest data, not agents) |
| `modify-quest`     | Updates quest          | Keep existing (quest data, not agents) |
| `get-quest`        | Gets single quest      | `questLoadBroker`                      |

### What MCP Keeps

- Tool registration (`start-mcp-server.ts`)
- Architecture/discovery tools (unchanged)
- Quest data tools (add, modify, get - just data, no agents)

### What MCP Removes

- Any agent spawning logic (none currently, but prevent adding)
- Any prompt handling (none currently)

### MCP Imports

```typescript
import {startOrchestrator} from '@dungeonmaster/orchestrator';

// Usage in tool handlers:
await startOrchestrator.startQuest({questId});
await startOrchestrator.getQuestStatus({processId});
await startOrchestrator.listQuests();
```

---

## CLI Package (Thin Wrapper)

**CLI becomes a thin wrapper** - UI only, all logic delegates to orchestrator.

### What CLI Keeps

| Component                  | Purpose                        |
|----------------------------|--------------------------------|
| `widgets/`                 | Ink/React UI components        |
| `adapters/ink/`            | Ink testing library wrapper    |
| `startup/start-cli.ts`     | Entry point, renders widgets   |
| `startup/start-debug.ts`   | Debug mode for testing         |
| `startup/start-install.ts` | Installation (copies commands) |

### What CLI Removes (Moves to Orchestrator)

| Component                 | Destination                            |
|---------------------------|----------------------------------------|
| `brokers/agent/*`         | `orchestrator/brokers/agent/`          |
| `brokers/quest/execute/`  | `orchestrator/brokers/quest/execute/`  |
| `brokers/slot-manager/`   | `orchestrator/brokers/slot-manager/`   |
| `brokers/chaoswhisperer/` | `orchestrator/brokers/chaoswhisperer/` |
| `brokers/pathseeker/`     | `orchestrator/brokers/pathseeker/`     |
| `brokers/codeweaver/`     | `orchestrator/brokers/codeweaver/`     |
| `brokers/siegemaster/`    | `orchestrator/brokers/siegemaster/`    |
| `brokers/lawbringer/`     | `orchestrator/brokers/lawbringer/`     |
| `brokers/spiritmender/`   | `orchestrator/brokers/spiritmender/`   |
| `statics/*-prompt/`       | `orchestrator/statics/`                |
| `state/agent-slots/`      | `orchestrator/state/`                  |
| `transformers/signal-*`   | `orchestrator/transformers/`           |
| `transformers/stream-*`   | `orchestrator/transformers/`           |
| `transformers/session-*`  | `orchestrator/transformers/`           |
| `contracts/agent-*`       | `orchestrator/contracts/`              |
| `contracts/stream-*`      | `orchestrator/contracts/`              |
| `adapters/child-process/` | `orchestrator/adapters/`               |

### CLI Screens

| Screen | Action                | Orchestrator Call                    |
|--------|-----------------------|--------------------------------------|
| Menu   | Navigation only       | None                                 |
| List   | Show quests           | `startOrchestrator.listQuests()`     |
| Run    | Show execution status | `startOrchestrator.getQuestStatus()` |

### CLI UI Removals

**Remove these screens and related code:**

- `add-screen-layer-widget.tsx` - Replaced by `/quest` slash command
- `answer-screen-layer-widget.tsx` - Replaced by `AskUserQuestion` tool
- Related menu options and navigation logic
- `onSpawnChaoswhisperer` callback
- `onResumeChaoswhisperer` callback

### E2E Test Removals

**Remove from `tests/e2e/features/`:**

- Any tests related to "add" flow
- Any tests related to "answer" screen
- Any tests for ChaosWhisperer spawning from CLI

### CLI Imports

```typescript
import {startOrchestrator} from '@dungeonmaster/orchestrator';

// Usage in screens:
const quests = await startOrchestrator.listQuests();
const status = await startOrchestrator.getQuestStatus({processId});
```

---

## Installation Changes

### Two Install Scripts

**1. CLI `start-install.ts`** (existing, keeps devDependency installation)

- Adds devDependencies to target project
- Calls orchestrator's install

**2. Orchestrator `start-install.ts`** (new, generates slash commands)

- Reads prompt statics (TypeScript) from internal `statics/`
- Converts to markdown format
- Writes to target repo's `.claude/commands/`
    - `quest.md` - ChaosWhisperer with AskUserQuestion
    - `quest:start.md` - Monitors orchestration via polling

### Slash Command: `/quest` (quest.md)

**Purpose:** Create a new quest via ChaosWhisperer dialogue

**Source:** `orchestrator/statics/chaoswhisperer-prompt/`

**Changes from current ChaosWhisperer:**

- Uses `AskUserQuestion` tool instead of `signal-back`
- Completes naturally when requirements locked down
- Still calls MCP `add-quest` and `modify-quest` to persist

### Slash Command: `/quest:start` (quest:start.md)

**Purpose:** Monitor quest execution

**Source:** `orchestrator/statics/quest-start-prompt/` (new)

**Flow:**

1. If no args → call `list-quests`, pick most recent
2. If args → fuzzy match against quest IDs/descriptions
3. Call `start-quest` tool to kick off orchestration
4. Poll `get-quest-status` periodically
5. Report progress to user
6. Report completion

---

## Root package.json

Add `@dungeonmaster/orchestrator` to dependencies:

```json
{
  "dependencies": {
    "@dungeonmaster/orchestrator": "*",
    ...existing
  }
}
```

---

## Verification Plan

1. **Unit tests** - Each moved broker/adapter has tests that pass after move
2. **Orchestrator tests** - Quest start/status/execute pipeline works
3. **MCP integration** - Tools delegate correctly to orchestrator
4. **CLI integration** - List screen shows quests from orchestrator
5. **Slash command test** - `/quest:start` can:
    - Call MCP `start-quest` tool
    - Poll `get-quest-status` and see progress
    - Report completion
6. **Installation test** - `dungeonmaster init` copies slash commands to `.claude/commands/`

---

## Implementation Order

**All steps performed by sub-agents:**

1. **Create orchestrator package** - Set up structure, package.json, tsconfig, jest.config
2. **Move agent spawning** - adapters/child-process, brokers/agent/* + tests
3. **Move slot management** - state/agent-slots, brokers/slot-manager/* + tests
4. **Move quest execution** - brokers/quest/execute and phase layers + tests
5. **Move prompts** - All *-prompt statics
6. **Move transformers** - signal/stream/session transformers + tests
7. **Move contracts** - agent/stream/work-unit contracts + tests
8. **Create start-orchestrator.ts** - Public API + tests
9. **Create orchestrator start-install.ts** - Slash command generator + tests
10. **Update MCP** - Add new tools, import from orchestrator + tests
11. **Update CLI** - Remove moved code, import from orchestrator
12. **Remove CLI add/answer UIs** - Screens, callbacks, navigation
13. **Remove e2e tests** - Delete tests/e2e/features tests for add flow
14. **Verify and cleanup** - Sub-agents verify no orphaned code in MCP and CLI
15. **Run tests and lint** - `npm test` and `npm run lint` across orchestrator, mcp, cli
16. **User end-to-end verification** - User tests full flow manually

### Step 14: Verify and Cleanup Details

Sub-agents scan MCP and CLI packages for:

- Orphaned imports (importing removed code)
- Dead code (functions no longer called)
- Stale references to moved brokers/adapters/transformers
- Unused contracts/types
- Broken test imports

Fix any issues found before proceeding to step 15.
