# Quickstart: E2E Testing Harness

**Feature**: 001-e2e-testing
**Date**: 2026-01-28

## Overview

The E2E testing harness enables full integration testing of CLI user flows with real MCP server integration and Claude headless mode.

## Writing Your First E2E Test

### 1. Create Test File

Create a new file in `tests/e2e/`:

```typescript
// tests/e2e/my-feature.e2e.test.ts
import { e2eHarnessBroker } from '@dungeonmaster/testing';
import type { E2ETestContext } from '@dungeonmaster/testing';

describe('My Feature E2E', () => {
  let context: E2ETestContext;

  beforeEach(async () => {
    context = await e2eHarnessBroker.createContext({
      baseName: 'my-feature-test',
    });
    await e2eHarnessBroker.startCli({ context });
  }, 30000); // Increase timeout for setup

  afterEach(async () => {
    await e2eHarnessBroker.cleanup({ context });
  });

  // Tests go here
});
```

### 2. Write BDD-Style Test

```typescript
it('should create a quest from the Add screen', async () => {
  // GIVEN: CLI is on menu screen
  const menuScreen = await e2eHarnessBroker.getScreen({ context });
  expect(menuScreen.name).toBe('menu');

  // WHEN: User navigates to Add and enters a quest description
  await e2eHarnessBroker.sendKeypress({ context, key: 'enter' }); // Select "Add"
  await e2eHarnessBroker.sendInput({ context, text: 'Build a REST API' });
  await e2eHarnessBroker.sendKeypress({ context, key: 'enter' }); // Submit

  // THEN: CLI shows list screen with new quest
  const listScreen = await e2eHarnessBroker.waitForScreen({
    context,
    screen: 'list',
    timeout: 90000,
  });
  expect(listScreen.frame).toContain('REST API');
}, 120000); // 2 minute timeout for Claude operations
```

### 3. Run the Test

```bash
# Run all E2E tests
npm test -- tests/e2e/

# Run specific E2E test
npm test -- tests/e2e/my-feature.e2e.test.ts

# Run with verbose output
npm test -- tests/e2e/ --verbose
```

## Common Patterns

### Navigating the Menu

```typescript
// Select "Add" (first item, just press enter)
await e2eHarnessBroker.sendKeypress({ context, key: 'enter' });

// Select "Run" (second item)
await e2eHarnessBroker.sendKeypress({ context, key: 'down' });
await e2eHarnessBroker.sendKeypress({ context, key: 'enter' });

// Select "List" (third item)
await e2eHarnessBroker.sendKeypress({ context, key: 'down' });
await e2eHarnessBroker.sendKeypress({ context, key: 'down' });
await e2eHarnessBroker.sendKeypress({ context, key: 'enter' });
```

### Waiting for Claude Operations

```typescript
// Wait for screen with extended timeout
const screen = await e2eHarnessBroker.waitForScreen({
  context,
  screen: 'list',
  contains: 'MyQuestName',  // Wait until this text appears
  timeout: 90000,            // 90 seconds for Claude
});
```

### Verifying Quest Creation

```typescript
// Get all quest folders
const quests = await e2eHarnessBroker.getQuestFiles({ context });
expect(quests).toHaveLength(1);

// Read specific quest
const quest = await e2eHarnessBroker.readQuestFile({
  context,
  folder: quests[0],
});
expect(quest.title).toContain('Expected Title');
expect(quest.status).toBe('in_progress');
```

### Testing MCP Signal Flow

```typescript
// Ask Claude to trigger needs-user-input signal
await e2eHarnessBroker.sendInput({
  context,
  text: 'Ask me a clarifying question using the signal-back MCP tool',
});
await e2eHarnessBroker.sendKeypress({ context, key: 'enter' });

// Wait for answer screen
const answerScreen = await e2eHarnessBroker.waitForScreen({
  context,
  screen: 'answer',
  timeout: 60000,
});

// Verify question is displayed
expect(answerScreen.frame).toMatch(/\?/);  // Contains a question
```

### Negative Assertions (Content Should NOT Appear)

```typescript
const screen = await e2eHarnessBroker.getScreen({ context });

// Verify something is NOT on screen
expect(screen.frame).not.toContain('Error');
expect(screen.frame).not.toMatch(/unauthorized/i);
```

## Jest Configuration

For E2E tests, increase timeouts in jest.config.js:

```javascript
module.exports = {
  // ... other config
  testTimeout: 120000,  // 2 minutes default for E2E
  testMatch: ['**/tests/e2e/**/*.e2e.test.ts'],
};
```

Or use per-file configuration:

```typescript
// At top of test file
jest.setTimeout(120000);
```

## Troubleshooting

### Test Timeout

If tests timeout, check:
1. Claude CLI is available in PATH
2. MCP server starts correctly
3. Network connectivity for Claude API

### Screen Detection Failures

If `waitForScreen` fails:
```typescript
// Debug: Print current screen
const screen = await e2eHarnessBroker.getScreen({ context });
console.log('Current screen:', screen.name);
console.log('Frame:', screen.frame);
```

### Process Cleanup Issues

If tests leave orphan processes:
```bash
# Find and kill orphan CLI processes
pkill -f "start-cli"
pkill -f "start-e2e"
```

## API Reference

See [contracts/e2e-harness-api.contract.md](./contracts/e2e-harness-api.contract.md) for complete API documentation.
