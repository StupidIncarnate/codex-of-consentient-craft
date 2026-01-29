# Implementation Plan: E2E Testing Harness for CLI

**Branch**: `001-e2e-testing` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-e2e-testing/spec.md`

## Summary

Build an E2E testing harness that runs full user flows against the CLI with real MCP integration and Claude headless mode. The harness extends the existing `installTestbedCreateBroker` pattern and uses the CLI's built-in `init` command (not manual .mcp.json copying) to properly configure MCP and hooks. Two test scenarios validate: (1) quest creation without followup, (2) user question flow via MCP signal-back.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js >= 14.0.0
**Primary Dependencies**: Jest, child_process (spawn), @dungeonmaster/testing (existing testbed)
**Storage**: File system (.dungeonmaster-quests/ directory)
**Testing**: Jest with @dungeonmaster/testing (auto-reset mocks)
**Target Platform**: Node.js CLI (Linux/macOS/Windows)
**Project Type**: Monorepo workspace (packages/*)
**Performance Goals**: Test suite completes in under 120 seconds
**Constraints**: Must run headless (no interactive terminal), must have real MCP access via init command
**Scale/Scope**: 2 initial E2E test scenarios, harness designed for extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | ✅ PASS | E2E harness extends existing `packages/testing` |
| II. CLI Interface | ✅ PASS | Uses subprocess stdin/stdout protocol |
| III. Test-First (NON-NEGOTIABLE) | ✅ PASS | Test harness enables TDD for CLI features |
| IV. Integration Testing | ✅ PASS | This IS the integration testing infrastructure |
| V. MCP Architecture Tools | ✅ PASS | Consulted get-architecture, get-folder-detail, get-testing-patterns |
| VI. Simplicity (YAGNI) | ✅ PASS | Extends existing testbed, no unnecessary abstractions |

### Post-Design Check (Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | ✅ PASS | Extends `installTestbedCreateBroker` in `packages/testing` |
| II. CLI Interface | ✅ PASS | Uses `dungeonmaster init` for setup, subprocess for CLI |
| III. Test-First | ✅ PASS | Tests define API before implementation |
| IV. Integration Testing | ✅ PASS | E2E tests use `.integration.test.ts` pattern per testing-patterns |
| V. MCP Architecture Tools | ✅ PASS | Contracts use branded Zod types, stubs follow stub patterns |
| VI. Simplicity | ✅ PASS | Reuses testbed.runInitCommand(), minimal new code |

## Project Structure

### Documentation (this feature)

```text
specs/001-e2e-testing/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/testing/
└── src/
    ├── brokers/
    │   ├── install-testbed/
    │   │   └── create/
    │   │       └── install-testbed-create-broker.ts  # EXTEND with E2E methods
    │   └── e2e-testbed/
    │       └── create/
    │           ├── e2e-testbed-create-broker.ts      # Composes installTestbedCreateBroker
    │           ├── e2e-testbed-create-broker.proxy.ts
    │           └── e2e-testbed-create-broker.test.ts
    ├── contracts/
    │   ├── e2e-testbed/
    │   │   ├── e2e-testbed-contract.ts               # Extends InstallTestbed
    │   │   └── e2e-testbed.stub.ts
    │   ├── cli-screen-name/
    │   │   ├── cli-screen-name-contract.ts           # Branded enum for screens
    │   │   └── cli-screen-name.stub.ts
    │   └── screen-frame/
    │       ├── screen-frame-contract.ts              # Branded string for terminal output
    │       └── screen-frame.stub.ts
    └── statics/
        └── e2e-timeouts/
            └── e2e-timeouts-statics.ts               # Default timeout values

packages/cli/
└── src/
    └── startup/
        ├── start-cli.ts                              # Existing - no changes
        └── start-cli.integration.test.ts             # NEW - E2E test scenarios
```

**Structure Decision**:
- E2E testbed broker extends existing `installTestbedCreateBroker` pattern
- E2E tests live as `.integration.test.ts` co-located with `start-cli.ts` per testing patterns
- Contracts use branded Zod types per `get-folder-detail({ folderType: "contracts" })`
- No separate `tests/e2e/` directory needed - integration tests go with startup files

## Complexity Tracking

> No violations - design follows constitution principles.

## Key Design Decisions

### 1. Use CLI Init Command for Setup (Not Manual .mcp.json)

**Correction from user feedback**: The CLI has a built-in `init` command that handles MCP configuration AND hook setup. Manual .mcp.json copying would miss hooks.

**Approach**:
- Use existing `testbed.runInitCommand()` from `installTestbedCreateBroker`
- This runs `dungeonmaster init` which:
  - Creates `.mcp.json` with correct MCP server path
  - Creates `.claude/settings.json` with hooks
  - Creates `.dungeonmaster` config file
  - Sets up ESLint config

### 2. Extend Existing Testbed (Not Create New)

Per "Extension Over Creation Philosophy" from architecture, we extend `installTestbedCreateBroker`:

```typescript
// e2e-testbed-create-broker.ts
export const e2eTestbedCreateBroker = ({ baseName }: { baseName: BaseName }): E2ETestbed => {
  // Compose existing testbed
  const testbed = installTestbedCreateBroker({ baseName });

  // Run init to setup MCP + hooks
  testbed.runInitCommand();

  // Return extended interface with E2E methods
  return {
    ...testbed,
    startCli: () => { /* spawn CLI subprocess */ },
    sendInput: ({ text }) => { /* write to stdin */ },
    sendKeypress: ({ key }) => { /* write escape sequence */ },
    waitForScreen: ({ screen, contains, timeout }) => { /* poll stdout */ },
    getQuestFiles: () => { /* list .dungeonmaster-quests */ },
    readQuestFile: ({ folder }) => { /* parse quest.json */ },
  };
};
```

### 3. E2E Test Location Decision

**Question**: Should E2E tests go in `packages/cli/src/startup/start-cli.integration.test.ts` or `tests/e2e/` at repo root?

**Analysis**:

| Option | Pros | Cons |
|--------|------|------|
| `packages/cli/.../start-cli.integration.test.ts` | Follows testing patterns; co-located with entry point; precedent from `start-debug.integration.test.ts`; clear ownership | Tests multiple packages; semantically tests "the system" |
| `tests/e2e/` at repo root | Clearly signals system tests; separates E2E from integration; easy glob pattern | Violates testing patterns; non-co-located; adds directory structure |

**Decision**: `packages/cli/src/startup/start-cli.integration.test.ts`

**Rationale**:
1. **Testing patterns are explicit**: Constitution says integration tests go with startup files. E2E tests for CLI flows ARE testing `start-cli.ts` entry point.
2. **Testbed provides isolation**: The `e2eTestbedCreateBroker` creates a fully runnable folder environment. From CLI's perspective, it's just running in a different project directory.
3. **Precedent exists**: `start-debug.integration.test.ts` already tests CLI subprocess behavior from the same location.
4. **YAGNI**: A `tests/e2e/` directory adds structure we don't need. If we later have E2E tests for other entry points (MCP server), they'd go with THOSE startup files.
5. **Semantic clarity via describe blocks**: `describe('start-cli E2E flows', ...)` makes intent clear within the file.

**Location**:
```
packages/cli/src/startup/
  start-cli.ts
  start-cli.integration.test.ts  # E2E tests here
```

### 4. Contracts Follow Architecture Standards

Per `get-folder-detail({ folderType: "contracts" })`:
- Use branded Zod types (not raw primitives)
- Stubs use `StubArgument<Type>` pattern
- Tests import from stubs, not contracts

```typescript
// cli-screen-name-contract.ts
export const cliScreenNameContract = z.enum([
  'menu', 'add', 'list', 'help', 'run', 'answer', 'init'
]).brand<'CliScreenName'>();
export type CliScreenName = z.infer<typeof cliScreenNameContract>;
```

### 5. Screen State Synchronization

Tests wait for specific screen states before sending next input:
- Poll stdout until pattern matches
- Configurable timeout (default from statics)
- Clear error message on timeout with last frame

```typescript
const screen = await testbed.waitForScreen({
  screen: cliScreenNameContract.parse('list'),
  contains: 'DangerFun',
  timeout: e2eTimeoutsStatics.claudeOperation,
});
```

### 6. Test Isolation via Existing Testbed

Each E2E test gets (from `installTestbedCreateBroker`):
- Fresh temp directory with unique ID
- package.json and .claude/ directory
- `runInitCommand()` sets up MCP + hooks
- `cleanup()` removes everything after test
