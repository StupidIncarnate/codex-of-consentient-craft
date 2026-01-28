# E2E Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a PTY-based E2E testing harness that tests real user flows through the Dungeonmaster CLI with actual Claude and MCP integration.

**Architecture:** Spawn the full CLI via `node-pty` in an isolated temp directory, simulate user keystrokes, wait for Claude to complete, and assert on both screen output and file system state.

**Tech Stack:** Jest, node-pty, TypeScript

---

## Task 1: Add node-pty Dependency

**Files:**
- Modify: `package.json` (root)

**Step 1: Add node-pty to devDependencies**

```bash
npm install --save-dev node-pty
```

**Step 2: Verify installation**

Run: `npm ls node-pty`
Expected: Shows node-pty in dependency tree

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add node-pty for E2E testing"
```

---

## Task 2: Create Jest Config for E2E Tests

**Files:**
- Create: `e2e/jest.config.js`

**Step 1: Create the Jest config file**

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.e2e.test.ts'],
  testTimeout: 300000, // 5 minutes per test
  maxWorkers: 1, // Run serially - PTY + Claude shouldn't parallelize
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/harness/setup.ts'],
  verbose: true,
};
```

**Step 2: Create tsconfig for e2e folder**

Create `e2e/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "types": ["jest", "node"]
  },
  "include": ["**/*.ts"]
}
```

**Step 3: Verify config is valid**

Run: `npx jest --config e2e/jest.config.js --listTests`
Expected: No errors (may show 0 tests found)

**Step 4: Commit**

```bash
git add e2e/jest.config.js e2e/tsconfig.json
git commit -m "chore: add Jest config for E2E tests"
```

---

## Task 3: Create PTY Client

**Files:**
- Create: `e2e/harness/pty-client.ts`

**Step 1: Create the PTY client module**

```typescript
/**
 * PURPOSE: Wraps node-pty to provide a clean API for E2E testing the CLI
 *
 * USAGE:
 * const client = createPtyClient();
 * await client.spawn({ cwd: '/path/to/project' });
 * client.type('hello');
 * client.pressKey('enter');
 * await client.waitForText('expected output');
 * client.kill();
 */

import * as pty from 'node-pty';
import stripAnsi from 'strip-ansi';

const KEY_CODES: Record<string, string> = {
  enter: '\r',
  escape: '\x1b',
  up: '\x1b[A',
  down: '\x1b[B',
  backspace: '\x7f',
  tab: '\t',
};

const DEFAULT_WAIT_TIMEOUT_MS = 180000; // 3 minutes
const POLL_INTERVAL_MS = 100;

export interface PtyClient {
  spawn(options: { cwd: string }): Promise<void>;
  type(text: string): void;
  pressKey(key: 'enter' | 'escape' | 'up' | 'down' | 'backspace' | 'tab'): void;
  waitForText(text: string, timeoutMs?: number): Promise<void>;
  waitForScreenChange(timeoutMs?: number): Promise<void>;
  getScreen(): string;
  getScreenRaw(): string;
  kill(): void;
}

export const createPtyClient = (): PtyClient => {
  let ptyProcess: pty.IPty | null = null;
  let screenBuffer = '';
  let lastScreen = '';

  const spawn = async ({ cwd }: { cwd: string }): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        ptyProcess = pty.spawn('npx', ['dungeonmaster'], {
          name: 'xterm-color',
          cols: 120,
          rows: 30,
          cwd,
          env: { ...process.env, FORCE_COLOR: '1' },
        });

        ptyProcess.onData((data: string) => {
          screenBuffer += data;
        });

        // Wait for initial render
        setTimeout(() => {
          resolve();
        }, 2000);
      } catch (error) {
        reject(error);
      }
    });
  };

  const type = (text: string): void => {
    if (ptyProcess === null) {
      throw new Error('PTY not spawned - call spawn() first');
    }
    ptyProcess.write(text);
  };

  const pressKey = (key: 'enter' | 'escape' | 'up' | 'down' | 'backspace' | 'tab'): void => {
    if (ptyProcess === null) {
      throw new Error('PTY not spawned - call spawn() first');
    }
    const keyCode = KEY_CODES[key];
    if (keyCode === undefined) {
      throw new Error(`Unknown key: ${key}`);
    }
    ptyProcess.write(keyCode);
  };

  const waitForText = async (text: string, timeoutMs = DEFAULT_WAIT_TIMEOUT_MS): Promise<void> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const screen = stripAnsi(screenBuffer);
      if (screen.includes(text)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(
      `Timeout waiting for text "${text}" after ${timeoutMs}ms. Current screen:\n${stripAnsi(screenBuffer)}`
    );
  };

  const waitForScreenChange = async (timeoutMs = DEFAULT_WAIT_TIMEOUT_MS): Promise<void> => {
    const startTime = Date.now();
    const initialScreen = screenBuffer;

    while (Date.now() - startTime < timeoutMs) {
      if (screenBuffer !== initialScreen) {
        lastScreen = screenBuffer;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(`Timeout waiting for screen change after ${timeoutMs}ms`);
  };

  const getScreen = (): string => {
    return stripAnsi(screenBuffer);
  };

  const getScreenRaw = (): string => {
    return screenBuffer;
  };

  const kill = (): void => {
    if (ptyProcess !== null) {
      ptyProcess.kill();
      ptyProcess = null;
    }
    screenBuffer = '';
    lastScreen = '';
  };

  return {
    spawn,
    type,
    pressKey,
    waitForText,
    waitForScreenChange,
    getScreen,
    getScreenRaw,
    kill,
  };
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --project e2e/tsconfig.json --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add e2e/harness/pty-client.ts
git commit -m "feat(e2e): add PTY client for CLI interaction"
```

---

## Task 4: Create E2E Testbed

**Files:**
- Create: `e2e/harness/e2e-testbed.ts`

**Step 1: Create the testbed module**

```typescript
/**
 * PURPOSE: Creates isolated test project directories for E2E tests
 *
 * USAGE:
 * const testbed = createE2ETestbed({ baseName: 'my-test' });
 * testbed.runDungeonmasterInit();
 * // ... run tests ...
 * testbed.cleanup();
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

const E2E_TEMP_BASE = '/tmp/dungeonmaster-e2e';
const QUESTS_FOLDER = '.dungeonmaster-quests';

export interface Quest {
  id: string;
  folder: string;
  title: string;
  status: string;
  createdAt: string;
  userRequest: string;
  contexts: unknown[];
  observables: unknown[];
  steps: unknown[];
  toolingRequirements: unknown[];
  executionLog: unknown[];
}

export interface E2ETestbed {
  projectPath: string;
  questExists(titlePattern: string): boolean;
  getQuestByFolder(folder: string): Quest | null;
  listQuestFolders(): string[];
  runDungeonmasterInit(): void;
  cleanup(): void;
}

export const createE2ETestbed = ({ baseName }: { baseName: string }): E2ETestbed => {
  const testId = crypto.randomBytes(4).toString('hex');
  const projectName = `${baseName}-${testId}`;
  const projectPath = path.join(E2E_TEMP_BASE, projectName);

  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
  };
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create .claude directory
  fs.mkdirSync(path.join(projectPath, '.claude'), { recursive: true });

  const questExists = (titlePattern: string): boolean => {
    const folders = listQuestFolders();
    for (const folder of folders) {
      const quest = getQuestByFolder(folder);
      if (quest !== null && quest.title.toLowerCase().includes(titlePattern.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  const getQuestByFolder = (folder: string): Quest | null => {
    const questPath = path.join(projectPath, QUESTS_FOLDER, folder, 'quest.json');
    if (!fs.existsSync(questPath)) {
      return null;
    }
    const content = fs.readFileSync(questPath, 'utf-8');
    return JSON.parse(content) as Quest;
  };

  const listQuestFolders = (): string[] => {
    const questsPath = path.join(projectPath, QUESTS_FOLDER);
    if (!fs.existsSync(questsPath)) {
      return [];
    }
    return fs.readdirSync(questsPath).filter((name) => {
      const stat = fs.statSync(path.join(questsPath, name));
      return stat.isDirectory();
    });
  };

  const runDungeonmasterInit = (): void => {
    execSync('npx dungeonmaster init', {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  };

  const cleanup = (): void => {
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  };

  return {
    projectPath,
    questExists,
    getQuestByFolder,
    listQuestFolders,
    runDungeonmasterInit,
    cleanup,
  };
};
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --project e2e/tsconfig.json --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add e2e/harness/e2e-testbed.ts
git commit -m "feat(e2e): add testbed for isolated test projects"
```

---

## Task 5: Create Setup File

**Files:**
- Create: `e2e/harness/setup.ts`

**Step 1: Create the setup file**

```typescript
/**
 * PURPOSE: Jest setup file for E2E tests - handles global cleanup
 *
 * USAGE:
 * Referenced in jest.config.js setupFilesAfterEnv
 */

import * as fs from 'fs';

const E2E_TEMP_BASE = '/tmp/dungeonmaster-e2e';

// Clean up any orphaned temp directories from previous runs
beforeAll(() => {
  if (fs.existsSync(E2E_TEMP_BASE)) {
    const dirs = fs.readdirSync(E2E_TEMP_BASE);
    // Only clean up directories older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const dir of dirs) {
      const dirPath = `${E2E_TEMP_BASE}/${dir}`;
      const stat = fs.statSync(dirPath);
      if (stat.mtimeMs < oneHourAgo) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }
  }
});

// Increase default timeout for all tests
jest.setTimeout(300000);
```

**Step 2: Commit**

```bash
git add e2e/harness/setup.ts
git commit -m "feat(e2e): add Jest setup with cleanup"
```

---

## Task 6: Create Harness Index Export

**Files:**
- Create: `e2e/harness/index.ts`

**Step 1: Create the index file**

```typescript
/**
 * PURPOSE: Export all E2E harness utilities
 */

export { createPtyClient } from './pty-client';
export type { PtyClient } from './pty-client';

export { createE2ETestbed } from './e2e-testbed';
export type { E2ETestbed, Quest } from './e2e-testbed';
```

**Step 2: Commit**

```bash
git add e2e/harness/index.ts
git commit -m "feat(e2e): add harness index exports"
```

---

## Task 7: Create Test Case 1 - Quest Creation

**Files:**
- Create: `e2e/tests/quest-creation.e2e.test.ts`

**Step 1: Create the test file**

```typescript
/**
 * PURPOSE: E2E test for quest creation flow without followup questions
 *
 * USAGE:
 * npm run test:e2e -- quest-creation
 */

import { createPtyClient, createE2ETestbed } from '../harness';
import type { PtyClient, E2ETestbed } from '../harness';

describe('Quest creation flow', () => {
  let testbed: E2ETestbed;
  let client: PtyClient;

  beforeEach(() => {
    testbed = createE2ETestbed({ baseName: 'quest-create' });
    testbed.runDungeonmasterInit();
    client = createPtyClient();
  });

  afterEach(() => {
    client.kill();
    testbed.cleanup();
  });

  it('creates quest and navigates to list view with clean screen', async () => {
    // Spawn CLI
    await client.spawn({ cwd: testbed.projectPath });

    // Wait for menu to load
    await client.waitForText('Add - Add a new quest');

    // Navigate to Add screen
    client.pressKey('enter');
    await client.waitForText('What would you like to build');

    // Type prompt and submit
    const prompt =
      'Testing cli workflow, make me a quest without any followup questions. Call it DangerFun';
    client.type(prompt);
    client.pressKey('enter');

    // Wait for Claude to complete - should land on List view
    await client.waitForText('Quests', 180000);

    const screen = client.getScreen();

    // EXPECTED: Should be on List view showing the quest
    expect(screen).toContain('Quests');
    expect(screen).toContain('DangerFun');
    expect(screen).toContain('[in_progress]');
    expect(screen).toContain("Press Escape or 'q' to go back");

    // BUG ASSERTION: Old content should NOT be visible
    expect(screen).not.toContain('What would you like to build');
    expect(screen).not.toContain('Testing cli workflow');

    // BUG ASSERTION: Should NOT be on menu
    expect(screen).not.toContain('Add - Add a new quest');

    // File system assertion
    const folders = testbed.listQuestFolders();
    expect(folders.length).toBe(1);
    expect(folders[0]).toMatch(/danger-fun/);

    const quest = testbed.getQuestByFolder(folders[0]);
    expect(quest).not.toBeNull();
    expect(quest?.title).toMatch(/DangerFun/i);
  });
});
```

**Step 2: Commit**

```bash
git add e2e/tests/quest-creation.e2e.test.ts
git commit -m "test(e2e): add quest creation test case"
```

---

## Task 8: Create Test Case 2 - Ask User Question

**Files:**
- Create: `e2e/tests/ask-user-question.e2e.test.ts`

**Step 1: Create the test file**

```typescript
/**
 * PURPOSE: E2E test for MCP ask-user-question flow
 *
 * USAGE:
 * npm run test:e2e -- ask-user-question
 */

import { createPtyClient, createE2ETestbed } from '../harness';
import type { PtyClient, E2ETestbed } from '../harness';

describe('Ask user question flow', () => {
  let testbed: E2ETestbed;
  let client: PtyClient;

  beforeEach(() => {
    testbed = createE2ETestbed({ baseName: 'ask-question' });
    testbed.runDungeonmasterInit();
    client = createPtyClient();
  });

  afterEach(() => {
    client.kill();
    testbed.cleanup();
  });

  it('shows answer screen when Claude asks a question via MCP', async () => {
    // Spawn CLI
    await client.spawn({ cwd: testbed.projectPath });

    // Wait for menu to load
    await client.waitForText('Add - Add a new quest');

    // Navigate to Add screen
    client.pressKey('enter');
    await client.waitForText('What would you like to build');

    // Type prompt that instructs Claude to ask a question
    const prompt =
      "Testing cli workflow. I want to do a simple hello world. Ask me the following question using the mcp workflow 'Why hello world?'";
    client.type(prompt);
    client.pressKey('enter');

    // Wait for Answer screen to appear with the question
    await client.waitForText('Why hello world?', 180000);

    const screen = client.getScreen();

    // EXPECTED: Should be on Answer screen
    expect(screen).toContain('Why hello world?');

    // Should show answer input area (not menu, not list)
    expect(screen).not.toContain('Add - Add a new quest');
    expect(screen).not.toContain('Quests');
  });
});
```

**Step 2: Commit**

```bash
git add e2e/tests/ask-user-question.e2e.test.ts
git commit -m "test(e2e): add ask-user-question test case"
```

---

## Task 9: Add npm Script

**Files:**
- Modify: `package.json` (root)

**Step 1: Add test:e2e script**

Add to scripts section:

```json
"test:e2e": "jest --config e2e/jest.config.js"
```

**Step 2: Verify script works**

Run: `npm run test:e2e -- --listTests`
Expected: Shows the two test files

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add test:e2e npm script"
```

---

## Task 10: Run E2E Tests

**Step 1: Run the E2E test suite**

Run: `npm run test:e2e`

Expected: Tests run (may fail due to existing bugs - that's the point)

**Step 2: Document test results**

If tests fail as expected (due to screen not clearing, wrong navigation):
- This validates the test harness works
- The bugs are now captured as failing tests

If tests pass unexpectedly:
- Review test assertions
- May need to adjust expectations

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(e2e): complete E2E testing harness setup"
```
