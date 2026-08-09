import { AbsoluteFilePathStub, QuestBranchNameStub } from '@dungeonmaster/shared/contracts';

import { gitCheckoutAdapter } from './git-checkout-adapter';
import { gitCheckoutAdapterProxy } from './git-checkout-adapter.proxy';

describe('gitCheckoutAdapter', () => {
  describe('success', () => {
    it('VALID: {git checkout exits 0} => returns exit code 0 and combined output', async () => {
      const proxy = gitCheckoutAdapterProxy();
      proxy.setupSuccess();

      const result = await gitCheckoutAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
        branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });

    it('VALID: {branchName, cwd} => spawns `git checkout <branch>` in cwd with no force or path flags', async () => {
      const proxy = gitCheckoutAdapterProxy();
      proxy.setupSuccess();
      const cwd = AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' });
      const branchName = QuestBranchNameStub({ value: 'quest/foo-7bc21741' });

      await gitCheckoutAdapter({ cwd, branchName });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['checkout', branchName]);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });
  });

  describe('failure', () => {
    it('ERROR: {git checkout exits non-zero} => returns exit code and git error text', async () => {
      const proxy = gitCheckoutAdapterProxy();
      proxy.setupFailure({
        output: "error: pathspec 'quest/foo-7bc21741' did not match any file(s) known to git",
      });

      const result = await gitCheckoutAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
        branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({
        exitCode: 128,
        output: "error: pathspec 'quest/foo-7bc21741' did not match any file(s) known to git",
      });
    });
  });
});
