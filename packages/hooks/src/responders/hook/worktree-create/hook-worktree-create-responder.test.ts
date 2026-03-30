import { HookWorktreeCreateResponder } from './hook-worktree-create-responder';
import { HookWorktreeCreateResponderProxy } from './hook-worktree-create-responder.proxy';
import { WorktreeCreateHookDataStub } from '../../../contracts/worktree-create-hook-data/worktree-create-hook-data.stub';

describe('HookWorktreeCreateResponder', () => {
  describe('success', () => {
    it('VALID: {valid worktree input} => returns worktreePath', () => {
      const proxy = HookWorktreeCreateResponderProxy();
      const input = WorktreeCreateHookDataStub();

      proxy.setupSuccess();

      const result = HookWorktreeCreateResponder({ input });

      expect(result).toStrictEqual({
        worktreePath: input.worktree_path,
      });
    });
  });

  describe('git worktree add failure', () => {
    it('ERROR: {git worktree add fails} => throws error', () => {
      const proxy = HookWorktreeCreateResponderProxy();
      const input = WorktreeCreateHookDataStub();

      proxy.setupGitFailure({ error: new Error('fatal: branch already exists') });

      expect(() => HookWorktreeCreateResponder({ input })).toThrow(
        /Failed to execute command: git worktree add/u,
      );
    });
  });

  describe('npm build failure', () => {
    it('ERROR: {npm run build fails} => throws error', () => {
      const proxy = HookWorktreeCreateResponderProxy();
      const input = WorktreeCreateHookDataStub();

      proxy.setupBuildFailure({ error: new Error('Build failed') });

      expect(() => HookWorktreeCreateResponder({ input })).toThrow(
        /Failed to execute command: npm run build/u,
      );
    });
  });
});
