import { StartSubagentStartHook } from './start-subagent-start-hook';
import { SubagentStartHookDataStub } from '../contracts/subagent-start-hook-data/subagent-start-hook-data.stub';

const TestStateStub = ({ exitCalled = false }: { exitCalled?: boolean } = {}): {
  exitCalled: boolean;
} => ({
  exitCalled,
});

describe('start-subagent-start-hook', () => {
  describe('StartSubagentStartHook', () => {
    it('VALID: {inputData: valid subagent start hook data} => calls responder and exits', () => {
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

      const hookData = SubagentStartHookDataStub();
      const inputData = JSON.stringify(hookData);

      expect(() => {
        StartSubagentStartHook({ inputData });
      }).toThrow('exit called');

      process.exit = originalExit;
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;

      expect(state.exitCalled).toBe(true);
    });
  });
});
