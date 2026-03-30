import { StartWorktreeCreateHook } from './start-worktree-create-hook';

const TestStateStub = ({ exitCalled = false }: { exitCalled?: boolean } = {}): {
  exitCalled: boolean;
} => ({
  exitCalled,
});

describe('start-worktree-create-hook', () => {
  describe('StartWorktreeCreateHook', () => {
    it('VALID: {inputData: invalid JSON} => calls process.exit with error code', () => {
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

      expect(() => {
        StartWorktreeCreateHook({ inputData: 'not json' });
      }).toThrow('exit called');

      process.exit = originalExit;
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;

      expect(state.exitCalled).toBe(true);
    });
  });
});
