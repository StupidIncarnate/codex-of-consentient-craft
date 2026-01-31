/**
 * PURPOSE: Provides a full CLI test driver using node-pty for real terminal interactions
 *
 * USAGE:
 * const driver = createFullCliDriver({ cwd: testDir, timeout: 120000 });
 * await driver.start();
 * await driver.waitForScreen('menu');
 * await driver.input('Hello world');
 * await driver.pressKey('enter');
 * await driver.waitForText('Agent needs your input', { timeout: 90000 });
 * await driver.waitForQuestCreation('my-quest', 60000);
 * await driver.stop();
 *
 * This driver spawns the real CLI via node-pty and interacts with it as a real terminal.
 * Unlike debug mode, this tests the full flow including Claude API calls.
 *
 * Key codes:
 * - Enter: '\r'
 * - Escape: '\x1b'
 * - Up: '\x1b[A'
 * - Down: '\x1b[B'
 *
 * Screen detection patterns:
 * - menu: Contains "Add", "Run", "List" options
 * - add: Contains "What would you like to build"
 * - list: Contains quest list items or "No quests"
 * - answer: Contains question from Claude
 */

import * as pty from 'node-pty';
import { resolve, join } from 'path';
import { EventEmitter } from 'events';
import { existsSync, readdirSync } from 'fs';

import { createScreenCapture, stripAnsiCodes, type ScreenCapture, type ScreenType } from './screen-capture';

/**
 * Configuration for the full CLI driver
 */
export interface FullCliDriverConfig {
  /** Working directory for the CLI process */
  cwd: string;
  /** Path to the CLI entry point (defaults to packages/cli/src/startup/start-cli.ts or use npx tsx packages/cli/src/startup/start-cli.ts) */
  cliPath?: string;
  /** Global timeout for operations in milliseconds (default: 120000 = 2 minutes) */
  timeout?: number;
  /** Polling interval for wait operations in milliseconds (default: 100) */
  pollInterval?: number;
  /** Terminal columns (default: 120) */
  cols?: number;
  /** Terminal rows (default: 40) */
  rows?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Environment variables to pass to the CLI */
  env?: Record<string, string>;
}

/**
 * Key names that can be sent via pressKey
 */
export type FullCliKeyName = 'enter' | 'escape' | 'up' | 'down' | 'backspace' | 'tab' | 'left' | 'right';

/**
 * Wait configuration for waitFor operations
 */
export interface WaitForConfig {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Polling interval in milliseconds */
  interval?: number;
}

/**
 * Full CLI test driver interface
 */
export interface FullCliDriver {
  /** Spawn the CLI and wait for initial render */
  start: () => Promise<void>;
  /** Wait for a specific screen type to appear */
  waitForScreen: (screenType: ScreenType, timeout?: number) => Promise<boolean>;
  /** Send text input to the CLI (alias for type) */
  input: (text: string) => void;
  /** Type text into the terminal */
  type: (text: string) => void;
  /** Press a special key */
  pressKey: (key: FullCliKeyName) => void;
  /** Send raw data to the terminal */
  write: (data: string) => void;
  /** Get the current screen capture */
  getScreen: () => ScreenCapture;
  /** Get the raw terminal output */
  getRawOutput: () => string;
  /** Wait for quest file to appear with name pattern */
  waitForQuestCreation: (namePattern: string, timeout?: number) => Promise<string | null>;
  /** Wait for specific text to appear on screen */
  waitForText: (text: string, config?: WaitForConfig) => Promise<ScreenCapture>;
  /** Wait for specific text to disappear from screen */
  waitForNoText: (text: string, config?: WaitForConfig) => Promise<ScreenCapture>;
  /** Wait for a regex pattern to match */
  waitForPattern: (pattern: RegExp, config?: WaitForConfig) => Promise<ScreenCapture>;
  /** Wait for screen to stabilize (no changes for N ms) */
  waitForStable: (config?: WaitForConfig & { stableFor?: number }) => Promise<ScreenCapture>;
  /** Kill the CLI process and clean up */
  stop: () => Promise<void>;
  /** Check if the driver is currently running */
  isRunning: () => boolean;
  /** Get the detected screen type */
  getScreenType: () => ScreenType;
  /** Subscribe to output events */
  on: (event: 'output' | 'exit', listener: (data: string | number) => void) => void;
}

/**
 * Key escape codes for terminal control
 */
export const FULL_CLI_KEY_CODES: Record<FullCliKeyName, string> = {
  enter: '\r',
  escape: '\x1b',
  up: '\x1b[A',
  down: '\x1b[B',
  left: '\x1b[D',
  right: '\x1b[C',
  backspace: '\x7f',
  tab: '\t',
};

/**
 * Screen patterns for detection
 */
const SCREEN_PATTERNS: Record<ScreenType, RegExp[]> = {
  menu: [/add.*run.*list/i, /welcome.*dungeonmaster/i, /select.*option/i],
  add: [/what would you like to build/i, /describe.*feature/i, /enter.*quest/i],
  list: [/quests/i, /available.*quests/i, /quest.*list/i, /no\s*quests/i],
  run: [/running.*quest/i, /executing/i, /quest.*progress/i],
  help: [/help/i, /usage/i, /commands/i],
  answer: [/agent needs your input/i, /provide.*response/i, /waiting.*input/i],
  init: [/initializing/i, /setup/i, /configure/i],
  unknown: [],
};

// Quest storage directory
const QUEST_DIR = '.dungeonmaster-quests';

/**
 * Creates a full CLI test driver using node-pty
 */
export const createFullCliDriver = (config: FullCliDriverConfig): FullCliDriver => {
  const {
    cwd,
    cliPath: customCliPath,
    timeout: globalTimeout = 120000,
    pollInterval = 100,
    cols = 120,
    rows = 40,
    debug = process.env['DEBUG_E2E'] === 'true',
    env = {},
  } = config;

  let ptyProcess: pty.IPty | null = null;
  let outputBuffer = '';
  let isActive = false;
  const emitter = new EventEmitter();

  // Path to the CLI entry point (can be overridden)
  const cliPath = customCliPath ?? resolve(__dirname, '../../../packages/cli/src/startup/start-cli.ts');

  const log = (...args: unknown[]): void => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log('[FullCliDriver]', ...args);
    }
  };

  /**
   * Detect screen type from current output
   */
  const detectScreenType = (text: string): ScreenType => {
    for (const [screenType, patterns] of Object.entries(SCREEN_PATTERNS)) {
      if (screenType === 'unknown') continue;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return screenType as ScreenType;
        }
      }
    }
    return 'unknown';
  };

  /**
   * Find quest folders matching a name pattern
   */
  const findQuestWithName = (namePattern: string): string | null => {
    const questDir = join(cwd, QUEST_DIR);
    if (!existsSync(questDir)) return null;

    try {
      const entries = readdirSync(questDir, { withFileTypes: true });
      const pattern = namePattern.toLowerCase();

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.toLowerCase().includes(pattern)) {
          return join(questDir, entry.name);
        }
      }
    } catch (_e) {
      // Directory not accessible
    }

    return null;
  };

  const driver: FullCliDriver = {
    start: async (): Promise<void> => {
      if (isActive) {
        throw new Error('Driver already started');
      }

      log('Starting CLI with cwd:', cwd);

      // Spawn the CLI via node-pty using npx tsx
      ptyProcess = pty.spawn('npx', ['tsx', cliPath], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env: Object.fromEntries(
          Object.entries({
            ...process.env,
            // Force non-interactive mode optimizations
            CI: 'false', // We WANT interactive mode for the CLI
            TERM: 'xterm-256color',
            // Force color output in TTY
            FORCE_COLOR: '1',
            // Custom env vars
            ...env,
          }).filter(([k, v]) => v !== undefined && k !== 'FORCE_HEADLESS'),
        ) as Record<string, string>,
      });

      isActive = true;
      outputBuffer = '';

      // Capture output
      ptyProcess.onData((data: string) => {
        outputBuffer += data;
        log('Output:', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
        emitter.emit('output', data);
      });

      ptyProcess.onExit(({ exitCode }) => {
        log('CLI exited with code:', exitCode);
        isActive = false;
        emitter.emit('exit', exitCode);
      });

      // Wait for initial output to appear (CLI should render quickly)
      await new Promise<void>((promiseResolve) => {
        const checkInterval = setInterval(() => {
          if (outputBuffer.length > 0) {
            clearInterval(checkInterval);
            promiseResolve();
          }
        }, 50);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          promiseResolve();
        }, 10000);
      });

      log('CLI started, initial output length:', outputBuffer.length);
    },

    stop: async (): Promise<void> => {
      if (ptyProcess !== null) {
        log('Stopping CLI');
        ptyProcess.kill();
        ptyProcess = null;
        isActive = false;

        // Wait for exit event
        await new Promise<void>((promiseResolve) => {
          const timeout = setTimeout(promiseResolve, 1000);
          emitter.once('exit', () => {
            clearTimeout(timeout);
            promiseResolve();
          });
        });
      }
    },

    input: (text: string): void => {
      if (ptyProcess === null) {
        throw new Error('CLI not started. Call start() first.');
      }
      log('Sending input:', text);
      ptyProcess.write(text);
    },

    type: (text: string): void => {
      // Alias for input
      if (ptyProcess === null) {
        throw new Error('CLI not started. Call start() first.');
      }
      log('Typing:', text);
      ptyProcess.write(text);
    },

    pressKey: (key: FullCliKeyName): void => {
      if (ptyProcess === null) {
        throw new Error('CLI not started. Call start() first.');
      }
      const code = FULL_CLI_KEY_CODES[key];
      if (code === undefined) {
        throw new Error(`Unknown key: ${key}`);
      }
      log('Pressing key:', key, 'code:', code.replace(/\x1b/g, '\\x1b'));
      ptyProcess.write(code);
    },

    write: (data: string): void => {
      if (ptyProcess === null) {
        throw new Error('CLI not started');
      }
      log('Writing raw:', data.length, 'bytes');
      ptyProcess.write(data);
    },

    getScreen: (): ScreenCapture => createScreenCapture(outputBuffer),

    getRawOutput: (): string => outputBuffer,

    waitForText: async (text: string, waitConfig?: WaitForConfig): Promise<ScreenCapture> => {
      const timeout = waitConfig?.timeout ?? globalTimeout;
      const interval = waitConfig?.interval ?? 500;
      const startTime = Date.now();

      log('Waiting for text:', text, 'timeout:', timeout);

      while (Date.now() - startTime < timeout) {
        const screen = createScreenCapture(outputBuffer);
        if (screen.contains(text)) {
          log('Found text:', text);
          return screen;
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      const screen = createScreenCapture(outputBuffer);
      throw new Error(
        `Timeout waiting for text "${text}" after ${timeout}ms.\n\nScreen content:\n${screen.text}`,
      );
    },

    waitForNoText: async (text: string, waitConfig?: WaitForConfig): Promise<ScreenCapture> => {
      const timeout = waitConfig?.timeout ?? globalTimeout;
      const interval = waitConfig?.interval ?? 500;
      const startTime = Date.now();

      log('Waiting for NO text:', text, 'timeout:', timeout);

      while (Date.now() - startTime < timeout) {
        const screen = createScreenCapture(outputBuffer);
        if (screen.notContains(text)) {
          log('Text gone:', text);
          return screen;
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      const screen = createScreenCapture(outputBuffer);
      throw new Error(
        `Timeout waiting for text "${text}" to disappear after ${timeout}ms.\n\nScreen content:\n${screen.text}`,
      );
    },

    waitForPattern: async (pattern: RegExp, waitConfig?: WaitForConfig): Promise<ScreenCapture> => {
      const timeout = waitConfig?.timeout ?? globalTimeout;
      const interval = waitConfig?.interval ?? 500;
      const startTime = Date.now();

      log('Waiting for pattern:', pattern, 'timeout:', timeout);

      while (Date.now() - startTime < timeout) {
        const screen = createScreenCapture(outputBuffer);
        if (screen.matches(pattern)) {
          log('Pattern matched:', pattern);
          return screen;
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      const screen = createScreenCapture(outputBuffer);
      throw new Error(
        `Timeout waiting for pattern ${String(pattern)} after ${timeout}ms.\n\nScreen content:\n${screen.text}`,
      );
    },

    waitForStable: async (
      waitConfig?: WaitForConfig & { stableFor?: number },
    ): Promise<ScreenCapture> => {
      const timeout = waitConfig?.timeout ?? globalTimeout;
      const interval = waitConfig?.interval ?? 200;
      const stableFor = waitConfig?.stableFor ?? 1000;
      const startTime = Date.now();

      log('Waiting for stable screen, stableFor:', stableFor, 'timeout:', timeout);

      let lastContent = '';
      let stableStartTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const currentContent = outputBuffer;

        if (currentContent === lastContent) {
          if (Date.now() - stableStartTime >= stableFor) {
            log('Screen stable');
            return createScreenCapture(outputBuffer);
          }
        } else {
          lastContent = currentContent;
          stableStartTime = Date.now();
        }

        await new Promise((r) => setTimeout(r, interval));
      }

      const screen = createScreenCapture(outputBuffer);
      throw new Error(
        `Timeout waiting for stable screen after ${timeout}ms.\n\nScreen content:\n${screen.text}`,
      );
    },

    isRunning: (): boolean => isActive,

    getScreenType: (): ScreenType => detectScreenType(stripAnsiCodes(outputBuffer)),

    waitForScreen: async (screenType: ScreenType, timeout?: number): Promise<boolean> => {
      const waitTimeout = timeout ?? globalTimeout;
      const interval = pollInterval;
      const startTime = Date.now();

      log('Waiting for screen:', screenType, 'timeout:', waitTimeout);

      while (Date.now() - startTime < waitTimeout) {
        const cleanText = stripAnsiCodes(outputBuffer);
        const detected = detectScreenType(cleanText);
        if (detected === screenType) {
          log('Found screen:', screenType);
          return true;
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      log('Timeout waiting for screen:', screenType, 'current:', detectScreenType(stripAnsiCodes(outputBuffer)));
      return false;
    },

    waitForQuestCreation: async (namePattern: string, timeout?: number): Promise<string | null> => {
      const waitTimeout = timeout ?? globalTimeout;
      const interval = 500;
      const startTime = Date.now();

      log('Waiting for quest with name pattern:', namePattern);

      while (Date.now() - startTime < waitTimeout) {
        const questPath = findQuestWithName(namePattern);
        if (questPath !== null) {
          log('Found quest:', questPath);
          return questPath;
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      log('Timeout waiting for quest:', namePattern);
      return null;
    },

    on: (event: 'output' | 'exit', listener: (data: string | number) => void): void => {
      emitter.on(event, listener);
    },
  };

  return driver;
};

/**
 * Helper to create a driver with standard E2E test settings
 */
export const createE2ECliDriver = (
  cwd: string,
  options?: Partial<FullCliDriverConfig>,
): FullCliDriver =>
  createFullCliDriver({
    cwd,
    timeout: 120000,
    debug: process.env['DEBUG_E2E'] === 'true',
    ...options,
  });
