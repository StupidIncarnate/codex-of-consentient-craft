import { StartSessionStartHook } from './start-session-start-hook';
import { HookSessionStartResponder } from '../responders/hook/session-start/hook-session-start-responder';
import { isSessionStartHookDataContract } from '../contracts/is-session-start-hook-data/is-session-start-hook-data-contract';
import { debugDebugAdapter } from '../adapters/debug/debug/debug-debug-adapter';
import { hookSessionStartResponderResultContract } from '../contracts/hook-session-start-responder-result/hook-session-start-responder-result-contract';

// Mock dependencies
jest.mock('../responders/hook/session-start/hook-session-start-responder');
jest.mock('../contracts/is-session-start-hook-data/is-session-start-hook-data-contract');
jest.mock('../adapters/debug/debug/debug-debug-adapter');

const mockHookSessionStartResponder = jest.mocked(HookSessionStartResponder);
const mockIsSessionStartHookDataContract = jest.mocked(isSessionStartHookDataContract);
const mockDebugDebugAdapter = jest.mocked(debugDebugAdapter);

describe('start-session-start-hook', () => {
  let originalStdout: typeof process.stdout.write;
  let originalExit: typeof process.exit;
  let stdoutOutput: string;
  let exitCode: number | undefined;
  let mockLog: jest.Mock;

  beforeEach(() => {
    stdoutOutput = '';
    exitCode = undefined;
    mockLog = jest.fn();

    // Mock process.stdout.write
    originalStdout = process.stdout.write;
    process.stdout.write = jest.fn((chunk: string | Uint8Array): boolean => {
      stdoutOutput += chunk.toString();
      return true;
    }) as typeof process.stdout.write;

    // Mock process.exit
    originalExit = process.exit;
    process.exit = jest.fn((code?: number): never => {
      exitCode = code;
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit;

    mockDebugDebugAdapter.mockReturnValue(mockLog as never);
    mockHookSessionStartResponder.mockReset();
    mockIsSessionStartHookDataContract.mockReset();
  });

  afterEach(() => {
    process.stdout.write = originalStdout;
    process.exit = originalExit;
  });

  describe('StartSessionStartHook', () => {
    it('VALID: {inputData: valid JSON with session start data, shouldOutput: true} => outputs content and exits 0', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'SessionStart', data: {} });
      mockIsSessionStartHookDataContract.mockReturnValueOnce(true);
      const resultStub = hookSessionStartResponderResultContract.parse({
        shouldOutput: true,
        content: 'Standards content here',
      });
      mockHookSessionStartResponder.mockResolvedValueOnce(resultStub);

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow(
        'process.exit called with code 0',
      );
      expect(exitCode).toBe(0);
      expect(stdoutOutput).toBe('Standards content here');
      expect(mockIsSessionStartHookDataContract).toHaveBeenCalledWith({
        data: JSON.parse(inputData),
      });
      expect(mockHookSessionStartResponder).toHaveBeenCalledWith({ input: JSON.parse(inputData) });
    });

    it('VALID: {inputData: valid JSON, shouldOutput: false} => no output and exits 0', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'SessionStart', data: {} });
      mockIsSessionStartHookDataContract.mockReturnValueOnce(true);
      const resultStub = hookSessionStartResponderResultContract.parse({
        shouldOutput: false,
      });
      mockHookSessionStartResponder.mockResolvedValueOnce(resultStub);

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow(
        'process.exit called with code 0',
      );
      expect(exitCode).toBe(0);
      expect(stdoutOutput).toBe('');
    });

    it('VALID: {inputData: valid JSON, content: undefined} => no output and exits 0', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'SessionStart', data: {} });
      mockIsSessionStartHookDataContract.mockReturnValueOnce(true);
      const resultStub = hookSessionStartResponderResultContract.parse({
        shouldOutput: true,
      });
      mockHookSessionStartResponder.mockResolvedValueOnce(resultStub);

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow(
        'process.exit called with code 0',
      );
      expect(exitCode).toBe(0);
      expect(stdoutOutput).toBe('');
    });

    it('VALID: {inputData: valid JSON, content: empty string} => no output and exits 0', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'SessionStart', data: {} });
      mockIsSessionStartHookDataContract.mockReturnValueOnce(true);
      const resultStub = hookSessionStartResponderResultContract.parse({
        shouldOutput: true,
        content: '',
      });
      mockHookSessionStartResponder.mockResolvedValueOnce(resultStub);

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow(
        'process.exit called with code 0',
      );
      expect(exitCode).toBe(0);
      expect(stdoutOutput).toBe('');
    });

    it('INVALID_INPUT: {inputData: invalid JSON} => logs error and exits with code 1', async () => {
      const inputData = 'invalid json';

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow(
        'process.exit called with code 1',
      );
      expect(exitCode).toBe(1);
      expect(mockLog).toHaveBeenCalledWith('Error in session start hook:', expect.any(Error));
    });

    it('INVALID_DATA: {inputData: JSON with invalid session data} => logs error and exits with code 1', async () => {
      const inputData = JSON.stringify({ invalid: 'data' });
      mockIsSessionStartHookDataContract.mockReturnValueOnce(false);

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow(
        'process.exit called with code 1',
      );
      expect(exitCode).toBe(1);
      expect(mockLog).toHaveBeenCalledWith('Invalid hook data format');
    });

    it('ERROR: {inputData: valid data, responder throws} => logs error and exits with code 1', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'SessionStart', data: {} });
      const error = new Error('Responder error');
      mockIsSessionStartHookDataContract.mockReturnValueOnce(true);
      mockHookSessionStartResponder.mockRejectedValueOnce(error);

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow(
        'process.exit called with code 1',
      );
      expect(exitCode).toBe(1);
      expect(mockLog).toHaveBeenCalledWith('Error in session start hook:', error);
    });
  });
});
