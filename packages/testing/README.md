# @dungeonmaster/testing

Testing utilities and helpers for Dungeonmaster projects.

## Installation

This package is included as part of the Dungeonmaster monorepo.

```bash
npm install @dungeonmaster/testing
```

## E2E Testing Harness

The E2E testing harness enables full integration testing of CLI user flows with real MCP server integration and Claude headless mode.

### Quick Start

```typescript
import { e2eTestbedCreateBroker, BaseNameStub, CliScreenNameStub, ScreenFrameStub } from '@dungeonmaster/testing';

describe('CLI E2E', () => {
  it('creates a quest from user input', async () => {
    // Setup
    const testbed = e2eTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'my-e2e-test' }),
    });

    // Start CLI
    await testbed.startCli();
    expect(testbed.getScreen().name).toBe('menu');

    // Navigate to Add screen
    await testbed.sendKeypress({ key: 'enter' });
    await testbed.waitForScreen({
      screen: CliScreenNameStub({ value: 'add' }),
      timeout: 10000,
    });

    // Enter input
    await testbed.sendInput({
      text: ScreenFrameStub({ value: 'Create a simple quest' }),
    });
    await testbed.sendKeypress({ key: 'enter' });

    // Wait for list screen with quest
    const listScreen = await testbed.waitForScreen({
      screen: CliScreenNameStub({ value: 'list' }),
      contains: ScreenFrameStub({ value: 'quest' }),
      timeout: 90000,
    });

    // Verify quest file was created
    const quests = testbed.getQuestFiles();
    expect(quests.length).toBeGreaterThanOrEqual(1);

    // Cleanup
    testbed.stopCli();
    testbed.cleanup();
  }, 120000);
});
```

### API Reference

#### `e2eTestbedCreateBroker({ baseName })`

Creates an E2E test environment with CLI control methods.

**Parameters:**
- `baseName: BaseName` - Unique identifier for the test (used in temp directory name)

**Returns:** `E2ETestbed` with the following methods:

| Method | Description |
|--------|-------------|
| `startCli()` | Spawns CLI subprocess and waits for startup |
| `stopCli()` | Terminates CLI subprocess |
| `sendInput({ text })` | Sends text input to CLI stdin |
| `sendKeypress({ key })` | Sends keypress (enter, escape, up, down, backspace, tab) |
| `getScreen()` | Returns current screen state (name, frame, capturedAt) |
| `waitForScreen({ screen, contains?, excludes?, timeout? })` | Polls until screen matches criteria |
| `getQuestFiles()` | Lists quest folders in `.dungeonmaster-quests/` |
| `readQuestFile({ folder })` | Reads and parses quest.json from folder |
| `getFirstQuest()` | Convenience method to get first quest |
| `cleanup()` | Removes temp directory (inherited from install testbed) |

### Screen Types

The testbed detects these CLI screens:

- `menu` - Main menu with Add, Run, List, Init options
- `add` - Input prompt for new quest description
- `list` - Quest list display
- `answer` - Claude's question prompt (needs-user-input signal)
- `init` - Initialize Dungeonmaster screen
- `run` - Quest execution screen
- `help` - Help screen

### Timeout Configuration

Default timeouts are defined in `e2eTimeoutsStatics`:

| Timeout | Value | Use |
|---------|-------|-----|
| `defaultWait` | 30s | Screen transitions |
| `claudeOperation` | 90s | Claude API calls |
| `pollInterval` | 100ms | Screen polling |
| `processStartup` | 5s | CLI startup |

Override per-call:
```typescript
await testbed.waitForScreen({
  screen: CliScreenNameStub({ value: 'list' }),
  timeout: 120000, // 2 minutes
});
```

### Key Codes

Supported key names for `sendKeypress`:

- `enter` - Submit/select
- `escape` - Back/cancel
- `up` - Navigate up
- `down` - Navigate down
- `backspace` - Delete character
- `tab` - Tab key

### Environment Setup

The E2E testbed automatically sets up a complete test environment:

1. Creates isolated temp directory with package.json
2. Sets up MCP configuration (`.mcp.json`)
3. Sets up Claude hooks (`.claude/settings.json`)
4. Spawns CLI via node-pty for proper TTY emulation

### Best Practices

1. **Unique base names**: Use descriptive base names to avoid conflicts
2. **Always cleanup**: Call `testbed.cleanup()` after tests
3. **Handle timeouts**: Claude operations are non-deterministic; use appropriate timeouts
4. **Test isolation**: Each test gets its own temp directory
5. **No beforeEach/afterEach**: Per testing patterns, all setup is inline

### Troubleshooting

**Test timeout waiting for screen**
- Verify Claude CLI is available: `which claude`
- Check network connectivity for Claude API
- Inspect last output in timeout error message

**CLI process not started**
- Ensure `startCli()` is called before `sendInput` or `sendKeypress`
- Check that `stopCli()` wasn't called prematurely

**Quest files not found**
- Wait for Claude operation to complete before checking quest files
- Verify the prompt instructs Claude to create a quest

## Install Testbed

Lower-level utility for testing installation flows.

```typescript
import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';

const testbed = installTestbedCreateBroker({
  baseName: BaseNameStub({ value: 'install-test' }),
});

// testbed.projectPath - isolated temp directory
// testbed.writeFile({ relativePath, content })
// testbed.readFile({ relativePath })
// testbed.runInitCommand() - runs dungeonmaster init
// testbed.cleanup()
```

## Mock Utilities

Child process mocker for unit testing:

```typescript
import { childProcessMockerAdapter, MockSpawnResultStub } from '@dungeonmaster/testing';

const { spawnSyncMock } = childProcessMockerAdapter({
  spawnSync: MockSpawnResultStub({
    stdout: 'command output',
    stderr: '',
    status: 0,
  }),
});
```

## Contract Stubs

Pre-built stubs for common contracts:

```typescript
import {
  BaseNameStub,
  FileNameStub,
  FileContentStub,
  RelativePathStub,
  CliScreenNameStub,
  ScreenFrameStub,
  E2EScreenStateStub,
} from '@dungeonmaster/testing';
```
