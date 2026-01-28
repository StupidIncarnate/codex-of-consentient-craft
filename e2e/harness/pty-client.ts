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
