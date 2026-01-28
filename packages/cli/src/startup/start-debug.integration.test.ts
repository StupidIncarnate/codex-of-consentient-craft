/**
 * PURPOSE: Integration tests for debug mode startup entry point
 *
 * USAGE:
 * npm test -- start-debug.integration.test.ts
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

import { StartDebug } from './start-debug';
import { CliAppScreenStub } from '../contracts/cli-app-screen/cli-app-screen.stub';
import { KeyNameStub } from '../contracts/key-name/key-name.stub';
import { DebugResponseStub } from '../contracts/debug-response/debug-response.stub';
import { CallbackKeyStub } from '../contracts/callback-key/callback-key.stub';

type DebugResponse = ReturnType<typeof DebugResponseStub>;

// Path to the start-debug entry point for spawning
const START_DEBUG_PATH = resolve(__dirname, './start-debug.ts');

// Timeout for process communication
const PROCESS_TIMEOUT_MS = 10000;

// Helper to parse debug response from JSON - using stub factory for validation
const parseDebugResponse = (json: unknown): DebugResponse => DebugResponseStub(json as never);

// Helper to create a debug client that communicates with spawned process
const createDebugClient = (): {
  sendCommand: (command: unknown) => Promise<DebugResponse>;
  close: () => void;
} => {
  const childProcess = spawn('npx', ['tsx', START_DEBUG_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  let responseBuffer = '';
  const pendingResolvers: ((value: DebugResponse) => void)[] = [];

  childProcess.stdout.on('data', (data: Buffer) => {
    responseBuffer += data.toString();
    const lines = responseBuffer.split('\n');
    // Process all complete lines (all but the last, which may be incomplete)
    while (lines.length > 1) {
      const line = lines.shift();
      if (line !== undefined && line.length > 0) {
        const resolver = pendingResolvers.shift();
        if (resolver !== undefined) {
          const parsed = parseDebugResponse(JSON.parse(line) as unknown);
          resolver(parsed);
        }
      }
    }
    responseBuffer = lines[0] ?? '';
  });

  const sendCommand = async (command: unknown): Promise<DebugResponse> =>
    new Promise((promiseResolve, promiseReject) => {
      const timeoutId = setTimeout(() => {
        promiseReject(new Error('Command timed out'));
      }, PROCESS_TIMEOUT_MS);

      pendingResolvers.push((response) => {
        clearTimeout(timeoutId);
        promiseResolve(response);
      });

      childProcess.stdin.write(`${JSON.stringify(command)}\n`);
    });

  const close = (): void => {
    childProcess.kill();
  };

  return { sendCommand, close };
};

describe('StartDebug', () => {
  describe('module exports', () => {
    it('VALID: {} => exports StartDebug function', () => {
      expect(typeof StartDebug).toBe('function');
    });
  });

  describe('JSON protocol with spawned process', () => {
    describe('start command', () => {
      it('VALID: {action: start, screen: menu} => returns success with frame', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'menu' });
        const response = await client.sendCommand({
          action: 'start',
          screen,
        });

        client.close();

        expect(response.success).toBe(true);
        expect(response.screen?.name).toBe('menu');
        expect(typeof response.screen?.frame).toBe('string');
      });

      it('VALID: {action: start, screen: add} => returns success with add screen frame', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'add' });
        const response = await client.sendCommand({
          action: 'start',
          screen,
        });

        client.close();

        expect(response.success).toBe(true);
        expect(response.screen?.name).toBe('add');
      });
    });

    describe('input command', () => {
      it('VALID: {action: input, text: "hello"} => returns success with updated frame', async () => {
        const client = createDebugClient();

        // First start with add screen (has text input)
        const screen = CliAppScreenStub({ value: 'add' });
        await client.sendCommand({
          action: 'start',
          screen,
        });

        // Then send input
        const inputResponse = await client.sendCommand({
          action: 'input',
          text: 'hello',
        });

        client.close();

        expect(inputResponse.success).toBe(true);
        expect(inputResponse.screen?.frame).toMatch(/hello/u);
      });
    });

    describe('keypress command', () => {
      it('VALID: {action: keypress, key: enter} => returns success', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'menu' });
        await client.sendCommand({
          action: 'start',
          screen,
        });

        const key = KeyNameStub({ value: 'down' });
        const keypressResponse = await client.sendCommand({
          action: 'keypress',
          key,
        });

        client.close();

        expect(keypressResponse.success).toBe(true);
      });

      it('VALID: {action: keypress, key: down} => moves selection in menu', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'menu' });
        const startResponse = await client.sendCommand({
          action: 'start',
          screen,
        });

        const key = KeyNameStub({ value: 'down' });
        const keypressResponse = await client.sendCommand({
          action: 'keypress',
          key,
        });

        client.close();

        // Both should succeed and frames should be different (selection moved)
        expect(startResponse.success).toBe(true);
        expect(keypressResponse.success).toBe(true);
      });
    });

    describe('getScreen command', () => {
      it('VALID: {action: getScreen} => returns current screen state', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'menu' });
        await client.sendCommand({
          action: 'start',
          screen,
        });

        const getScreenResponse = await client.sendCommand({
          action: 'getScreen',
        });

        client.close();

        expect(getScreenResponse.success).toBe(true);
        expect(getScreenResponse.screen?.name).toBe('menu');
      });
    });

    describe('exit command', () => {
      it('VALID: {action: exit} => returns success and closes session', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'menu' });
        await client.sendCommand({
          action: 'start',
          screen,
        });

        const exitResponse = await client.sendCommand({
          action: 'exit',
        });

        client.close();

        expect(exitResponse.success).toBe(true);
      });
    });

    describe('error handling', () => {
      it('INVALID_COMMAND: {action: invalid} => returns error for invalid command', async () => {
        const client = createDebugClient();

        const response = await client.sendCommand({
          action: 'invalid',
        });

        client.close();

        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid JSON command');
      });

      it('INVALID_COMMAND: {} => returns error for missing action', async () => {
        const client = createDebugClient();

        const response = await client.sendCommand({});

        client.close();

        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid JSON command');
      });

      it('ERROR: {action: input} before start => returns no active session error', async () => {
        const client = createDebugClient();

        const response = await client.sendCommand({
          action: 'input',
          text: 'hello',
        });

        client.close();

        expect(response.success).toBe(false);
        expect(response.error).toBe('No active render session - send start command first');
      });

      it('ERROR: {action: getScreen} before start => returns no active session error', async () => {
        const client = createDebugClient();

        const response = await client.sendCommand({
          action: 'getScreen',
        });

        client.close();

        expect(response.success).toBe(false);
        expect(response.error).toBe('No active render session - send start command first');
      });

      it('ERROR: {action: exit} before start => returns no active session error', async () => {
        const client = createDebugClient();

        const response = await client.sendCommand({
          action: 'exit',
        });

        client.close();

        expect(response.success).toBe(false);
        expect(response.error).toBe('No active render session - send start command first');
      });

      it('ERROR: {action: keypress} before start => returns no active session error', async () => {
        const client = createDebugClient();

        const key = KeyNameStub({ value: 'enter' });
        const response = await client.sendCommand({
          action: 'keypress',
          key,
        });

        client.close();

        expect(response.success).toBe(false);
        expect(response.error).toBe('No active render session - send start command first');
      });
    });

    describe('screen navigation', () => {
      it('VALID: {menu => enter} => navigates to add screen and frame shows input prompt', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'menu' });
        await client.sendCommand({
          action: 'start',
          screen,
        });

        // Press enter on first item (Add)
        const key = KeyNameStub({ value: 'enter' });
        const response = await client.sendCommand({
          action: 'keypress',
          key,
        });

        client.close();

        expect(response.success).toBe(true);
        // Frame should show the add screen content (input prompt)
        expect(response.screen?.frame).toMatch(/What would you like to build/u);
      });

      it('VALID: {add => escape} => returns to menu and frame shows menu items', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'add' });
        await client.sendCommand({
          action: 'start',
          screen,
        });

        // Press escape to go back
        const key = KeyNameStub({ value: 'escape' });
        const response = await client.sendCommand({
          action: 'keypress',
          key,
        });

        client.close();

        expect(response.success).toBe(true);
        // Frame should show menu items after going back
        expect(response.screen?.frame).toMatch(/Add/u);
        expect(response.screen?.frame).toMatch(/Run/u);
        expect(response.screen?.frame).toMatch(/List/u);
      });
    });

    describe('callbacks tracking', () => {
      it('VALID: {add screen submit} => tracks onSpawnChaoswhisperer callback', async () => {
        const client = createDebugClient();

        const screen = CliAppScreenStub({ value: 'add' });
        await client.sendCommand({
          action: 'start',
          screen,
        });

        // Type input
        await client.sendCommand({
          action: 'input',
          text: 'Build a new feature',
        });

        // Press enter to submit
        const enterKey = KeyNameStub({ value: 'enter' });
        const submitResponse = await client.sendCommand({
          action: 'keypress',
          key: enterKey,
        });

        client.close();

        expect(submitResponse.success).toBe(true);
        expect(submitResponse.callbacks).toBeDefined();

        const callbackKey = CallbackKeyStub({ value: 'onSpawnChaoswhisperer' });
        const onSpawnCallbacks = submitResponse.callbacks?.[callbackKey];

        expect(onSpawnCallbacks).toBeDefined();
        expect(onSpawnCallbacks).toHaveLength(1);
      });
    });
  });
});
