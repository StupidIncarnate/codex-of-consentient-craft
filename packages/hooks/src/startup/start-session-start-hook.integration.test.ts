import { StartSessionStartHook } from './start-session-start-hook';
import { SessionStartHookStub } from '../contracts/session-start-hook-data/session-start-hook-data.stub';

const TestStateStub = ({ exitCalled = false }: { exitCalled?: boolean } = {}): {
  exitCalled: boolean;
} => ({
  exitCalled,
});

describe('start-session-start-hook', () => {
  describe('StartSessionStartHook', () => {
    it('VALID: {inputData: valid session start hook data} => calls responder and exits', async () => {
      const originalExit = process.exit;
      const originalStdoutWrite = process.stdout.write;
      const originalStderrWrite = process.stderr.write;
      const state = TestStateStub();

      process.exit = jest.fn((): never => {
        state.exitCalled = true;
        throw new Error('exit called');
      }) as typeof process.exit;
      process.stdout.write = jest.fn() as typeof process.stdout.write;
      process.stderr.write = jest.fn() as typeof process.stderr.write;

      const hookData = SessionStartHookStub();
      const inputData = JSON.stringify(hookData);

      await expect(StartSessionStartHook({ inputData })).rejects.toThrow('exit called');

      process.exit = originalExit;
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;

      expect(state.exitCalled).toBe(true);
    });
  });
});
