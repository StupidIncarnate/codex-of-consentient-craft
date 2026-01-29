# Research: E2E Testing Harness

**Feature**: 001-e2e-testing
**Date**: 2026-01-28

## Research Questions Resolved

### 1. How to Test Orchestration Layer (Not Just Widgets)

**Decision**: Create `start-e2e.ts` entry point that runs full CLI with subprocess control

**Rationale**: The existing `start-debug.ts` only renders `CliAppWidget` and tracks callback invocations. It does NOT execute the orchestration logic in `start-cli.ts` that:
- Calls `chaoswhispererSpawnStreamingBroker` after `onSpawnChaoswhisperer` fires
- Parses the signal from Claude's response
- Decides next screen based on signal (e.g., `needs-user-input` → answer screen)
- Writes quest files via MCP tools

For true E2E testing, we must spawn the full CLI as a subprocess and control it via stdin/stdout.

**Alternatives Considered**:
- Mock the orchestration layer → Rejected: Defeats purpose of E2E testing
- Extend debug mode to call brokers → Rejected: Would couple test infrastructure to production code paths
- Use process.stdout interception → Rejected: Ink uses raw terminal mode, difficult to intercept cleanly

### 2. How to Integrate Real MCP Server

**Decision**: Configure `.mcp.json` in test project directory and let Claude CLI discover it

**Rationale**: The MCP server is started by Claude CLI based on `.mcp.json` configuration. The harness will:
1. Create isolated test project directory
2. Copy/link `.mcp.json` from repo root
3. Run MCP server path relative to test project
4. Claude CLI automatically connects to configured MCP

**Implementation**:
```typescript
// In test setup
testbed.writeFile({
  relativePath: '.mcp.json',
  content: JSON.stringify({
    mcpServers: {
      dungeonmaster: {
        type: 'stdio',
        command: 'npx',
        args: ['tsx', `${repoRoot}/packages/mcp/src/index.ts`]
      }
    }
  })
});
```

**Alternatives Considered**:
- Start MCP server separately → Rejected: Claude CLI expects to manage MCP lifecycle
- Mock MCP responses → Rejected: Defeats purpose of E2E testing real MCP integration

### 3. How to Detect Screen Transitions

**Decision**: Parse CLI stdout for screen indicators using regex patterns

**Rationale**: The CLI renders different prompts/content for each screen:
- Menu: Contains "Add", "Run", "List", "Help", "Exit"
- Add: Contains "What would you like to build"
- List: Contains quest names
- Answer: Contains question text from `signal-back`

The harness will provide `waitForScreen(name, options)` that polls stdout until pattern matches.

**Screen Detection Patterns**:
```typescript
const screenPatterns = {
  menu: /Add.*Run.*List/s,
  add: /What would you like to build/,
  list: /dungeonmaster-quests/,  // or specific quest names
  answer: /\?.*$/, // Question ends with ?
};
```

**Alternatives Considered**:
- Use debug mode getScreen → Rejected: Debug mode doesn't run orchestration
- Parse ANSI codes → Rejected: Complex and brittle
- Add explicit markers to CLI output → Considered: Would require CLI changes, but cleaner

### 4. How to Send Input to Running CLI

**Decision**: Use subprocess stdin.write() with appropriate escape sequences

**Rationale**: The CLI uses Ink which reads from stdin. We can:
1. Spawn CLI with `stdio: ['pipe', 'pipe', 'pipe']`
2. Write text via `process.stdin.write(text)`
3. Send Enter via `process.stdin.write('\r')`
4. Send escape keys via `process.stdin.write('\x1B')`, arrows via `process.stdin.write('\x1B[A')`

**Key escape codes** (from `debug-keys-statics.ts`):
```typescript
{
  enter: '\r',
  escape: '\x1B',
  up: '\x1B[A',
  down: '\x1B[B',
  backspace: '\x7F',
  tab: '\t'
}
```

**Alternatives Considered**:
- Use PTY library (node-pty) → Considered: More realistic but adds complexity
- Extend debug mode → Rejected: Debug mode can't test orchestration

### 5. How to Handle Claude CLI Timeouts

**Decision**: Configure per-operation timeout with default 60s, allow override

**Rationale**: Claude operations can take varying time:
- Simple quest creation: 10-30s
- Complex reasoning: 30-60s
- MCP tool calls: Variable

The harness will:
1. Default timeout: 60s per Claude operation
2. Per-test override: `{ timeout: 90000 }`
3. Clear error message on timeout with last known state

**Alternatives Considered**:
- Fixed timeout → Rejected: Too inflexible
- No timeout → Rejected: Tests would hang on failures

### 6. How to Verify Quest File Creation

**Decision**: Use file system assertions with polling

**Rationale**: After Claude creates a quest via `add-quest` MCP tool, a file appears in `.dungeonmaster-quests/`. The harness will:
1. Poll for file existence (quest folder may take time to create)
2. Parse JSON content
3. Provide assertion helpers: `expect(questFile).toHaveTitle('DangerFun')`

**Quest file structure** (from research):
```typescript
{
  id: string,
  folder: string,  // "001-danger-fun"
  title: string,   // "DangerFun"
  status: string,  // "in_progress"
  createdAt: string,
  // ... other fields
}
```

**Alternatives Considered**:
- Mock file system → Rejected: Defeats E2E purpose
- Check via MCP get-quest → Considered: Valid alternative, but file check is more direct

### 7. How to Assert Screen Content Exclusions

**Decision**: Provide negative assertion helper: `expect(screen).not.toContain(prompt)`

**Rationale**: One test requirement is verifying the user prompt is NOT visible after submission. The harness will capture the current screen frame and support both positive and negative assertions:
- `expect(screen).toContain('DangerFun')` - Must be present
- `expect(screen).not.toContain('Testing cli workflow')` - Must NOT be present

**Implementation**:
```typescript
const screen = await harness.getScreen();
expect(screen.frame).not.toMatch(/Testing cli workflow/);
```

## Existing Code to Leverage

### From `packages/cli/src/startup/start-debug.integration.test.ts`

The `createDebugClient()` pattern provides a working example of subprocess communication:
- Spawns process with stdio pipes
- Line-delimited JSON protocol
- Resolver queue for async responses
- Timeout handling

### From `@dungeonmaster/testing`

- `installTestbedCreateBroker` - Creates isolated temp directories
- `BaseNameStub` - Generates unique test names
- Jest mock auto-reset - No manual cleanup needed

### From `packages/cli/src/statics/debug-keys/debug-keys-statics.ts`

- Key escape codes for terminal input simulation

## Dependencies Required

No new npm dependencies needed. Uses:
- `child_process.spawn` (Node.js built-in)
- `jest` (existing)
- `@dungeonmaster/testing` (existing)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Claude API rate limits | Run E2E tests sparingly (not on every commit) |
| Flaky tests due to timing | Use polling with sensible timeouts, not fixed delays |
| MCP server startup time | Warm up MCP in beforeAll, reuse across tests |
| Test isolation failures | Each test gets fresh temp directory |
| Claude response variability | Use explicit instructions ("Call it DangerFun", "Ask me the question") |
