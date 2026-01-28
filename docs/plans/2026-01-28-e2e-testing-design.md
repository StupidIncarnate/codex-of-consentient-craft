# E2E Testing Design for Dungeonmaster CLI

## Overview

This design establishes a proper E2E testing setup for the Dungeonmaster CLI that tests user flows against the terminal runtime with actual MCP and hooks integrations running in headless Claude mode.

## Problem

The existing debug mode (`start-debug.ts`) only tests the widget layer via `ink-testing-library`. It cannot test:

- Orchestration logic in `start-cli.ts` (the recursive loop handling broker results)
- What happens after `chaoswhispererSpawnStreamingBroker` returns
- Screen transitions based on Claude signals
- Quest creation via MCP integration
- The full user experience from input to file creation

## Solution

Create a PTY-based E2E test harness that:

1. Spawns the full `dungeonmaster` CLI in an isolated temp directory
2. Simulates user keyboard input via pseudo-terminal (required for Ink)
3. Captures screen output for assertions
4. Waits for Claude completion with proper timeouts
5. Asserts on both screen state and file system state

## Directory Structure

```
/e2e/
  jest.config.js              # Separate Jest config with long timeouts
  harness/
    pty-client.ts             # PTY wrapper for spawning CLI
    e2e-testbed.ts            # Creates isolated test project
    setup.ts                  # Global setup/teardown
  tests/
    quest-creation.e2e.test.ts      # Test case 1
    ask-user-question.e2e.test.ts   # Test case 2
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `node-pty` | Cross-platform PTY for Node.js - required because Ink needs TTY environment |

## Harness Components

### PTY Client

Wraps `node-pty` to provide a clean API for test cases:

- `spawn({ cwd })` - Spawn CLI in given directory
- `type(text)` - Send text input
- `pressKey(key)` - Send keystrokes (enter, escape, up, down, backspace)
- `waitForText(text, timeout)` - Wait for text to appear on screen
- `getScreen()` - Get current terminal output (ANSI stripped)
- `kill()` - Terminate the PTY process

### E2E Testbed

Creates isolated project directories for each test:

- Creates temp directory with `package.json` and `.claude/`
- Runs `dungeonmaster init` to set up MCP config and hooks
- Provides helpers: `questExists()`, `getQuestByFolder()`, `listQuestFolders()`
- Cleans up temp directory after test

## Test Cases

### Test Case 1: Quest Creation Without Followup

| Aspect | Specification |
|--------|---------------|
| **Trigger** | User navigates to Add, types prompt requesting quest "DangerFun", presses Enter |
| **Prompt** | "Testing cli workflow, make me a quest without any followup questions. Call it DangerFun" |
| **Expected Screen State** | List view showing "DangerFun" with `[in_progress]` status |
| **Expected File State** | `.dungeonmaster-quests/XXX-danger-fun/quest.json` exists with title "DangerFun" |
| **Bug Verification** | Screen should NOT contain Add screen remnants or Claude output - only List view content |

**Current bugs this test will catch:**
- Screen not clearing after Claude completes (Add screen + Claude output remains visible)
- Navigation going to menu instead of List view after quest creation

### Test Case 2: MCP Ask User Question Flow

| Aspect | Specification |
|--------|---------------|
| **Trigger** | User navigates to Add, types prompt that instructs Claude to ask a question via MCP |
| **Prompt** | "Testing cli workflow. I want to do a simple hello world. Ask me the following question using the mcp workflow 'Why hello world?'" |
| **Expected Screen State** | Answer screen showing the question "Why hello world?" |
| **Expected Behavior** | Claude uses `mcp__dungeonmaster__signal-back` with `needs-user-input` signal |

## Jest Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Test timeout** | 5 minutes (300000ms) | Claude calls take 30-120 seconds |
| **Test match** | `e2e/tests/**/*.e2e.test.ts` | Separate from unit tests |
| **Run serially** | `maxWorkers: 1` | PTY + Claude calls shouldn't run in parallel |
| **Setup file** | `e2e/harness/setup.ts` | Global cleanup of orphaned PTY processes |

**Invocation:** `npm run test:e2e` (separate from `npm test`)

## Implementation Order

1. Add `node-pty` to devDependencies in root `package.json`
2. Create `e2e/harness/pty-client.ts` - PTY wrapper
3. Create `e2e/harness/e2e-testbed.ts` - Isolated project setup
4. Create `e2e/jest.config.js` - Separate Jest config
5. Create `e2e/harness/setup.ts` - Global setup/teardown
6. Create test case 1 - Quest creation (`quest-creation.e2e.test.ts`)
7. Create test case 2 - Ask user question (`ask-user-question.e2e.test.ts`)
8. Add `"test:e2e": "jest --config e2e/jest.config.js"` script to root `package.json`

## Why PTY (not stdio pipes)

Ink-based CLIs require a TTY environment. When spawned with regular stdio pipes, Ink detects it's not a TTY and fails gracefully (existing e2e test confirms this behavior). `node-pty` provides a pseudo-terminal that satisfies Ink's requirements.

## Timeout Considerations

| Scenario | Expected Duration |
|----------|------------------|
| Single Claude call | 30-120 seconds |
| Test case 1 (quest creation) | ~2-3 minutes |
| Test case 2 (question flow) | ~2-3 minutes |
| Per-test timeout | 5 minutes (buffer for slow responses) |
