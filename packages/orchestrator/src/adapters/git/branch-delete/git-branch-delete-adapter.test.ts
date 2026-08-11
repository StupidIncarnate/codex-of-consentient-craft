import { AbsoluteFilePathStub, QuestBranchNameStub } from '@dungeonmaster/shared/contracts';

import { gitBranchDeleteAdapter } from './git-branch-delete-adapter';
import { gitBranchDeleteAdapterProxy } from './git-branch-delete-adapter.proxy';

describe('gitBranchDeleteAdapter', () => {
  describe('success', () => {
    it('VALID: {git branch -D exits 0} => returns exit code 0 and combined output', async () => {
      const proxy = gitBranchDeleteAdapterProxy();
      proxy.setupSuccess();

      const result = await gitBranchDeleteAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });

    it('VALID: {branchName, cwd} => spawns `git branch -D <branchName>` in cwd', async () => {
      const proxy = gitBranchDeleteAdapterProxy();
      proxy.setupSuccess();
      const cwd = AbsoluteFilePathStub({ value: '/project' });
      const branchName = QuestBranchNameStub({ value: 'quest/foo-7bc21741' });

      await gitBranchDeleteAdapter({ cwd, branchName });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['branch', '-D', branchName]);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });
  });

  describe('failure', () => {
    it('ERROR: {git branch -D exits non-zero} => returns exit code and git error text', async () => {
      const proxy = gitBranchDeleteAdapterProxy();
      proxy.setupFailure({ output: "error: branch 'quest/foo-7bc21741' not found" });

      const result = await gitBranchDeleteAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
      });

      expect(result).toStrictEqual({
        exitCode: 1,
        output: "error: branch 'quest/foo-7bc21741' not found",
      });
    });
  });
});
