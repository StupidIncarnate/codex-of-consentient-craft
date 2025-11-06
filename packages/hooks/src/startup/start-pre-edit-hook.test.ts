import { StartPreEditHook } from './start-pre-edit-hook';
import { HookPreEditResponder } from '../responders/hook/pre-edit/hook-pre-edit-responder';
import { isValidHookDataContract } from '../contracts/is-valid-hook-data/is-valid-hook-data-contract';
import { hookPreEditResponderResultContract } from '../contracts/hook-pre-edit-responder-result/hook-pre-edit-responder-result-contract';

// Mock dependencies
jest.mock('../responders/hook/pre-edit/hook-pre-edit-responder');
jest.mock('../contracts/is-valid-hook-data/is-valid-hook-data-contract');

const mockHookPreEditResponder = jest.mocked(HookPreEditResponder);
const mockIsValidHookDataContract = jest.mocked(isValidHookDataContract);

describe('start-pre-edit-hook', () => {
  let originalStderr: typeof process.stderr.write;
  let originalExit: typeof process.exit;
  let stderrOutput: string;
  let exitCode: number | undefined;

  beforeEach(() => {
    stderrOutput = '';
    exitCode = undefined;

    // Mock process.stderr.write
    originalStderr = process.stderr.write;
    process.stderr.write = jest.fn((chunk: string | Uint8Array): boolean => {
      stderrOutput += chunk.toString();
      return true;
    }) as typeof process.stderr.write;

    // Mock process.exit
    originalExit = process.exit;
    process.exit = jest.fn((code?: number): never => {
      exitCode = code;
      throw new Error(`process.exit called with code ${code}`);
    }) as typeof process.exit;

    mockHookPreEditResponder.mockReset();
    mockIsValidHookDataContract.mockReset();
  });

  afterEach(() => {
    process.stderr.write = originalStderr;
    process.exit = originalExit;
  });

  describe('StartPreEditHook', () => {
    it('VALID: {inputData: valid JSON with hook data} => processes successfully and exits 0', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'PreToolUse', data: {} });
      mockIsValidHookDataContract.mockReturnValueOnce(true);
      const resultStub = hookPreEditResponderResultContract.parse({ shouldBlock: false });
      mockHookPreEditResponder.mockResolvedValueOnce(resultStub);

      await expect(StartPreEditHook({ inputData })).rejects.toThrow(
        'process.exit called with code 0',
      );
      expect(exitCode).toBe(0);
      expect(mockIsValidHookDataContract).toHaveBeenCalledWith({ data: JSON.parse(inputData) });
      expect(mockHookPreEditResponder).toHaveBeenCalledWith({ input: JSON.parse(inputData) });
    });

    it('INVALID_INPUT: {inputData: invalid JSON} => exits with code 1', async () => {
      const inputData = 'invalid json';

      await expect(StartPreEditHook({ inputData })).rejects.toThrow(
        'process.exit called with code 1',
      );
      expect(exitCode).toBe(1);
      expect(stderrOutput).toContain('Hook error:');
    });

    it('INVALID_DATA: {inputData: JSON with invalid hook data} => exits with code 1', async () => {
      const inputData = JSON.stringify({ invalid: 'data' });
      mockIsValidHookDataContract.mockReturnValueOnce(false);

      await expect(StartPreEditHook({ inputData })).rejects.toThrow(
        'process.exit called with code 1',
      );
      expect(exitCode).toBe(1);
      expect(stderrOutput).toContain('Invalid hook data format');
    });

    it('BLOCK_EDIT: {inputData: valid data, shouldBlock: true} => exits with code 2', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'PreToolUse', data: {} });
      mockIsValidHookDataContract.mockReturnValueOnce(true);
      const resultStub = hookPreEditResponderResultContract.parse({
        shouldBlock: true,
        message: 'New violations detected',
      });
      mockHookPreEditResponder.mockResolvedValueOnce(resultStub);

      await expect(StartPreEditHook({ inputData })).rejects.toThrow(
        'process.exit called with code 2',
      );
      expect(exitCode).toBe(2);
      expect(stderrOutput).toContain('New violations detected');
    });

    it('BLOCK_EDIT: {inputData: valid data, shouldBlock: true, no message} => exits with default message', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'PreToolUse', data: {} });
      mockIsValidHookDataContract.mockReturnValueOnce(true);
      const resultStub = hookPreEditResponderResultContract.parse({ shouldBlock: true });
      mockHookPreEditResponder.mockResolvedValueOnce(resultStub);

      await expect(StartPreEditHook({ inputData })).rejects.toThrow(
        'process.exit called with code 2',
      );
      expect(exitCode).toBe(2);
      expect(stderrOutput).toContain('New violations detected');
    });

    it('ERROR: {inputData: valid data, responder throws} => exits with code 1', async () => {
      const inputData = JSON.stringify({ hook_event_name: 'PreToolUse', data: {} });
      const error = new Error('Responder error');
      mockIsValidHookDataContract.mockReturnValueOnce(true);
      mockHookPreEditResponder.mockRejectedValueOnce(error);

      await expect(StartPreEditHook({ inputData })).rejects.toThrow(
        'process.exit called with code 1',
      );
      expect(exitCode).toBe(1);
      expect(stderrOutput).toContain('Hook error: Responder error');
    });
  });
});
