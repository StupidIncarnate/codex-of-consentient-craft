import { HookWorktreeCreateFlow } from './hook-worktree-create-flow';
import { WorktreeCreateHookDataStub } from '../../contracts/worktree-create-hook-data/worktree-create-hook-data.stub';

describe('HookWorktreeCreateFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {a well-formed WorktreeCreate payload} => exits 2 with the refusal on stderr and nothing on stdout', () => {
      const result = HookWorktreeCreateFlow({
        inputData: JSON.stringify(WorktreeCreateHookDataStub({ name: 'my-wt' })),
      });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr:
          'Worktrees are created with `mcp__dungeonmaster__create-worktree({ name })`. It puts them under `worktrees/`.\n',
      });
    });

    it('ERROR: {inputData: invalid JSON} => returns exitCode 1 with error in stderr', () => {
      const result = HookWorktreeCreateFlow({ inputData: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n$/su),
      });
    });

    it('ERROR: {inputData: missing required fields} => returns exitCode 1 with error in stderr', () => {
      const result = HookWorktreeCreateFlow({ inputData: JSON.stringify({ session_id: 'abc' }) });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .+\n$/su),
      });
    });
  });
});
