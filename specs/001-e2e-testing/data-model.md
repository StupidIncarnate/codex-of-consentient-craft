# Data Model: E2E Testing Harness

**Feature**: 001-e2e-testing
**Date**: 2026-01-28

## Entities

### E2ETestContext

Represents the isolated test environment for a single E2E test.

| Field | Type | Description |
|-------|------|-------------|
| projectPath | string | Absolute path to isolated temp directory |
| cliProcess | ChildProcess \| null | Reference to spawned CLI subprocess |
| mcpConfigPath | string | Path to .mcp.json in test project |
| questsPath | string | Path to .dungeonmaster-quests/ |
| startTime | number | Timestamp when context was created |
| timeout | number | Default timeout in ms (default: 60000) |

**Validation Rules**:
- `projectPath` must be absolute path
- `projectPath` must exist on file system
- `timeout` must be positive integer

**State Transitions**:
- Created → CLI Started → CLI Running → CLI Stopped → Cleaned Up

### E2EScreenState[data-model.md](data-model.md)

Represents a captured snapshot of CLI screen output.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Screen identifier (menu, add, list, answer, etc.) |
| frame | string | Raw terminal output as string |
| capturedAt | number | Timestamp of capture |

**Validation Rules**:
- `name` must be one of: 'menu' \| 'add' \| 'list' \| 'help' \| 'run' \| 'answer' \| 'init'
- `frame` may contain ANSI escape codes

### E2EAssertion

Represents an assertion to be verified against test state.

| Field | Type | Description |
|-------|------|-------------|
| type | string | 'screen-contains' \| 'screen-excludes' \| 'file-exists' \| 'file-contains' |
| target | string | What to check (screen frame, file path) |
| expected | string \| RegExp | Expected value or pattern |
| actual | string \| null | Actual value found |
| passed | boolean | Whether assertion passed |

### QuestFile

Represents a quest file created by the CLI.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Quest identifier (kebab-case) |
| folder | string | Quest folder name (e.g., "001-danger-fun") |
| title | string | Human-readable quest title |
| status | string | Quest status (in_progress, complete, etc.) |
| userRequest | string | Original user prompt |
| createdAt | string | ISO timestamp |
| contexts | array | Quest contexts |
| observables | array | Observable outcomes |
| steps | array | Execution steps |
| toolingRequirements | array | Required tools |
| executionLog | array | Execution history |

**Validation Rules**:
- `id` must match `/^[a-z0-9-]+$/`
- `folder` must match `/^\d{3}-[a-z0-9-]+$/`
- `status` must be valid quest status

## Relationships

```
E2ETestContext
    │
    ├── 1:1 ── cliProcess (spawned CLI subprocess)
    │
    ├── 1:N ── E2EScreenState (captured screens over time)
    │
    └── 1:N ── QuestFile (quests created during test)
```

## Data Flow

```
Test Start
    │
    ▼
Create E2ETestContext (temp dir, config files)
    │
    ▼
Spawn CLI Process (subprocess)
    │
    ▼
Send Input ────────────────────┐
    │                          │
    ▼                          ▼
Capture E2EScreenState    Wait for MCP operations
    │                          │
    ▼                          ▼
Run E2EAssertion         Read QuestFile from disk
    │                          │
    └──────────────────────────┘
    │
    ▼
Test Complete
    │
    ▼
Cleanup (kill process, remove temp dir)
```

## File Structure After Test

```
/tmp/e2e-test-xyz123/
├── .mcp.json                      # MCP configuration (copied/generated)
├── .dungeonmaster-quests/         # Quest storage
│   └── 001-danger-fun/
│       └── quest.json             # Created quest file
├── package.json                   # Minimal package config
└── .dungeonmaster/                # CLI state (if any)
```
