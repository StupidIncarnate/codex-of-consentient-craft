import { AbsoluteFilePathStub, QuestBranchNameStub } from '@dungeonmaster/shared/contracts';

import { worktreeResumeRestoreBroker } from './worktree-resume-restore-broker';
import { worktreeResumeRestoreBrokerProxy } from './worktree-resume-restore-broker.proxy';

describe('worktreeResumeRestoreBroker', () => {
  describe('already on the quest branch', () => {
    it('VALID: {worktree already on the quest branch} => returns restored true and runs no checkout', async () => {
      const proxy = worktreeResumeRestoreBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupOnBranch({ branchName });

      const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

      expect(result).toStrictEqual({
        restored: true,
        currentBranch: 'quest/add-auth-7bc217a1',
        output: 'quest/add-auth-7bc217a1',
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([['rev-parse', '--abbrev-ref', 'HEAD']]);
    });
  });

  describe('worktree drifted to another branch', () => {
    it('VALID: {worktree on some other branch} => runs `git checkout <branch>` with exactly [checkout, branchName] and returns restored true', async () => {
      const proxy = worktreeResumeRestoreBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupDrifted({ currentBranchName: 'main' });
      proxy.setupCheckoutSucceeds({ branchName });

      const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

      expect(result).toStrictEqual({ restored: true, currentBranch: 'main', output: '' });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        ['checkout', branchName],
      ]);
    });
  });

  describe('detached HEAD', () => {
    it('EDGE: {rev-parse prints "HEAD" from a detached worktree} => runs checkout and returns restored true', async () => {
      const proxy = worktreeResumeRestoreBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupDetachedHead();
      proxy.setupCheckoutSucceeds({ branchName });

      const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

      expect(result).toStrictEqual({ restored: true, currentBranch: 'HEAD', output: '' });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        ['checkout', branchName],
      ]);
    });
  });

  describe('rev-parse fails', () => {
    it('ERROR: {git rev-parse exits non-zero} => returns restored false and runs no checkout', async () => {
      const proxy = worktreeResumeRestoreBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupRevParseFails({
        output: 'fatal: not a git repository (or any of the parent directories): .git',
      });

      const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

      expect(result).toStrictEqual({
        restored: false,
        currentBranch: 'fatal: not a git repository (or any of the parent directories): .git',
        output: 'fatal: not a git repository (or any of the parent directories): .git',
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([['rev-parse', '--abbrev-ref', 'HEAD']]);
    });
  });

  describe('checkout fails', () => {
    it('ERROR: {git checkout exits non-zero} => returns restored false carrying gits stderr text in output', async () => {
      const proxy = worktreeResumeRestoreBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupDrifted({ currentBranchName: 'main' });
      proxy.setupCheckoutFails({
        branchName,
        output: "error: pathspec 'quest/add-auth-7bc217a1' did not match any file(s) known to git",
      });

      const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

      expect(result).toStrictEqual({
        restored: false,
        currentBranch: 'main',
        output: "error: pathspec 'quest/add-auth-7bc217a1' did not match any file(s) known to git",
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        ['checkout', branchName],
      ]);
    });
  });

  describe('rev-parse output carries a trailing warning line', () => {
    it('EDGE: {rev-parse output carries a git warning line after the branch name} => branch name is read from the first line so no redundant checkout runs', async () => {
      const proxy = worktreeResumeRestoreBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' });
      const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
      proxy.setupBranchWithTrailingWarning({
        branchName,
        warning: 'warning: adjusting to origin/quest/add-auth-7bc217a1',
      });

      const result = await worktreeResumeRestoreBroker({ worktreePath, branchName });

      expect(result).toStrictEqual({
        restored: true,
        currentBranch: 'quest/add-auth-7bc217a1',
        output: 'quest/add-auth-7bc217a1\nwarning: adjusting to origin/quest/add-auth-7bc217a1',
      });
      expect(proxy.getSpawnedArgsList()).toStrictEqual([['rev-parse', '--abbrev-ref', 'HEAD']]);
    });
  });
});
