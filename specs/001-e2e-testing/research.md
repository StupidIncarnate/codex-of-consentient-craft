# Research: E2E Testing Harness

**Feature**: 001-e2e-testing
**Date**: 2026-01-28

## Research Questions Resolved

### 1. How to Setup MCP and Hooks in Test Environment

**Decision**: Use existing `testbed.runInitCommand()` which runs `dungeonmaster init`

**Rationale**: The CLI has a built-in init command that properly configures:
- `.mcp.json` - MCP server configuration
- `.claude/settings.json` - Hooks configuration
- `.dungeonmaster` - CLI config file
- `eslint.config.js` - ESLint setup

Manual .mcp.json copying would miss hooks setup and other init logic.

**Existing code** (from `install-testbed-create-broker.ts:144-183`):
```typescript
runInitCommand: (): ReturnType<InstallTestbed['runInitCommand']> => {
  const result = childProcessExecSyncAdapter({
    command: 'dungeonmaster init',
    options: { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe' },
  });
  return { exitCode, stdout, stderr };
}
```

**Alternatives Considered**:
- Copy .mcp.json manually → Rejected: Misses hooks setup per user feedback
- Start MCP server separately → Rejected: Claude CLI manages MCP lifecycle

### 2. How to Test Orchestration Layer (Not Just Widgets)

**Decision**: Spawn full CLI as subprocess and control via stdin/stdout

**Rationale**: The existing `start-debug.ts` only renders `CliAppWidget` and tracks callback invocations. It does NOT execute the orchestration logic in `start-cli.ts` that:
- Calls `chaoswhispererSpawnStreamingBroker` after `onSpawnChaoswhisperer` fires
- Parses the signal from Claude's response
- Decides next screen based on signal (e.g., `needs-user-input` → answer screen)
- Writes quest files via MCP tools

For true E2E testing, we must spawn the CLI subprocess.

**Alternatives Considered**:
- Extend debug mode to call brokers → Rejected: Would couple test infrastructure to production code paths
- Mock the orchestration layer → Rejected: Defeats purpose of E2E testing

### 3. Where Do E2E Tests Live?

**Decision**: Co-located with `start-cli.ts` as `.integration.test.ts`

**Analysis of Options**:

| Option | Pros | Cons |
|--------|------|------|
| `packages/cli/.../start-cli.integration.test.ts` | Follows testing patterns strictly; co-located with entry point; precedent from `start-debug.integration.test.ts`; clear ownership | Tests involve multiple packages; semantically tests "the system" |
| `tests/e2e/` at repo root | Clearly signals system tests; separates E2E from integration; easy glob pattern | Violates testing patterns; non-co-located; adds directory structure to maintain |

**Rationale**:
1. **Testing patterns are explicit**: Per `get-testing-patterns()`: "Integration tests are ONLY for startup files." E2E tests for CLI flows ARE testing `start-cli.ts` - that's the entry point.
2. **Testbed creates full isolation**: The `e2eTestbedCreateBroker` creates a fully runnable folder environment with MCP + hooks. From CLI's perspective, it's just running in a different project directory.
3. **Precedent exists**: `start-debug.integration.test.ts` already tests CLI subprocess behavior from the same location.
4. **YAGNI**: A `tests/e2e/` directory adds structure we don't need now. If we later have E2E tests for other entry points (MCP server), they'd go with THOSE startup files.
5. **Semantic clarity via describe blocks**: `describe('start-cli E2E flows', ...)` makes intent clear within the file.

**Location**: `packages/cli/src/startup/start-cli.integration.test.ts`

**Alternatives Considered**:
- `tests/e2e/` at repo root → Rejected: Violates testing patterns; adds unnecessary directory structure
- In `packages/testing/` → Rejected: Tests should be near code they test

### 4. Contract Standards for This Feature

**Decision**: Follow full contract standards with branded Zod types and stubs

**Rationale**: Per `get-folder-detail({ folderType: "contracts" })`:
- ALL contracts MUST use `.brand<'TypeName'>()` on primitives
- Stubs use `StubArgument<Type>` pattern with spread operator
- Tests import from `.stub.ts` files, NOT from `-contract.ts` files

**Contracts needed**:
```typescript
// cli-screen-name-contract.ts
export const cliScreenNameContract = z.enum([
  'menu', 'add', 'list', 'help', 'run', 'answer', 'init'
]).brand<'CliScreenName'>();
export type CliScreenName = z.infer<typeof cliScreenNameContract>;

// screen-frame-contract.ts
export const screenFrameContract = z.string().brand<'ScreenFrame'>();
export type ScreenFrame = z.infer<typeof screenFrameContract>;

// e2e-testbed-contract.ts
export const e2eTestbedContract = installTestbedContract.extend({
  startCli: z.function(),
  sendInput: z.function(),
  // ... E2E methods
});
```

### 5. Extending vs Creating New Testbed

**Decision**: Create new `e2eTestbedCreateBroker` that composes `installTestbedCreateBroker`

**Rationale**: Per "Extension Over Creation Philosophy":
> If a domain file exists, EXTEND it with options - never create variant files.

However, E2E testbed is a different domain (new action) from install testbed:
- Install testbed: Tests installation system
- E2E testbed: Tests CLI user flows

This is a case of "New action (user-delete when only user-fetch exists)".

**Pattern**:
```typescript
export const e2eTestbedCreateBroker = ({ baseName }: { baseName: BaseName }): E2ETestbed => {
  const testbed = installTestbedCreateBroker({ baseName });
  testbed.runInitCommand();  // Setup MCP + hooks

  return {
    ...testbed,  // Include all install testbed methods
    // Add E2E-specific methods
    startCli: () => { /* spawn subprocess */ },
    waitForScreen: ({ screen, contains }) => { /* poll stdout */ },
    // ...
  };
};
```

### 6. Screen Detection Strategy

**Decision**: Poll stdout for screen-specific patterns

**Rationale**: Each CLI screen has characteristic content:
- Menu: Contains "Add", "Run", "List"
- Add: Contains "What would you like to build"
- List: Contains quest names or ".dungeonmaster-quests"
- Answer: Contains question text ending with "?"

**Implementation**:
```typescript
waitForScreen: async ({ screen, contains, timeout = e2eTimeoutsStatics.defaultWait }) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const frame = await getLatestFrame();
    if (matchesScreen(frame, screen) && (!contains || frame.includes(contains))) {
      return { name: screen, frame, capturedAt: Date.now() };
    }
    await sleep(e2eTimeoutsStatics.pollInterval);
  }
  throw new E2ETimeoutError(screen, timeout, lastFrame);
}
```

### 7. Timeout Configuration

**Decision**: Use statics for timeout values, allow per-call override

**Rationale**: Per architecture, magic numbers go in `statics/`. Claude operations have variable timing.

**Statics** (`e2e-timeouts-statics.ts`):
```typescript
export const e2eTimeoutsStatics = {
  defaultWait: 30000,       // 30s for screen transitions
  claudeOperation: 90000,   // 90s for Claude to respond
  pollInterval: 100,        // 100ms between polls
  processStartup: 5000,     // 5s for CLI to start
} as const;
```

### 8. Proxy Pattern for E2E Broker

**Decision**: Empty proxy since E2E broker has no mock-able dependencies

**Rationale**: Per `get-testing-patterns()`:
> Mock only at I/O boundaries. Everything else runs REAL.

The E2E testbed broker:
- Uses real file system (via testbed)
- Spawns real CLI subprocess
- No npm packages to mock at adapter level

**Proxy**:
```typescript
export const e2eTestbedCreateBrokerProxy = (): Record<PropertyKey, never> => ({});
```

## Existing Code to Leverage

### From `packages/testing/src/brokers/install-testbed/create/`

- `installTestbedCreateBroker` - Creates isolated temp directories with:
  - `projectPath` - Unique temp directory
  - `writeFile()`, `readFile()` - File operations
  - `runInitCommand()` - Runs `dungeonmaster init`
  - `getClaudeSettings()`, `getMcpConfig()` - Read configs
  - `cleanup()` - Remove temp directory

### From `packages/cli/src/startup/start-debug.integration.test.ts`

- `createDebugClient()` pattern - Subprocess communication:
  - Spawns process with stdio pipes
  - Line-delimited JSON protocol
  - Resolver queue for async responses

### From `packages/testing/src/statics/integration-environment/`

- `integrationEnvironmentStatics` - Base paths and constants for test isolation

## Dependencies Required

No new npm dependencies. Uses existing:
- `child_process.spawn` (Node.js built-in)
- `jest` (existing)
- `@dungeonmaster/testing` (existing)
- `zod` (existing)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Claude API rate limits | Run E2E tests sparingly (not on every commit), use `jest --testPathPattern` |
| Flaky tests due to timing | Use polling with configurable timeouts via statics |
| MCP server startup time | Init command handles this; testbed.runInitCommand() blocks until complete |
| Test isolation failures | Each test gets fresh temp directory via existing testbed pattern |
| Claude response variability | Use explicit instructions ("Call it DangerFun", "Ask me the question") |
