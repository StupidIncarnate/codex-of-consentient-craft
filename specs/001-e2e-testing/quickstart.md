# Quickstart: E2E Testing Harness

**Feature**: 001-e2e-testing
**Date**: 2026-01-28

## Overview

The E2E testing harness enables full integration testing of CLI user flows with real MCP server integration and Claude headless mode. It extends the existing `installTestbedCreateBroker` and uses `dungeonmaster init` for proper environment setup.

## Writing Your First E2E Test

### 1. Create Integration Test File

E2E tests are integration tests that go with the startup file they test:

```typescript
// packages/cli/src/startup/start-cli.integration.test.ts
import { e2eTestbedCreateBroker } from '@dungeonmaster/testing';
import { BaseNameStub } from '@dungeonmaster/testing/contracts';
import { CliScreenNameStub } from '@dungeonmaster/testing/contracts';

type E2ETestbed = ReturnType<typeof e2eTestbedCreateBroker>;

describe('start-cli E2E', () => {
  // Tests go here
});
```

### 2. Write BDD-Style Test (Inline Setup/Teardown)

Per testing patterns, NO beforeEach/afterEach hooks. All setup is inline:

```typescript
describe('quest creation', () => {
  it('VALID: {prompt without followup} => creates quest and shows list', async () => {
    // SETUP - inline per test
    const testbed = e2eTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'quest-creation' }),
    });

    // GIVEN: CLI is started on menu screen
    await testbed.startCli();
    const menuScreen = await testbed.getScreen();
    expect(menuScreen.name).toBe('menu');

    // WHEN: User navigates to Add and enters quest description
    await testbed.sendKeypress({ key: 'enter' }); // Select "Add"
    await testbed.sendInput({
      text: 'Testing cli workflow, make me a quest without any followup questions. Call it DangerFun',
    });
    await testbed.sendKeypress({ key: 'enter' }); // Submit

    // THEN: CLI shows list screen with new quest
    const listScreen = await testbed.waitForScreen({
      screen: CliScreenNameStub({ value: 'list' }),
      contains: 'DangerFun',
      timeout: 90000,
    });

    // AND: Quest file was created
    const quests = testbed.getQuestFiles();
    expect(quests.length).toBe(1);
    const quest = testbed.readQuestFile({ folder: quests[0] });
    expect(quest.title).toContain('DangerFun');

    // AND: Prompt is NOT visible on screen (known bug - should fail)
    expect(listScreen.frame).not.toContain('Testing cli workflow');

    // CLEANUP - inline per test
    testbed.stopCli();
    testbed.cleanup();
  }, 120000); // 2 minute timeout
});
```

### 3. Run the Test

```bash
# Run E2E integration test
npm test -- packages/cli/src/startup/start-cli.integration.test.ts

# Run with verbose output
npm test -- packages/cli/src/startup/start-cli.integration.test.ts --verbose

# Run specific test by name
npm test -- packages/cli/src/startup/start-cli.integration.test.ts -t "DangerFun"
```

## Common Patterns

### Navigating the Menu

```typescript
// Select "Add" (first item, just press enter)
await testbed.sendKeypress({ key: 'enter' });

// Select "Run" (second item)
await testbed.sendKeypress({ key: 'down' });
await testbed.sendKeypress({ key: 'enter' });

// Select "List" (third item)
await testbed.sendKeypress({ key: 'down' });
await testbed.sendKeypress({ key: 'down' });
await testbed.sendKeypress({ key: 'enter' });
```

### Waiting for Claude Operations

```typescript
// Wait for screen with extended timeout for Claude
const screen = await testbed.waitForScreen({
  screen: CliScreenNameStub({ value: 'list' }),
  contains: 'MyQuestName',
  timeout: 90000, // 90s for Claude response
});
```

### Verifying Quest Creation

```typescript
// Get all quest folders
const quests = testbed.getQuestFiles();
expect(quests).toHaveLength(1);

// Read and verify quest content
const quest = testbed.readQuestFile({ folder: quests[0] });
expect(quest.title).toContain('Expected Title');
expect(quest.status).toBe('in_progress');
```

### Testing MCP Signal Flow (User Questions)

```typescript
it('VALID: {prompt requesting question} => shows answer screen', async () => {
  const testbed = e2eTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'signal-flow' }),
  });
  await testbed.startCli();

  // Navigate to Add
  await testbed.sendKeypress({ key: 'enter' });

  // Ask Claude to trigger needs-user-input signal
  await testbed.sendInput({
    text: "Testing cli workflow. I want to do a simple hello world. Ask me the following question using the mcp workflow 'Why hello world?'",
  });
  await testbed.sendKeypress({ key: 'enter' });

  // Wait for answer screen with the question
  const answerScreen = await testbed.waitForScreen({
    screen: CliScreenNameStub({ value: 'answer' }),
    contains: 'Why hello world?',
    timeout: 90000,
  });

  expect(answerScreen.frame).toContain('Why hello world?');

  testbed.stopCli();
  testbed.cleanup();
}, 120000);
```

### Negative Assertions (Content Should NOT Appear)

```typescript
// Verify something is NOT on screen
expect(screen.frame).not.toContain('Error');
expect(screen.frame).not.toMatch(/unauthorized/i);

// Use waitForScreen with excludes
const screen = await testbed.waitForScreen({
  screen: CliScreenNameStub({ value: 'list' }),
  excludes: 'Testing cli workflow', // Must NOT contain this
});
```

## Environment Setup

The harness automatically handles setup via `dungeonmaster init`:

```typescript
const testbed = e2eTestbedCreateBroker({ baseName });
// ↓ Internally runs:
// 1. installTestbedCreateBroker() - creates temp dir, package.json, .claude/
// 2. testbed.runInitCommand() - runs 'dungeonmaster init'
//    - Creates .mcp.json (MCP server config)
//    - Creates .claude/settings.json (hooks)
//    - Creates .dungeonmaster (CLI config)
```

## Timeout Configuration

Timeouts are in `e2e-timeouts-statics.ts`:

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

## Troubleshooting

### Test Timeout

If tests timeout, check:
1. Claude CLI is available in PATH: `which claude`
2. MCP server path is correct in `.mcp.json`
3. Network connectivity for Claude API

Debug by capturing last frame:
```typescript
try {
  await testbed.waitForScreen({ screen: 'list', timeout: 30000 });
} catch (error) {
  if (error instanceof E2ETimeoutError) {
    console.log('Last frame:', error.lastFrame);
  }
  throw error;
}
```

### Init Command Failures

Check init output:
```typescript
const testbed = e2eTestbedCreateBroker({ baseName });
const initResult = testbed.runInitCommand();
console.log('Init stdout:', initResult.stdout);
console.log('Init stderr:', initResult.stderr);
```

### Process Cleanup Issues

If tests leave orphan processes:
```bash
# Find and kill orphan CLI processes
pkill -f "start-cli"
```

## API Reference

See [data-model.md](./data-model.md) for E2ETestbed interface and contract definitions.
