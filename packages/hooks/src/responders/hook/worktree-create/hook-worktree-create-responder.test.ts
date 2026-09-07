import { HookWorktreeCreateResponder } from './hook-worktree-create-responder';
import { HookWorktreeCreateResponderProxy } from './hook-worktree-create-responder.proxy';

describe('HookWorktreeCreateResponder', () => {
  describe('blocking the worktree', () => {
    it('VALID: {called} => returns the message naming create-worktree, on stderr', () => {
      HookWorktreeCreateResponderProxy();

      const result = HookWorktreeCreateResponder();

      expect(result.stderr).toBe(
        'Worktrees are created with `mcp__dungeonmaster__create-worktree({ name })`. It puts them under `worktrees/`.\n',
      );
    });

    it('VALID: {called} => exits 2, the code Claude Code reads as a block', () => {
      HookWorktreeCreateResponderProxy();

      const result = HookWorktreeCreateResponder();

      expect(result.exitCode).toBe(2);
    });

    it('VALID: {called} => returns nothing but the refusal — no path, no created worktree', () => {
      HookWorktreeCreateResponderProxy();

      const result = HookWorktreeCreateResponder();

      expect(result).toStrictEqual({
        stderr:
          'Worktrees are created with `mcp__dungeonmaster__create-worktree({ name })`. It puts them under `worktrees/`.\n',
        exitCode: 2,
      });
    });
  });
});
