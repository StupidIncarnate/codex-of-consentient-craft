import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitWorktreeRemoveAdapter } from './git-worktree-remove-adapter';
import { gitWorktreeRemoveAdapterProxy } from './git-worktree-remove-adapter.proxy';

describe('gitWorktreeRemoveAdapter', () => {
  describe('success', () => {
    it('VALID: {git worktree remove --force exits 0} => returns exit code 0 and combined output', async () => {
      const proxy = gitWorktreeRemoveAdapterProxy();
      proxy.setupSuccess();

      const result = await gitWorktreeRemoveAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        worktreePath: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });

    it('VALID: {worktreePath, cwd} => spawns `git worktree remove --force <path>` in cwd', async () => {
      const proxy = gitWorktreeRemoveAdapterProxy();
      proxy.setupSuccess();
      const cwd = AbsoluteFilePathStub({ value: '/project' });
      const worktreePath = AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' });

      await gitWorktreeRemoveAdapter({ cwd, worktreePath });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['worktree', 'remove', '--force', worktreePath]);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });
  });

  describe('failure', () => {
    it('ERROR: {git worktree remove --force exits non-zero} => returns exit code and git error text', async () => {
      const proxy = gitWorktreeRemoveAdapterProxy();
      proxy.setupFailure({ output: 'fatal: no worktree found' });

      const result = await gitWorktreeRemoveAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        worktreePath: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({ exitCode: 128, output: 'fatal: no worktree found' });
    });
  });
});
