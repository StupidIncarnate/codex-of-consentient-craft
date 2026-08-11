import { AbsoluteFilePathStub, QuestBranchNameStub } from '@dungeonmaster/shared/contracts';

import { worktreeDiscardBroker } from './worktree-discard-broker';
import { worktreeDiscardBrokerProxy } from './worktree-discard-broker.proxy';

describe('worktreeDiscardBroker', () => {
  describe('both steps succeed', () => {
    it('VALID: {remove exits 0, delete exits 0} => returns discarded true with empty output', async () => {
      const proxy = worktreeDiscardBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupBothSucceed();

      const result = await worktreeDiscardBroker({ repoRoot, worktreePath, branchName });

      expect(result).toStrictEqual({ discarded: true, output: '' });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'remove', '--force', worktreePath],
        ['branch', '-D', branchName],
      ]);
    });
  });

  describe('worktree remove fails', () => {
    it('ERROR: {git worktree remove exits non-zero} => returns discarded false carrying remove output and never spawns branch delete', async () => {
      const proxy = worktreeDiscardBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupRemoveFails({ worktreePath, output: 'fatal: working tree is dirty' });

      const result = await worktreeDiscardBroker({ repoRoot, worktreePath, branchName });

      expect(result).toStrictEqual({ discarded: false, output: 'fatal: working tree is dirty' });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'remove', '--force', worktreePath],
      ]);
    });
  });

  describe('branch delete fails', () => {
    it('ERROR: {remove exits 0, git branch -D exits non-zero} => returns discarded false carrying delete output', async () => {
      const proxy = worktreeDiscardBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupDeleteFails({
        worktreePath,
        branchName,
        output: 'error: Cannot delete branch checked out',
      });

      const result = await worktreeDiscardBroker({ repoRoot, worktreePath, branchName });

      expect(result).toStrictEqual({
        discarded: false,
        output: 'error: Cannot delete branch checked out',
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['worktree', 'remove', '--force', worktreePath],
        ['branch', '-D', branchName],
      ]);
    });
  });
});
