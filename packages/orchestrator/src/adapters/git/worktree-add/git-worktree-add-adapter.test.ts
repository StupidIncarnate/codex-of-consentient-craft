import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  QuestBranchNameStub,
} from '@dungeonmaster/shared/contracts';

import { gitWorktreeAddAdapter } from './git-worktree-add-adapter';
import { gitWorktreeAddAdapterProxy } from './git-worktree-add-adapter.proxy';

describe('gitWorktreeAddAdapter', () => {
  describe('success', () => {
    it('VALID: {git worktree add exits 0} => returns exit code 0 and combined output', async () => {
      const proxy = gitWorktreeAddAdapterProxy();
      proxy.setupSuccess();

      const result = await gitWorktreeAddAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        worktreePath: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
        branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
        baseBranch: BaseBranchNameStub({ value: 'main' }),
        mode: 'create-branch',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });

    it('VALID: {mode: create-branch} => spawns `git worktree add <path> -b <branch> <base>` in cwd', async () => {
      const proxy = gitWorktreeAddAdapterProxy();
      proxy.setupSuccess();
      const cwd = AbsoluteFilePathStub({ value: '/project' });
      const worktreePath = AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' });
      const branchName = QuestBranchNameStub({ value: 'quest/foo-7bc21741' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });

      await gitWorktreeAddAdapter({
        cwd,
        worktreePath,
        branchName,
        baseBranch,
        mode: 'create-branch',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        'worktree',
        'add',
        worktreePath,
        '-b',
        branchName,
        baseBranch,
      ]);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });

    // `-b` and the base branch are BOTH absent here, not just `-b`: an existing branch carries its
    // own tip, and naming a base would move the quest's work onto a fresh fork point.
    it('VALID: {mode: attach-existing} => spawns `git worktree add <path> <branch>` with no -b and no base branch', async () => {
      const proxy = gitWorktreeAddAdapterProxy();
      proxy.setupSuccess();
      const cwd = AbsoluteFilePathStub({ value: '/project' });
      const worktreePath = AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' });
      const branchName = QuestBranchNameStub({ value: 'quest/foo-7bc21741' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });

      await gitWorktreeAddAdapter({
        cwd,
        worktreePath,
        branchName,
        baseBranch,
        mode: 'attach-existing',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['worktree', 'add', worktreePath, branchName]);
      expect(proxy.getSpawnedCwd()).toBe(cwd);
    });
  });

  describe('failure', () => {
    it('ERROR: {git worktree add exits non-zero} => returns exit code and git error text', async () => {
      const proxy = gitWorktreeAddAdapterProxy();
      proxy.setupFailure({ output: "fatal: 'quest/foo-7bc21741' already exists" });

      const result = await gitWorktreeAddAdapter({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
        worktreePath: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
        branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
        baseBranch: BaseBranchNameStub({ value: 'main' }),
        mode: 'create-branch',
      });

      expect(result).toStrictEqual({
        exitCode: 128,
        output: "fatal: 'quest/foo-7bc21741' already exists",
      });
    });
  });
});
