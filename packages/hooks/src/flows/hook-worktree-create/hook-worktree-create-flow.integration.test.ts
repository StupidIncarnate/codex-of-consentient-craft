import { HookWorktreeCreateFlow } from './hook-worktree-create-flow';

describe('HookWorktreeCreateFlow', () => {
  describe('delegation to responder', () => {
    it('ERROR: {inputData: invalid JSON} => returns exitCode 1 with error in stderr', () => {
      const result = HookWorktreeCreateFlow({ inputData: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^.*Hook error.*$/su),
      });
    });

    it('ERROR: {inputData: missing required fields} => returns exitCode 1 with error in stderr', () => {
      const result = HookWorktreeCreateFlow({ inputData: JSON.stringify({ session_id: 'abc' }) });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^.*Hook error.*$/su),
      });
    });
  });
});
