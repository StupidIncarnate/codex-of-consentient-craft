import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitWorktreePruneAdapter } from './git-worktree-prune-adapter';
import { gitWorktreePruneAdapterProxy } from './git-worktree-prune-adapter.proxy';

describe('gitWorktreePruneAdapter', () => {
  describe('success', () => {
    it('VALID: {git worktree prune exits 0} => returns exit code 0 and combined output', async () => {
      const proxy = gitWorktreePruneAdapterProxy();
      proxy.setupSuccess();

      const result = await gitWorktreePruneAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });

    it('VALID: {cwd} => spawns `git worktree prune` in cwd', async () => {
      const proxy = gitWorktreePruneAdapterProxy();
      proxy.setupSuccess();
      const cwd = AbsoluteFilePathStub({ value: '/project' });

      await gitWorktreePruneAdapter({ cwd });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['worktree', 'prune']);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });
  });

  describe('failure', () => {
    it('ERROR: {git worktree prune exits non-zero} => returns exit code and git error text', async () => {
      const proxy = gitWorktreePruneAdapterProxy();
      proxy.setupFailure({ output: 'fatal: not a git repository' });

      const result = await gitWorktreePruneAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual({
        exitCode: 128,
        output: 'fatal: not a git repository',
      });
    });
  });
});
