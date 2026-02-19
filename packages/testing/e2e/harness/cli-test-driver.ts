/**
 * PURPOSE: Provides a high-level driver for E2E CLI testing in DEBUG MODE
 *
 * USAGE:
 * const driver = createCliTestDriver({ mode: 'debug', cwd: testProject.rootDir });
 * await driver.start({ screen: 'menu' });
 * await driver.input('Build a REST API');
 * await driver.keypress('enter');
 * const screen = driver.getScreen();
 * expect(screen.contains('quest created')).toBe(true);
 * await driver.stop();
 *
 * For FULL CLI MODE (with node-pty), see: ./full-cli-driver.ts
 *
 * Supports:
 * - Debug mode: For widget testing via JSON protocol
 */

import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { resolve } from 'path';

import { type ScreenCapture, createScreenCapture } from './screen-capture';

/**
 * Key names that can be sent via keypress
 */
export type KeyName = 'enter' | 'escape' | 'up' | 'down' | 'backspace' | 'tab';

/**
 * Screen names supported by the CLI
 */
export type CliScreen = 'menu' | 'help' | 'list' | 'init' | 'run';

/**
 * Mode of operation for the test driver
 */
export type DriverMode = 'debug' | 'full';

/**
 * Configuration for creating a CLI test driver
 */
export interface CliTestDriverConfig {
  /** The mode of operation: 'debug' for widget testing, 'full' for complete flow */
  mode: DriverMode;
  /** Path to the CLI entry point (defaults to debug mode entry point) */
  cliPath?: string;
  /** Timeout for commands in milliseconds */
  timeout?: number;
  /** Working directory for the CLI process */
  cwd?: string;
}

/**
 * Debug protocol response structure
 */
export interface DebugResponse {
  success: boolean;
  screen?: {
    name: string;
    frame: string;
    elements: unknown[];
  };
  callbacks?: {
    onRunQuest?: { questId: string; questFolder: string }[];
    onExit?: Record<PropertyKey, never>[];
  };
  error?: string;
}

/**
 * Driver start options
 */
export interface StartOptions {
  /** The initial screen to display */
  screen: CliScreen;
}

/**
 * High-level CLI test driver supporting both debug and full modes
 */
export interface CliTestDriver {
  /** Start the CLI session with the specified screen */
  start: (options: StartOptions) => Promise<DebugResponse>;
  /** Send text input to the CLI */
  input: (text: string) => Promise<DebugResponse>;
  /** Send a keypress to the CLI */
  keypress: (key: KeyName) => Promise<DebugResponse>;
  /** Get the current screen state */
  getScreen: () => ScreenCapture;
  /** Get the raw debug response */
  getRawResponse: () => DebugResponse | null;
  /** Get callback invocations from the last response */
  getCallbacks: () => DebugResponse['callbacks'];
  /** Stop the CLI session and clean up */
  stop: () => Promise<void>;
  /** Check if the driver is currently running */
  isRunning: () => boolean;
}

// Default paths
const DEFAULT_DEBUG_PATH = resolve(__dirname, '../../../packages/cli/src/startup/start-debug.ts');
const DEFAULT_TIMEOUT_MS = 10000;

// Key escape codes matching debug-keys-statics.ts
const KEY_CODES: Record<KeyName, string> = {
  enter: '\r',
  escape: '\x1B',
  up: '\x1B[A',
  down: '\x1B[B',
  backspace: '\x7F',
  tab: '\t',
};

/**
 * Creates a CLI test driver for E2E testing
 */
export const createCliTestDriver = (config: CliTestDriverConfig): CliTestDriver => {
  const {
    mode,
    cliPath = DEFAULT_DEBUG_PATH,
    timeout = DEFAULT_TIMEOUT_MS,
    cwd = process.cwd(),
  } = config;

  let childProcess: ChildProcessWithoutNullStreams | null = null;
  let responseBuffer = '';
  let pendingResolvers: ((value: DebugResponse) => void)[] = [];
  let lastResponse: DebugResponse | null = null;
  let currentFrame = '';
  let isActive = false;

  /**
   * Sends a command to the debug CLI and waits for response
   */
  const sendDebugCommand = async (command: unknown): Promise<DebugResponse> =>
    new Promise((promiseResolve, promiseReject) => {
      if (childProcess === null) {
        promiseReject(new Error('CLI process not started'));
        return;
      }

      const timeoutId = setTimeout(() => {
        promiseReject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      pendingResolvers.push((response) => {
        clearTimeout(timeoutId);
        promiseResolve(response);
      });

      childProcess.stdin.write(`${JSON.stringify(command)}\n`);
    });

  /**
   * Spawns the CLI process in debug mode
   */
  const spawnDebugProcess = (): void => {
    childProcess = spawn('npx', ['tsx', cliPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
    });

    childProcess.stdout.on('data', (data: Buffer) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split('\n');

      // Process all complete lines (all but the last, which may be incomplete)
      while (lines.length > 1) {
        const line = lines.shift();
        if (line !== undefined && line.length > 0) {
          const resolver = pendingResolvers.shift();
          if (resolver !== undefined) {
            try {
              const parsed = JSON.parse(line) as DebugResponse;
              lastResponse = parsed;
              if (parsed.screen?.frame !== undefined) {
                currentFrame = parsed.screen.frame;
              }
              resolver(parsed);
            } catch (_e) {
              resolver({
                success: false,
                error: `Failed to parse response: ${line}`,
              });
            }
          }
        }
      }
      responseBuffer = lines[0] ?? '';
    });

    childProcess.stderr.on('data', (data: Buffer) => {
      // Log stderr for debugging but don't fail
      const errorMsg = data.toString().trim();
      if (errorMsg && process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.error(`[CLI stderr]: ${errorMsg}`);
      }
    });

    childProcess.on('error', (error: Error) => {
      // Reject all pending resolvers on error
      const errorResponse: DebugResponse = {
        success: false,
        error: `Process error: ${error.message}`,
      };
      pendingResolvers.forEach((resolver) => {
        resolver(errorResponse);
      });
      pendingResolvers = [];
    });

    childProcess.on('close', () => {
      isActive = false;
    });
  };

  // Driver implementation
  const driver: CliTestDriver = {
    start: async (options: StartOptions): Promise<DebugResponse> => {
      if (mode === 'debug') {
        if (childProcess === null) {
          spawnDebugProcess();
        }
        isActive = true;
        return sendDebugCommand({ action: 'start', screen: options.screen });
      }

      // Full mode: Use ClaudeE2ERunner (to be implemented)
      throw new Error('Full CLI mode not yet implemented');
    },

    input: async (text: string): Promise<DebugResponse> => {
      if (!isActive) {
        return {
          success: false,
          error: 'Driver not started - call start() first',
        };
      }

      if (mode === 'debug') {
        return sendDebugCommand({ action: 'input', text });
      }

      throw new Error('Full CLI mode not yet implemented');
    },

    keypress: async (key: KeyName): Promise<DebugResponse> => {
      if (!isActive) {
        return {
          success: false,
          error: 'Driver not started - call start() first',
        };
      }

      if (mode === 'debug') {
        return sendDebugCommand({ action: 'keypress', key });
      }

      throw new Error('Full CLI mode not yet implemented');
    },

    getScreen: (): ScreenCapture => createScreenCapture(currentFrame),

    getRawResponse: (): DebugResponse | null => lastResponse,

    getCallbacks: (): DebugResponse['callbacks'] => lastResponse?.callbacks,

    stop: async (): Promise<void> => {
      if (mode === 'debug' && childProcess !== null) {
        try {
          await sendDebugCommand({ action: 'exit' });
        } catch (_e) {
          // Ignore timeout errors during shutdown
        }
        childProcess.kill();
        childProcess = null;
        isActive = false;
        responseBuffer = '';
        pendingResolvers = [];
        lastResponse = null;
        currentFrame = '';
      }
    },

    isRunning: (): boolean => isActive,
  };

  return driver;
};

/**
 * Re-export key codes for direct use in tests
 */
export { KEY_CODES };
