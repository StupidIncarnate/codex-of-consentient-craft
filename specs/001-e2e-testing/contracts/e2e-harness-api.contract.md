# Contract: E2E Harness API

**Purpose**: Defines the public API for the E2E test harness broker

## API Methods

### createContext

Creates an isolated test environment.

```typescript
e2eHarnessBroker.createContext({
  baseName: string,           // Base name for temp directory
  timeout?: number,           // Default timeout in ms (default: 60000)
  mcpServerPath?: string,     // Path to MCP server (default: auto-detect)
}): Promise<E2ETestContext>
```

**Returns**: E2ETestContext with initialized temp directory, .mcp.json, package.json

### startCli

Spawns the CLI as a subprocess.

```typescript
e2eHarnessBroker.startCli({
  context: E2ETestContext,
  initialScreen?: CliScreenName,  // Start on specific screen (default: 'menu')
}): Promise<void>
```

**Side Effects**: Sets `context.cliProcess` to spawned process

### sendInput

Sends text input to the CLI.

```typescript
e2eHarnessBroker.sendInput({
  context: E2ETestContext,
  text: string,               // Text to type
}): Promise<E2EScreenState>
```

**Returns**: Screen state after input is processed

### sendKeypress

Sends a keypress to the CLI.

```typescript
e2eHarnessBroker.sendKeypress({
  context: E2ETestContext,
  key: 'enter' | 'escape' | 'up' | 'down' | 'backspace' | 'tab',
}): Promise<E2EScreenState>
```

**Returns**: Screen state after keypress

### getScreen

Captures current screen state.

```typescript
e2eHarnessBroker.getScreen({
  context: E2ETestContext,
}): Promise<E2EScreenState>
```

**Returns**: Current screen name and frame content

### waitForScreen

Waits for CLI to reach a specific screen state.

```typescript
e2eHarnessBroker.waitForScreen({
  context: E2ETestContext,
  screen: CliScreenName,          // Target screen
  contains?: string | RegExp,     // Optional content to match
  excludes?: string | RegExp,     // Optional content to NOT match
  timeout?: number,               // Override default timeout
}): Promise<E2EScreenState>
```

**Returns**: Screen state when conditions are met
**Throws**: TimeoutError if screen not reached within timeout

### getQuestFiles

Lists quest files in the test project.

```typescript
e2eHarnessBroker.getQuestFiles({
  context: E2ETestContext,
}): Promise<string[]>
```

**Returns**: Array of quest folder names (e.g., ['001-danger-fun'])

### readQuestFile

Reads and parses a quest file.

```typescript
e2eHarnessBroker.readQuestFile({
  context: E2ETestContext,
  folder: string,             // Quest folder name
}): Promise<QuestFile>
```

**Returns**: Parsed quest.json content
**Throws**: FileNotFoundError if quest doesn't exist

### cleanup

Cleans up test environment.

```typescript
e2eHarnessBroker.cleanup({
  context: E2ETestContext,
}): Promise<void>
```

**Side Effects**:
- Kills CLI subprocess if running
- Removes temp directory
- Sets `context.cliProcess` to null

## Example Usage

```typescript
describe('Quest Creation E2E', () => {
  let context: E2ETestContext;

  beforeEach(async () => {
    context = await e2eHarnessBroker.createContext({
      baseName: 'quest-creation',
    });
    await e2eHarnessBroker.startCli({ context });
  });

  afterEach(async () => {
    await e2eHarnessBroker.cleanup({ context });
  });

  it('creates quest without followup questions', async () => {
    // Navigate to Add
    await e2eHarnessBroker.sendKeypress({ context, key: 'enter' });

    // Enter prompt
    await e2eHarnessBroker.sendInput({
      context,
      text: 'Testing cli workflow, make me a quest without any followup questions. Call it DangerFun',
    });
    await e2eHarnessBroker.sendKeypress({ context, key: 'enter' });

    // Wait for list screen with quest
    const screen = await e2eHarnessBroker.waitForScreen({
      context,
      screen: 'list',
      contains: 'DangerFun',
      timeout: 90000,  // Claude operations can take time
    });

    // Verify prompt is NOT on screen (known bug should fail here)
    expect(screen.frame).not.toContain('Testing cli workflow');

    // Verify quest file
    const quests = await e2eHarnessBroker.getQuestFiles({ context });
    expect(quests.length).toBe(1);

    const quest = await e2eHarnessBroker.readQuestFile({
      context,
      folder: quests[0],
    });
    expect(quest.title).toContain('DangerFun');
  });
});
```

## Error Types

```typescript
// Thrown when waitForScreen times out
export class E2ETimeoutError extends Error {
  constructor(
    public screen: CliScreenName,
    public timeout: number,
    public lastFrame: string,
  ) {
    super(`Timeout waiting for screen '${screen}' after ${timeout}ms`);
  }
}

// Thrown when quest file not found
export class E2EFileNotFoundError extends Error {
  constructor(public path: string) {
    super(`Quest file not found: ${path}`);
  }
}

// Thrown when CLI process exits unexpectedly
export class E2EProcessError extends Error {
  constructor(
    public exitCode: number,
    public stderr: string,
  ) {
    super(`CLI process exited with code ${exitCode}: ${stderr}`);
  }
}
```
