import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  QuestBranchNameStub,
} from '@dungeonmaster/shared/contracts';

import { worktreePrepareBroker } from './worktree-prepare-broker';
import { worktreePrepareBrokerProxy } from './worktree-prepare-broker.proxy';

describe('worktreePrepareBroker', () => {
  describe('happy path', () => {
    it('VALID: {worktree add and rev-parse both succeed} => returns the fork-point sha, spawning exactly those two git calls and never touching discard', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = '1234567890abcdef1234567890abcdef12345678';
      proxy.setupHappyPath({ worktreePath, branchName, baseBranch, sha });

      const result = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      });

      expect(result).toStrictEqual({ baseRef: sha });
      // The probe comes FIRST and answers "no such branch", which is what selects `-b`. No prune:
      // there is no registration to clear for a branch that does not exist.
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
      ]);
    });
  });

  describe('the branch already exists — a re-carve after the directory was deleted', () => {
    it('VALID: {branch resolves in git} => prunes the stale registration and attaches WITHOUT -b instead of refusing', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      const sha = 'fedcba9876543210fedcba9876543210fedcba98';
      proxy.setupAttachExistingBranch({ worktreePath, branchName, sha });

      const result = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      });

      expect(result).toStrictEqual({ baseRef: sha });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'prune'],
        ['worktree', 'add', worktreePath, branchName],
        ['rev-parse', 'HEAD'],
      ]);
    });

    it('ERROR: {attached branch, rev-parse HEAD exits non-zero} => rejects WITHOUT discarding, so the branch keeps the commits this call did not create', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupAttachExistingBranchHeadShaFails({ worktreePath, branchName });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fork-point sha could not be read`,
      });
      // No `worktree remove` and no `branch -D` — the discard would delete the quest's own branch.
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'prune'],
        ['worktree', 'add', worktreePath, branchName],
        ['rev-parse', 'HEAD'],
      ]);
    });
  });

  describe('worktree creation fails', () => {
    it('ERROR: {git worktree add exits non-zero} => rejects at step create naming the worktree path, without attempting discard or reading the fork-point sha', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupWorktreeAddFails({
        worktreePath,
        branchName,
        baseBranch,
        output: "fatal: 'quest/add-auth-7bc217a1' already exists",
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fatal: 'quest/add-auth-7bc217a1' already exists`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
      ]);
    });
  });

  describe('fork-point sha cannot be read', () => {
    it('ERROR: {git rev-parse HEAD exits non-zero} => rejects at step create and discards the worktree', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupHeadShaFailsDiscardSucceeds({ worktreePath, branchName, baseBranch });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fork-point sha could not be read`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
        ['branch', '-D', branchName],
      ]);
    });
  });

  describe('fork-point sha fails and the discard cleanup also fails', () => {
    it('ERROR: {rev-parse HEAD fails, git worktree remove also exits non-zero} => rejects carrying BOTH the original cause and the cleanup output', async () => {
      const proxy = worktreePrepareBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      const baseBranch = BaseBranchNameStub({ value: 'main' });
      proxy.setupHeadShaFailsDiscardAlsoFails({
        worktreePath,
        branchName,
        baseBranch,
        removeFailureOutput: 'EBUSY: resource busy',
      });

      const error = await worktreePrepareBroker({
        repoRoot,
        worktreePath,
        branchName,
        baseBranch,
      }).catch((thrown: unknown) => thrown);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${worktreePath}: fork-point sha could not be read (worktree cleanup also failed: EBUSY: resource busy)`,
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', branchName],
        ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
        ['rev-parse', 'HEAD'],
        ['worktree', 'remove', '--force', worktreePath],
      ]);
    });
  });
});
