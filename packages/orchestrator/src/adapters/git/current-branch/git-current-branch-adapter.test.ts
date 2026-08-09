import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitCurrentBranchAdapter } from './git-current-branch-adapter';
import { gitCurrentBranchAdapterProxy } from './git-current-branch-adapter.proxy';

describe('gitCurrentBranchAdapter', () => {
  describe('success', () => {
    it('VALID: {git rev-parse --abbrev-ref HEAD prints "quest/foo-7bc21741\\n"} => returns trimmed branch name', async () => {
      const proxy = gitCurrentBranchAdapterProxy();
      proxy.setupBranch({ branchName: 'quest/foo-7bc21741' });

      const result = await gitCurrentBranchAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({ exitCode: 0, output: 'quest/foo-7bc21741' });
    });

    it('VALID: {cwd} => spawns `git rev-parse --abbrev-ref HEAD` in cwd', async () => {
      const proxy = gitCurrentBranchAdapterProxy();
      proxy.setupBranch({ branchName: 'main' });
      const cwd = AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' });

      await gitCurrentBranchAdapter({ cwd });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['rev-parse', '--abbrev-ref', 'HEAD']);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });
  });

  describe('failure', () => {
    it('ERROR: {git rev-parse --abbrev-ref HEAD exits non-zero} => returns exit code and git error text', async () => {
      const proxy = gitCurrentBranchAdapterProxy();
      proxy.setupFailure({
        output: 'fatal: not a git repository (or any of the parent directories): .git',
      });

      const result = await gitCurrentBranchAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({
        exitCode: 128,
        output: 'fatal: not a git repository (or any of the parent directories): .git',
      });
    });
  });
});
