import { StartPreEditHook } from './start-pre-edit-hook';
import { EditToolHookStub } from '../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data.stub';

const TestStateStub = ({ exitCalled = false }: { exitCalled?: boolean } = {}): {
  exitCalled: boolean;
} => ({
  exitCalled,
});

describe('start-pre-edit-hook', () => {
  describe('StartPreEditHook', () => {
    it('VALID: {inputData: valid pre-tool-use hook data} => calls responder and exits', async () => {
      const originalExit = process.exit;
      const state = TestStateStub();

      process.exit = jest.fn((): never => {
        state.exitCalled = true;
        throw new Error('exit called');
      }) as typeof process.exit;

      const hookData = EditToolHookStub();
      const inputData = JSON.stringify(hookData);

      await expect(StartPreEditHook({ inputData })).rejects.toThrow('exit called');

      process.exit = originalExit;

      expect(state.exitCalled).toBe(true);
    });
  });
});
