# E2E Testing Architecture for CLI Applications

## Architecture Decision Record (ADR-027)

**Status:** Proposed
**Date:** 2026-01-29
**Context:** Need comprehensive E2E testing for interactive CLI with MCP and hooks integration

---

## 1. Executive Summary

This document defines the architecture for end-to-end testing of the CLI application, addressing:
- Interactive terminal testing in headless mode
- MCP server integration testing
- Hooks system verification
- BDD-style test organization with Given/When/Then patterns
- Async CLI interaction handling
- Screen output and file system assertions

---

## 2. Architecture Overview

### 2.1 C4 Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              E2E Test Suite                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   BDD Test   │     │  CLI Runner  │     │   Assertion  │                │
│  │   Scenarios  │────▶│    Driver    │────▶│   Library    │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                         │
│         │                    ▼                    │                         │
│         │           ┌──────────────┐              │                         │
│         │           │  PTY/Debug   │              │                         │
│         └──────────▶│   Protocol   │◀─────────────┘                         │
│                     └──────────────┘                                        │
│                            │                                                │
└────────────────────────────┼────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLI Application Under Test                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   start-cli  │     │  CliAppWidget │     │   Brokers    │                │
│  │ Orchestrator │────▶│   (React/Ink) │────▶│   & Hooks    │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │ File System  │     │   MCP Server │     │  Quest Files │                │
│  │   Changes    │     │  Integration │     │   & State    │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Test Infrastructure                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: Test Scenarios (BDD)                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  Feature: Quest Creation                                            │     │
│  │    Scenario: User creates a new quest                              │     │
│  │      Given the CLI is on the menu screen                           │     │
│  │      When the user navigates to "Add" and enters "Build API"       │     │
│  │      Then the quest file should be created                         │     │
│  │      And the answer screen should be shown if questions pending    │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  Layer 2: Test Drivers                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  CLITestDriver   │  │  DebugProtocol   │  │  MCPTestClient   │          │
│  │  - spawn()       │  │  Driver          │  │  - tools/call    │          │
│  │  - input()       │  │  - sendCommand() │  │  - hooks/invoke  │          │
│  │  - waitFor()     │  │  - getScreen()   │  │  - memory/ops    │          │
│  │  - screen()      │  │  - keypress()    │  │                  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│  Layer 3: Utilities & Assertions                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  ScreenCapture   │  │  FileSystemSpy   │  │  WaitStrategies  │          │
│  │  - frame()       │  │  - created()     │  │  - forText()     │          │
│  │  - contains()    │  │  - modified()    │  │  - forScreen()   │          │
│  │  - notContains() │  │  - content()     │  │  - forCallback() │          │
│  │  - elements()    │  │  - deleted()     │  │  - forStable()   │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure

```
tests/
├── e2e/
│   ├── README.md                           # E2E testing guide
│   │
│   ├── drivers/                            # Test drivers
│   │   ├── cli-test-driver.ts              # Main CLI driver (spawns process)
│   │   ├── debug-protocol-driver.ts        # JSON protocol driver for widgets
│   │   ├── mcp-test-client.ts              # MCP server test client
│   │   └── index.ts                        # Barrel export
│   │
│   ├── harness/                            # Test harness components
│   │   ├── screen-capture.ts               # Screen frame capture & assertions
│   │   ├── file-system-spy.ts              # File system change tracking
│   │   ├── wait-strategies.ts              # Async waiting utilities
│   │   ├── project-fixture.ts              # Test project setup
│   │   └── index.ts
│   │
│   ├── matchers/                           # Custom Jest/Vitest matchers
│   │   ├── screen-matchers.ts              # toShowScreen, toContainText, etc.
│   │   ├── file-matchers.ts                # toHaveCreatedFile, etc.
│   │   ├── callback-matchers.ts            # toHaveInvokedCallback, etc.
│   │   └── index.ts
│   │
│   ├── features/                           # BDD feature tests
│   │   ├── quest-creation.e2e.ts           # Quest creation flows
│   │   ├── quest-navigation.e2e.ts         # Menu navigation
│   │   ├── quest-execution.e2e.ts          # Quest running
│   │   ├── answer-prompt.e2e.ts            # Answer/question screens
│   │   ├── mcp-integration.e2e.ts          # MCP tool invocations
│   │   └── hooks-integration.e2e.ts        # Hooks system tests
│   │
│   ├── scenarios/                          # Multi-step scenario definitions
│   │   ├── happy-paths.ts                  # Standard user journeys
│   │   ├── edge-cases.ts                   # Error handling scenarios
│   │   └── regression.ts                   # Bug regression tests
│   │
│   └── setup/
│       ├── e2e-setup.ts                    # Global E2E setup
│       ├── e2e-teardown.ts                 # Global cleanup
│       └── jest.e2e.config.js              # E2E-specific Jest config
│
├── fixtures/                               # Test fixtures (existing)
│   ├── simple-project/
│   └── monorepo/
│
└── utils/                                  # Existing utilities
    ├── testbed.ts
    ├── claude-runner.ts                    # Enhanced with debug protocol
    └── project-bootstrapper.ts
```

---

## 4. Key Abstractions

### 4.1 CLITestDriver

The main driver for spawning and controlling the CLI process.

```typescript
// tests/e2e/drivers/cli-test-driver.ts

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { ScreenCapture } from '../harness/screen-capture';
import { WaitStrategies } from '../harness/wait-strategies';

export interface CLITestDriverOptions {
  /** Working directory for CLI process */
  cwd: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Use debug protocol (JSON line) instead of PTY */
  useDebugProtocol?: boolean;
  /** Timeout for operations (ms) */
  timeout?: number;
}

export interface InputOptions {
  /** Delay between characters for realistic typing simulation */
  typeDelay?: number;
}

export class CLITestDriver extends EventEmitter {
  private process: ChildProcess | null = null;
  private screen: ScreenCapture;
  private wait: WaitStrategies;
  private responseBuffer: string = '';
  private pendingResponses: Array<{
    resolve: (value: DebugResponse) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(private options: CLITestDriverOptions) {
    super();
    this.screen = new ScreenCapture();
    this.wait = new WaitStrategies(this);
  }

  /**
   * Start the CLI in debug mode
   * @param initialScreen - Screen to start on (menu, add, list, etc.)
   */
  async start(initialScreen: CliAppScreen = 'menu'): Promise<void> {
    if (this.options.useDebugProtocol) {
      return this.startDebugMode(initialScreen);
    }
    return this.startPtyMode(initialScreen);
  }

  /**
   * Start using JSON line debug protocol
   */
  private async startDebugMode(initialScreen: CliAppScreen): Promise<void> {
    const debugPath = require.resolve(
      '@dungeonmaster/cli/src/startup/start-debug.ts'
    );

    this.process = spawn('npx', ['tsx', debugPath], {
      cwd: this.options.cwd,
      env: { ...process.env, ...this.options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Set up response handling
    this.process.stdout!.on('data', (data: Buffer) => {
      this.responseBuffer += data.toString();
      this.processResponseBuffer();
    });

    this.process.stderr!.on('data', (data: Buffer) => {
      this.emit('error', data.toString());
    });

    // Send start command
    await this.sendCommand({ action: 'start', screen: initialScreen });
  }

  /**
   * Send input text to the CLI
   */
  async input(text: string, options?: InputOptions): Promise<DebugResponse> {
    if (this.options.useDebugProtocol) {
      return this.sendCommand({ action: 'input', text });
    }
    // PTY mode: write directly
    this.process!.stdin!.write(text);
    return this.wait.forRender();
  }

  /**
   * Send a keypress (enter, escape, up, down, etc.)
   */
  async keypress(key: KeyName): Promise<DebugResponse> {
    if (this.options.useDebugProtocol) {
      return this.sendCommand({ action: 'keypress', key });
    }
    // PTY mode: send escape sequence
    const keyCode = KEY_CODES[key];
    this.process!.stdin!.write(keyCode);
    return this.wait.forRender();
  }

  /**
   * Get current screen state
   */
  async getScreen(): Promise<DebugResponse> {
    if (this.options.useDebugProtocol) {
      return this.sendCommand({ action: 'getScreen' });
    }
    throw new Error('getScreen only available in debug protocol mode');
  }

  /**
   * Get the screen capture utility for assertions
   */
  getScreenCapture(): ScreenCapture {
    return this.screen;
  }

  /**
   * Get wait strategies for async operations
   */
  getWait(): WaitStrategies {
    return this.wait;
  }

  /**
   * Stop the CLI process
   */
  async stop(): Promise<void> {
    if (this.options.useDebugProtocol) {
      await this.sendCommand({ action: 'exit' });
    }
    this.process?.kill();
    this.process = null;
  }

  /**
   * Send a debug protocol command
   */
  private async sendCommand(command: DebugCommand): Promise<DebugResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Command timed out: ${JSON.stringify(command)}`));
      }, this.options.timeout || 10000);

      this.pendingResponses.push({
        resolve: (response) => {
          clearTimeout(timeout);
          this.screen.update(response.screen?.frame || '');
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      this.process!.stdin!.write(JSON.stringify(command) + '\n');
    });
  }

  /**
   * Process buffered responses (JSON lines)
   */
  private processResponseBuffer(): void {
    const lines = this.responseBuffer.split('\n');
    // Keep incomplete line in buffer
    this.responseBuffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response = JSON.parse(line) as DebugResponse;
        const pending = this.pendingResponses.shift();
        if (pending) {
          pending.resolve(response);
        }
        this.emit('response', response);
      } catch (e) {
        const pending = this.pendingResponses.shift();
        if (pending) {
          pending.reject(new Error(`Invalid JSON response: ${line}`));
        }
      }
    }
  }
}

const KEY_CODES: Record<string, string> = {
  enter: '\r',
  escape: '\x1b',
  up: '\x1b[A',
  down: '\x1b[B',
  left: '\x1b[D',
  right: '\x1b[C',
  backspace: '\x7f',
  tab: '\t',
};
```

### 4.2 ScreenCapture

Utility for capturing and asserting on screen output.

```typescript
// tests/e2e/harness/screen-capture.ts

import stripAnsi from 'strip-ansi';

export interface ScreenElement {
  type: 'text' | 'input' | 'list-item' | 'prompt' | 'button';
  content: string;
  selected?: boolean;
  position?: { row: number; col: number };
}

export class ScreenCapture {
  private currentFrame: string = '';
  private history: string[] = [];

  /**
   * Update with new frame content
   */
  update(frame: string): void {
    this.history.push(this.currentFrame);
    this.currentFrame = frame;
  }

  /**
   * Get current frame (raw with ANSI)
   */
  raw(): string {
    return this.currentFrame;
  }

  /**
   * Get current frame (stripped of ANSI codes)
   */
  text(): string {
    return stripAnsi(this.currentFrame);
  }

  /**
   * Get frame lines as array
   */
  lines(): string[] {
    return this.text().split('\n');
  }

  /**
   * Check if frame contains text
   */
  contains(text: string): boolean {
    return this.text().includes(text);
  }

  /**
   * Check if frame does NOT contain text (for bug scenarios)
   */
  notContains(text: string): boolean {
    return !this.contains(text);
  }

  /**
   * Check if frame matches regex
   */
  matches(pattern: RegExp): boolean {
    return pattern.test(this.text());
  }

  /**
   * Get previous frame (for comparison)
   */
  previous(): string {
    return this.history[this.history.length - 1] || '';
  }

  /**
   * Check if frame changed from previous
   */
  hasChanged(): boolean {
    return this.currentFrame !== this.previous();
  }

  /**
   * Parse frame into structured elements (for detailed assertions)
   */
  parseElements(): ScreenElement[] {
    const elements: ScreenElement[] = [];
    const lines = this.lines();

    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];

      // Detect list items (e.g., "  > Add" or "    Run")
      const listMatch = line.match(/^(\s*)(>|\s)\s*(.+)$/);
      if (listMatch) {
        elements.push({
          type: 'list-item',
          content: listMatch[3].trim(),
          selected: listMatch[2] === '>',
          position: { row, col: listMatch[1].length },
        });
      }

      // Detect prompts (e.g., "What would you like to build?")
      if (line.includes('?')) {
        elements.push({
          type: 'prompt',
          content: line.trim(),
          position: { row, col: 0 },
        });
      }

      // Detect input fields (cursor or underscore patterns)
      if (line.includes('_') || line.includes('|')) {
        elements.push({
          type: 'input',
          content: line.trim(),
          position: { row, col: 0 },
        });
      }
    }

    return elements;
  }

  /**
   * Get selected list item (if any)
   */
  getSelectedItem(): ScreenElement | undefined {
    return this.parseElements().find(
      (el) => el.type === 'list-item' && el.selected
    );
  }

  /**
   * Assert current screen name (menu, add, list, etc.)
   */
  isScreen(screenName: string): boolean {
    const screenPatterns: Record<string, RegExp> = {
      menu: /Add|Run|List|Help/,
      add: /What would you like to build/i,
      list: /Active|Completed|Abandoned/i,
      answer: /question|clarify|need/i,
      help: /Help|Commands|Usage/i,
    };
    const pattern = screenPatterns[screenName];
    return pattern ? this.matches(pattern) : false;
  }
}
```

### 4.3 WaitStrategies

Async waiting utilities for CLI interactions.

```typescript
// tests/e2e/harness/wait-strategies.ts

import { CLITestDriver } from '../drivers/cli-test-driver';

export interface WaitOptions {
  timeout?: number;
  interval?: number;
}

export class WaitStrategies {
  constructor(private driver: CLITestDriver) {}

  /**
   * Wait for specific text to appear on screen
   */
  async forText(
    text: string,
    options: WaitOptions = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await this.driver.getScreen();
      if (response.screen?.frame?.includes(text)) {
        return;
      }
      await this.delay(interval);
    }

    throw new Error(`Timeout waiting for text: "${text}"`);
  }

  /**
   * Wait for text to NOT appear (for bug verification)
   */
  async forNoText(
    text: string,
    options: WaitOptions = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await this.driver.getScreen();
      if (response.screen?.frame?.includes(text)) {
        throw new Error(`Unexpected text appeared: "${text}"`);
      }
      await this.delay(interval);
    }
    // Success - text never appeared
  }

  /**
   * Wait for specific screen to be shown
   */
  async forScreen(
    screenName: string,
    options: WaitOptions = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await this.driver.getScreen();
      if (response.screen?.name === screenName) {
        return;
      }
      await this.delay(interval);
    }

    throw new Error(`Timeout waiting for screen: "${screenName}"`);
  }

  /**
   * Wait for a callback to be invoked
   */
  async forCallback(
    callbackName: string,
    options: WaitOptions = {}
  ): Promise<unknown[]> {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await this.driver.getScreen();
      const callbacks = response.callbacks?.[callbackName];
      if (callbacks && callbacks.length > 0) {
        return callbacks;
      }
      await this.delay(interval);
    }

    throw new Error(`Timeout waiting for callback: "${callbackName}"`);
  }

  /**
   * Wait for render to stabilize (no changes for N ms)
   */
  async forStable(
    stabilityMs: number = 200,
    options: WaitOptions = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 50 } = options;
    const startTime = Date.now();
    let lastFrame = '';
    let stableTime = 0;

    while (Date.now() - startTime < timeout) {
      const response = await this.driver.getScreen();
      const currentFrame = response.screen?.frame || '';

      if (currentFrame === lastFrame) {
        stableTime += interval;
        if (stableTime >= stabilityMs) {
          return;
        }
      } else {
        stableTime = 0;
        lastFrame = currentFrame;
      }

      await this.delay(interval);
    }

    throw new Error('Timeout waiting for screen to stabilize');
  }

  /**
   * Wait for any render update
   */
  async forRender(): Promise<DebugResponse> {
    return this.driver.getScreen();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 4.4 FileSystemSpy

Track file system changes during tests.

```typescript
// tests/e2e/harness/file-system-spy.ts

import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

export interface FileChange {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: Date;
  content?: string;
}

export class FileSystemSpy {
  private watcher: chokidar.FSWatcher | null = null;
  private changes: FileChange[] = [];
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Start watching for file changes
   */
  async start(patterns: string[] = ['**/*']): Promise<void> {
    this.changes = [];

    this.watcher = chokidar.watch(
      patterns.map((p) => path.join(this.baseDir, p)),
      {
        ignoreInitial: true,
        persistent: true,
      }
    );

    this.watcher.on('add', (filePath) => {
      this.changes.push({
        type: 'add',
        path: path.relative(this.baseDir, filePath),
        timestamp: new Date(),
        content: this.readFileSafe(filePath),
      });
    });

    this.watcher.on('change', (filePath) => {
      this.changes.push({
        type: 'change',
        path: path.relative(this.baseDir, filePath),
        timestamp: new Date(),
        content: this.readFileSafe(filePath),
      });
    });

    this.watcher.on('unlink', (filePath) => {
      this.changes.push({
        type: 'unlink',
        path: path.relative(this.baseDir, filePath),
        timestamp: new Date(),
      });
    });

    // Wait for watcher to be ready
    return new Promise((resolve) => {
      this.watcher!.on('ready', resolve);
    });
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Get all recorded changes
   */
  getChanges(): FileChange[] {
    return [...this.changes];
  }

  /**
   * Check if a file was created
   */
  wasCreated(relativePath: string): boolean {
    return this.changes.some(
      (c) => c.type === 'add' && c.path === relativePath
    );
  }

  /**
   * Check if a file was modified
   */
  wasModified(relativePath: string): boolean {
    return this.changes.some(
      (c) => c.type === 'change' && c.path === relativePath
    );
  }

  /**
   * Check if a file was deleted
   */
  wasDeleted(relativePath: string): boolean {
    return this.changes.some(
      (c) => c.type === 'unlink' && c.path === relativePath
    );
  }

  /**
   * Get created files matching a pattern
   */
  getCreatedFiles(pattern?: RegExp): FileChange[] {
    return this.changes.filter(
      (c) =>
        c.type === 'add' && (!pattern || pattern.test(c.path))
    );
  }

  /**
   * Get content of a created/modified file
   */
  getFileContent(relativePath: string): string | undefined {
    const change = this.changes.find(
      (c) =>
        (c.type === 'add' || c.type === 'change') &&
        c.path === relativePath
    );
    return change?.content;
  }

  /**
   * Clear recorded changes
   */
  clear(): void {
    this.changes = [];
  }

  private readFileSafe(filePath: string): string | undefined {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return undefined;
    }
  }
}
```

### 4.5 Custom Jest Matchers

```typescript
// tests/e2e/matchers/screen-matchers.ts

import { ScreenCapture } from '../harness/screen-capture';

declare global {
  namespace jest {
    interface Matchers<R> {
      toShowScreen(screenName: string): R;
      toContainScreenText(text: string): R;
      toNotContainScreenText(text: string): R;
      toHaveSelectedItem(itemText: string): R;
    }
  }
}

export const screenMatchers = {
  toShowScreen(received: ScreenCapture, screenName: string) {
    const pass = received.isScreen(screenName);
    return {
      pass,
      message: () =>
        pass
          ? `Expected screen not to be "${screenName}"`
          : `Expected screen to be "${screenName}" but got:\n${received.text()}`,
    };
  },

  toContainScreenText(received: ScreenCapture, text: string) {
    const pass = received.contains(text);
    return {
      pass,
      message: () =>
        pass
          ? `Expected screen not to contain "${text}"`
          : `Expected screen to contain "${text}" but got:\n${received.text()}`,
    };
  },

  toNotContainScreenText(received: ScreenCapture, text: string) {
    const pass = received.notContains(text);
    return {
      pass,
      message: () =>
        pass
          ? `Expected screen to contain "${text}"`
          : `Expected screen NOT to contain "${text}" but it does:\n${received.text()}`,
    };
  },

  toHaveSelectedItem(received: ScreenCapture, itemText: string) {
    const selected = received.getSelectedItem();
    const pass = selected?.content === itemText;
    return {
      pass,
      message: () =>
        pass
          ? `Expected selected item not to be "${itemText}"`
          : `Expected selected item to be "${itemText}" but got "${selected?.content || 'none'}"`,
    };
  },
};

// tests/e2e/matchers/file-matchers.ts

import { FileSystemSpy } from '../harness/file-system-spy';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveCreatedFile(relativePath: string): R;
      toHaveModifiedFile(relativePath: string): R;
      toHaveCreatedQuestFile(questIdPattern: RegExp): R;
    }
  }
}

export const fileMatchers = {
  toHaveCreatedFile(received: FileSystemSpy, relativePath: string) {
    const pass = received.wasCreated(relativePath);
    return {
      pass,
      message: () =>
        pass
          ? `Expected file "${relativePath}" not to be created`
          : `Expected file "${relativePath}" to be created. Created files: ${received
              .getCreatedFiles()
              .map((f) => f.path)
              .join(', ')}`,
    };
  },

  toHaveModifiedFile(received: FileSystemSpy, relativePath: string) {
    const pass = received.wasModified(relativePath);
    return {
      pass,
      message: () =>
        pass
          ? `Expected file "${relativePath}" not to be modified`
          : `Expected file "${relativePath}" to be modified`,
    };
  },

  toHaveCreatedQuestFile(received: FileSystemSpy, questIdPattern: RegExp) {
    const questFiles = received.getCreatedFiles(/dungeonmaster\/active\/.*\.json$/);
    const pass = questFiles.some((f) => questIdPattern.test(f.path));
    return {
      pass,
      message: () =>
        pass
          ? `Expected no quest file matching ${questIdPattern}`
          : `Expected quest file matching ${questIdPattern}. Found: ${questFiles
              .map((f) => f.path)
              .join(', ')}`,
    };
  },
};

// tests/e2e/matchers/callback-matchers.ts

import { DebugResponse } from '../../../packages/cli/src/contracts/debug-response/debug-response-contract';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveInvokedCallback(callbackName: string, expectedArgs?: unknown): R;
      toNotHaveInvokedCallback(callbackName: string): R;
    }
  }
}

export const callbackMatchers = {
  toHaveInvokedCallback(
    received: DebugResponse,
    callbackName: string,
    expectedArgs?: unknown
  ) {
    const callbacks = received.callbacks?.[callbackName] || [];
    const pass = expectedArgs
      ? callbacks.some((args) =>
          JSON.stringify(args) === JSON.stringify(expectedArgs)
        )
      : callbacks.length > 0;

    return {
      pass,
      message: () =>
        pass
          ? `Expected callback "${callbackName}" not to be invoked`
          : `Expected callback "${callbackName}" to be invoked${
              expectedArgs ? ` with ${JSON.stringify(expectedArgs)}` : ''
            }. Got: ${JSON.stringify(callbacks)}`,
    };
  },

  toNotHaveInvokedCallback(received: DebugResponse, callbackName: string) {
    const callbacks = received.callbacks?.[callbackName] || [];
    const pass = callbacks.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? `Expected callback "${callbackName}" to be invoked`
          : `Expected callback "${callbackName}" NOT to be invoked but it was called ${callbacks.length} times`,
    };
  },
};
```

---

## 5. BDD Test Examples

### 5.1 Quest Creation Feature

```typescript
// tests/e2e/features/quest-creation.e2e.ts

import { CLITestDriver } from '../drivers/cli-test-driver';
import { FileSystemSpy } from '../harness/file-system-spy';
import { ProjectFixture } from '../harness/project-fixture';
import '../matchers';

describe('Feature: Quest Creation', () => {
  let driver: CLITestDriver;
  let fsSpy: FileSystemSpy;
  let project: ProjectFixture;

  beforeEach(async () => {
    project = await ProjectFixture.create('simple');
    driver = new CLITestDriver({
      cwd: project.rootDir,
      useDebugProtocol: true,
      timeout: 10000,
    });
    fsSpy = new FileSystemSpy(project.rootDir);
    await fsSpy.start(['dungeonmaster/**/*']);
  });

  afterEach(async () => {
    await driver.stop();
    await fsSpy.stop();
    await project.cleanup();
  });

  describe('Scenario: User creates a new quest from menu', () => {
    it('Given the CLI is on the menu screen', async () => {
      // Arrange
      await driver.start('menu');
      const screen = driver.getScreenCapture();

      // Assert precondition
      expect(screen).toShowScreen('menu');
      expect(screen).toContainScreenText('Add');
    });

    it('When the user selects "Add" and enters a quest description', async () => {
      // Arrange
      await driver.start('menu');

      // Act - Navigate to Add
      await driver.keypress('enter'); // Select first item (Add)

      // Assert intermediate state
      const screen = driver.getScreenCapture();
      expect(screen).toShowScreen('add');
      expect(screen).toContainScreenText('What would you like to build');

      // Act - Enter quest description
      await driver.input('Build a REST API for user management');
      const response = await driver.keypress('enter');

      // Assert callback was invoked
      expect(response).toHaveInvokedCallback('onSpawnChaoswhisperer', {
        userInput: 'Build a REST API for user management',
      });
    });

    it('Then a quest file should be created in the active folder', async () => {
      // Full flow
      await driver.start('menu');
      await driver.keypress('enter');
      await driver.input('Build a REST API');
      await driver.keypress('enter');

      // Wait for file system changes
      await new Promise((r) => setTimeout(r, 500));

      // Assert
      expect(fsSpy).toHaveCreatedQuestFile(/rest-api.*\.json$/);
    });
  });

  describe('Scenario: Answer screen shown when ChaosWhisperer has questions', () => {
    /**
     * BUG SCENARIO: This tests that the answer screen IS shown
     * when ChaosWhisperer returns a 'needs-user-input' signal.
     *
     * The bug was: answer screen was NOT shown, CLI returned to menu instead.
     */
    it('should show the answer screen when signal is needs-user-input', async () => {
      // This requires mocking the broker response or using a test fixture
      // that triggers the needs-user-input flow

      await driver.start('menu');
      await driver.keypress('enter'); // Go to add
      await driver.input('Fix some stuff'); // Vague request triggers questions
      await driver.keypress('enter');

      // Wait for potential screen change
      await driver.getWait().forStable(300);

      const screen = driver.getScreenCapture();

      // CRITICAL: The answer screen SHOULD be shown
      // This is the bug verification - if this fails, the bug exists
      expect(screen).toShowScreen('answer');
      expect(screen).toContainScreenText('clarify'); // Question prompt
    });

    it('should NOT show the answer screen when signal is success', async () => {
      await driver.start('menu');
      await driver.keypress('enter');
      await driver.input('Add a TypeScript function to validate emails using regex in src/utils.ts');
      await driver.keypress('enter');

      await driver.getWait().forStable(300);

      const screen = driver.getScreenCapture();

      // Should NOT show answer screen for clear requests
      expect(screen).toNotContainScreenText('clarify');
      // Should either show menu or list screen
      expect(screen.isScreen('menu') || screen.isScreen('list')).toBe(true);
    });
  });
});
```

### 5.2 Navigation Tests

```typescript
// tests/e2e/features/quest-navigation.e2e.ts

describe('Feature: Quest Navigation', () => {
  let driver: CLITestDriver;

  beforeEach(async () => {
    driver = new CLITestDriver({
      cwd: await ProjectFixture.createSimple(),
      useDebugProtocol: true,
    });
  });

  describe('Scenario: User navigates menu with arrow keys', () => {
    it('should move selection down when pressing down arrow', async () => {
      await driver.start('menu');

      // Initial selection
      let screen = driver.getScreenCapture();
      expect(screen).toHaveSelectedItem('Add');

      // Press down
      await driver.keypress('down');
      screen = driver.getScreenCapture();
      expect(screen).toHaveSelectedItem('Run');

      // Press down again
      await driver.keypress('down');
      screen = driver.getScreenCapture();
      expect(screen).toHaveSelectedItem('List');
    });

    it('should wrap selection when reaching bottom', async () => {
      await driver.start('menu');

      // Navigate to bottom
      await driver.keypress('down'); // Run
      await driver.keypress('down'); // List
      await driver.keypress('down'); // Help
      await driver.keypress('down'); // Exit
      await driver.keypress('down'); // Should wrap to Add

      const screen = driver.getScreenCapture();
      expect(screen).toHaveSelectedItem('Add');
    });
  });

  describe('Scenario: User exits screen with escape', () => {
    it('should return to menu when pressing escape on add screen', async () => {
      await driver.start('add');

      let screen = driver.getScreenCapture();
      expect(screen).toShowScreen('add');

      await driver.keypress('escape');

      screen = driver.getScreenCapture();
      expect(screen).toShowScreen('menu');
    });
  });
});
```

### 5.3 MCP Integration Tests

```typescript
// tests/e2e/features/mcp-integration.e2e.ts

import { MCPTestClient } from '../drivers/mcp-test-client';

describe('Feature: MCP Integration', () => {
  let mcp: MCPTestClient;

  beforeEach(async () => {
    mcp = new MCPTestClient();
    await mcp.connect();
  });

  afterEach(async () => {
    await mcp.disconnect();
  });

  describe('Scenario: CLI signals through MCP', () => {
    it('should receive needs-user-input signal via MCP', async () => {
      // Spawn the CLI through MCP
      const session = await mcp.callTool('spawn_chaoswhisperer', {
        userInput: 'fix something vague',
      });

      // Check for signal
      const signal = await mcp.waitForSignal('needs-user-input', {
        timeout: 30000,
      });

      expect(signal).toBeDefined();
      expect(signal.question).toBeDefined();
      expect(signal.context).toBeDefined();
    });

    it('should handle resume with answer', async () => {
      // First spawn
      const session = await mcp.callTool('spawn_chaoswhisperer', {
        userInput: 'add a feature',
      });

      // Wait for question
      await mcp.waitForSignal('needs-user-input');

      // Resume with answer
      const result = await mcp.callTool('resume_chaoswhisperer', {
        sessionId: session.id,
        answer: 'Add a user authentication feature with JWT',
      });

      expect(result.signal).toBe('success');
    });
  });
});
```

---

## 6. Integration with Existing Infrastructure

### 6.1 Extending ClaudeE2ERunner

The existing `ClaudeE2ERunner` in `tests/utils/claude-runner.ts` can be extended to support the debug protocol.

```typescript
// Enhancement to tests/utils/claude-runner.ts

export class ClaudeE2ERunner {
  // ... existing code ...

  /**
   * Create a debug protocol client for widget testing
   */
  createDebugClient(): CLITestDriver {
    return new CLITestDriver({
      cwd: this.projectDir,
      useDebugProtocol: true,
      timeout: 10000,
    });
  }

  /**
   * Execute with debug protocol for detailed assertions
   */
  async executeWithDebug(
    scenario: (driver: CLITestDriver) => Promise<void>
  ): Promise<void> {
    const driver = this.createDebugClient();
    try {
      await scenario(driver);
    } finally {
      await driver.stop();
    }
  }
}
```

### 6.2 Extending ProjectBootstrapper

```typescript
// Enhancement to tests/utils/project-bootstrapper.ts

export class ProjectBootstrapper {
  // ... existing code ...

  /**
   * Create project with pre-configured answer screen trigger
   */
  createProjectForAnswerScreenTest(name: string = 'answer-test') {
    const project = this.createSimpleProject(name);

    // Add mock broker that triggers needs-user-input
    // This allows testing the answer screen flow without real LLM calls

    return project;
  }
}
```

---

## 7. Test Configuration

### 7.1 Jest Configuration for E2E

```javascript
// tests/e2e/setup/jest.e2e.config.js

module.exports = {
  displayName: 'e2e',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/e2e/setup/e2e-setup.ts',
  ],
  globalSetup: '<rootDir>/tests/e2e/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/e2e/setup/global-teardown.ts',
  testTimeout: 60000,
  maxWorkers: 1, // E2E tests should run serially
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@dungeonmaster/(.*)$': '<rootDir>/packages/$1/src',
  },
};
```

### 7.2 E2E Setup

```typescript
// tests/e2e/setup/e2e-setup.ts

import { screenMatchers } from '../matchers/screen-matchers';
import { fileMatchers } from '../matchers/file-matchers';
import { callbackMatchers } from '../matchers/callback-matchers';

// Extend Jest matchers
expect.extend({
  ...screenMatchers,
  ...fileMatchers,
  ...callbackMatchers,
});

// Global timeout
jest.setTimeout(60000);

// Clean up temp directories after each test file
afterAll(async () => {
  // Cleanup handled by individual tests
});
```

---

## 8. Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific feature
npm run test:e2e -- --testPathPattern=quest-creation

# Run with verbose output
npm run test:e2e -- --verbose

# Run in watch mode (for development)
npm run test:e2e -- --watch

# Generate coverage
npm run test:e2e -- --coverage
```

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "jest --config tests/e2e/setup/jest.e2e.config.js"
  }
}
```

---

## 9. Testing the Bug Scenario

The specific bug where "prompts are NOT shown on screen" can be tested with:

```typescript
// tests/e2e/scenarios/regression/answer-screen-bug.e2e.ts

describe('Regression: Answer Screen Not Shown Bug', () => {
  /**
   * CONTEXT: When ChaosWhisperer returns a needs-user-input signal
   * with a question and context, the CLI should transition to the
   * answer screen to display the question.
   *
   * BUG: The CLI was returning to the menu screen instead of showing
   * the answer screen. This happened because:
   * 1. The signal.question or signal.context was undefined
   * 2. The condition in start-cli.ts fell through to the menu case
   *
   * This test verifies the fix by:
   * 1. Triggering a flow that produces needs-user-input
   * 2. Asserting the answer screen IS shown (not menu)
   * 3. Asserting the question prompt IS visible
   */

  it('should show answer screen when needs-user-input signal is received', async () => {
    const driver = new CLITestDriver({
      cwd: await ProjectFixture.createSimple(),
      useDebugProtocol: true,
    });

    await driver.start('menu');
    await driver.keypress('enter'); // Navigate to Add
    await driver.input('help me with something');
    await driver.keypress('enter'); // Submit

    // Wait for response processing
    await driver.getWait().forStable(500);

    const screen = driver.getScreenCapture();

    // BUG ASSERTION: If this fails, the bug has regressed
    expect(screen).toNotContainScreenText('Add'); // Should NOT be back at menu
    expect(screen).toNotContainScreenText('Run');

    // SUCCESS ASSERTION: Answer screen should be visible
    expect(screen).toShowScreen('answer');
    // Or at minimum, a question/prompt should be visible
    expect(screen.matches(/\?|clarif|question|need/i)).toBe(true);

    await driver.stop();
  });

  it('should correctly pass question and context to answer screen', async () => {
    const driver = new CLITestDriver({
      cwd: await ProjectFixture.createSimple(),
      useDebugProtocol: true,
    });

    await driver.start('menu');
    await driver.keypress('enter');
    await driver.input('do something');
    const response = await driver.keypress('enter');

    // The callback invocations tell us what was passed
    // In the answer screen flow, we need both question and context

    // If debug mode captures the pendingQuestion parameter:
    // This would be visible in the internal state or next screen render

    const screen = driver.getScreenCapture();

    // The answer screen should display the actual question
    // Not be empty or show generic text
    expect(screen.text().length).toBeGreaterThan(50);

    await driver.stop();
  });
});
```

---

## 10. Summary

This architecture provides:

1. **CLITestDriver** - Spawns CLI process and controls it via JSON debug protocol or PTY
2. **ScreenCapture** - Captures terminal frames and provides assertion methods
3. **WaitStrategies** - Handles async waiting for text, screens, callbacks, and stability
4. **FileSystemSpy** - Tracks file system changes during tests
5. **Custom Matchers** - Jest matchers for screen, file, and callback assertions
6. **BDD Structure** - Features organized by user scenario with Given/When/Then patterns

The key insight is leveraging the existing `start-debug.ts` JSON line protocol for reliable widget testing, while using the `ClaudeE2ERunner` for full orchestration tests. This dual approach allows:
- Fast, deterministic widget tests via debug protocol
- Full integration tests via the actual CLI

For the specific bug scenario (prompt not shown), the `toNotContainScreenText` matcher and `forNoText` wait strategy enable negative assertions - proving that unwanted behavior does NOT occur.
